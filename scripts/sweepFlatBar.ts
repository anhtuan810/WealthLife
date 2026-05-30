// Flat-bar candidate sweep. Drives the 240-run matrix once (4 starts ×
// seeds × policies), then RESCORES every final player under each
// candidate flat bar {0.55, 0.60, 0.65, 0.70} by passing the bar as the
// explicit `target` arg to computeGrade. grade.ts is untouched; only
// the harness varies the bar.
//
// Reports per-(start × bar):
//   - grade histogram (S/A/B/C/D)
//   - median grade letter
//   - median score
//   - midlife "best-played reaches A/S?" check
//
// Goal of the brief: a real grade RANGE (not auto-S), established no
// longer auto-S off a free pass, midlife hard-but-fair (A/S still
// reachable with great play).

declare const console: { log: (...args: unknown[]) => void };

import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
  RUN_TARGET_AGE_DEFAULT,
} from '../src/data/constants';
import { ALL_EVENTS } from '../src/content';
import {
  createPlayerFromStartPoint,
  type Phase,
  type Player,
} from '../src/game/player';
import { tick } from '../src/game/tick';
import {
  applyChoice,
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../src/systems/eventEngine';
import { decideBeat } from '../src/systems/pacingController';
import { computeGrade, type GradeLetter } from '../src/systems/grade';
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import { START_POINTS, type StartPointId } from '../src/data/startPoints';
import type { Ending, GameEvent } from '../src/types/events';

const log = (msg: string) => console.log(msg);

// ── step mirror ─────────────────────────────────────────────────────────
function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}
function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;
  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return { ...p, phase: 'career', flags: addUniqueFlag(p.flags, 'undecided') };
  }
  return p;
}
const LATER_PHASE_ORDER: ReadonlyArray<Exclude<Phase, 'foundation'>> = [
  'career',
  'growth',
  'freedom',
];
function maybeAdvancePhase(p: Player): Player {
  if (p.phase === 'foundation') return p;
  let target: Exclude<Phase, 'foundation'> = 'career';
  for (const phase of LATER_PHASE_ORDER) {
    if (p.age >= PHASE_START_AGES[phase]) target = phase;
  }
  const cur = LATER_PHASE_ORDER.indexOf(p.phase as Exclude<Phase, 'foundation'>);
  const tgt = LATER_PHASE_ORDER.indexOf(target);
  if (tgt <= cur) return p;
  return { ...p, phase: target };
}
function expirePending(player: Player): Player {
  if (player.pendingDecisions.length === 0) return player;
  const surviving: Player['pendingDecisions'] = [];
  const expiredIds: string[] = [];
  for (const p of player.pendingDecisions) {
    if (p.expiryMonth <= player.month) expiredIds.push(p.eventId);
    else surviving.push(p);
  }
  if (expiredIds.length === 0) return player;
  const firedSet = new Set(player.firedEventIds);
  for (const id of expiredIds) firedSet.add(id);
  let next: Player = {
    ...player,
    pendingDecisions: surviving,
    firedEventIds: Array.from(firedSet),
  };
  for (const id of expiredIds) {
    const event = ALL_EVENTS.find((e) => e.id === id);
    if (!event?.onLapse) continue;
    next = applyChoice(next, event, {
      id: `${event.id}__lapse`,
      label: '',
      effects: event.onLapse.effects ?? {},
      setsFlags: event.onLapse.setsFlags,
    });
  }
  return next;
}
type Step = {
  player: Player;
  msle: number;
  currentEvent: GameEvent | null;
  gameOver: boolean;
  ending: Ending | null;
};
function step(player: Player, msle: number): Step {
  const ticked = expirePending(tick(player));
  const phased = maybeAdvancePhase(maybeTransitionToCareer(ticked));
  const nextMsle = msle + 1;
  if (phased.age >= phased.targetAge) {
    return {
      player: phased,
      msle: nextMsle,
      currentEvent: null,
      gameOver: true,
      ending: evaluateEndings(phased),
    };
  }
  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriority = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMsle,
    hasPriorityEligible: hasPriority,
  });
  if (beat === 'quiet') {
    return { player: phased, msle: nextMsle, currentEvent: null, gameOver: false, ending: null };
  }
  const event = pickEvent(eligible, beat);
  return { player: phased, msle: nextMsle, currentEvent: event, gameOver: false, ending: null };
}

type Row = {
  startPoint: StartPointId;
  finalPlayer: Player;
  coverageRaw: number; // raw passive/expenses (unclamped)
};

function driveRun(
  startPoint: StartPointId,
  direction: 'corporate' | 'founder' | 'freelancer' | undefined,
  seed: number,
  policyIdx: number,
): Row {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player =
      startPoint === 'university'
        ? createPlayerFromStartPoint(startPoint)
        : createPlayerFromStartPoint(startPoint, direction);
    const policy = POLICIES[policyIdx];
    let msle = 0;
    const monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;
    for (let mc = 0; mc < monthCap; mc++) {
      const s = step(player, msle);
      player = s.player;
      msle = s.msle;
      if (s.gameOver) break;
      if (s.currentEvent) {
        const idx = policy.pickIndex(s.currentEvent, rng);
        const choice = s.currentEvent.choices[idx] ?? s.currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, s.currentEvent, choice);
          msle = 0;
        }
      }
    }
    const coverageRaw =
      player.expenses > 0 ? player.passiveIncome / player.expenses : 0;
    return { startPoint, finalPlayer: player, coverageRaw };
  });
}

const SEEDS = [11, 47, 131, 199];
const CASES: Array<{
  startPoint: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
}> = [
  { startPoint: 'university', direction: undefined },
  { startPoint: 'early', direction: 'corporate' },
  { startPoint: 'early', direction: 'founder' },
  { startPoint: 'early', direction: 'freelancer' },
  { startPoint: 'established', direction: 'corporate' },
  { startPoint: 'established', direction: 'founder' },
  { startPoint: 'established', direction: 'freelancer' },
  { startPoint: 'midlife', direction: 'corporate' },
  { startPoint: 'midlife', direction: 'founder' },
  { startPoint: 'midlife', direction: 'freelancer' },
];
const rows: Row[] = [];
for (const c of CASES) {
  for (const s of SEEDS) {
    for (let p = 0; p < POLICIES.length; p++) {
      rows.push(driveRun(c.startPoint, c.direction, s, p));
    }
  }
}

// ── helpers ────────────────────────────────────────────────────────────
function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}
function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] * (1 - (pos - lo)) + sortedAsc[hi] * (pos - lo);
}
const LETTER_RANK: Record<GradeLetter, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const RANK_LETTER: Record<number, GradeLetter> = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' };
type Histogram = Record<GradeLetter, number>;
const emptyHist = (): Histogram => ({ S: 0, A: 0, B: 0, C: 0, D: 0 });
function medianLetter(letters: GradeLetter[]): GradeLetter {
  if (letters.length === 0) return 'D';
  const ranks = letters.map((l) => LETTER_RANK[l]).sort((a, b) => a - b);
  return RANK_LETTER[ranks[Math.floor(ranks.length / 2)]] ?? 'D';
}

// ── per-start coverage spread (bar-independent) ────────────────────────
log('# FLAT-BAR CANDIDATE SWEEP');
log('');
log('## coverage spread per start (bar-independent — same data every candidate)');
log(`  ${pad('start', 12)} ${padL('n', 4)}  ${padL('min', 4)} ${padL('p50', 4)} ${padL('p90', 4)} ${padL('max', 4)}  ${padL('mean', 5)}`);
const startOrder: StartPointId[] = ['university', 'early', 'established', 'midlife'];
for (const sp of startOrder) {
  const list = rows.filter((r) => r.startPoint === sp).map((r) => r.coverageRaw * 100);
  const sorted = [...list].sort((a, b) => a - b);
  const mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
  log(
    `  ${pad(sp, 12)} ${padL(list.length, 4)}  ${padL(Math.round(sorted[0]), 4)} ${padL(Math.round(quantile(sorted, 0.5)), 4)} ${padL(Math.round(quantile(sorted, 0.9)), 4)} ${padL(Math.round(sorted[sorted.length - 1]), 4)}  ${padL((Math.round(mean * 10) / 10).toFixed(1), 5)}`,
  );
}
log('');

// ── grade histograms under each candidate bar ──────────────────────────
const BARS: number[] = [0.55, 0.60, 0.65, 0.70];

for (const bar of BARS) {
  log(`## candidate bar = ${bar.toFixed(2)}`);
  log(`  ${pad('start', 12)} ${padL('n', 4)}  ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}  ${pad('median', 7)} ${padL('med score', 11)}`);
  const histByStart: Record<StartPointId, Histogram> = {
    university: emptyHist(),
    early: emptyHist(),
    established: emptyHist(),
    midlife: emptyHist(),
  };
  const lettersByStart: Record<StartPointId, GradeLetter[]> = {
    university: [],
    early: [],
    established: [],
    midlife: [],
  };
  const scoresByStart: Record<StartPointId, number[]> = {
    university: [],
    early: [],
    established: [],
    midlife: [],
  };
  for (const r of rows) {
    const g = computeGrade(r.finalPlayer, bar);
    histByStart[r.startPoint][g.letter] += 1;
    lettersByStart[r.startPoint].push(g.letter);
    scoresByStart[r.startPoint].push(g.score);
  }
  for (const sp of startOrder) {
    const h = histByStart[sp];
    const ml = medianLetter(lettersByStart[sp]);
    const scoresSorted = [...scoresByStart[sp]].sort((a, b) => a - b);
    const medScore = Math.round(quantile(scoresSorted, 0.5));
    log(
      `  ${pad(sp, 12)} ${padL(lettersByStart[sp].length, 4)}  ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}  ${pad(ml, 7)} ${padL(medScore, 11)}`,
    );
  }
  // fairness for midlife
  const midRows = rows.filter((r) => r.startPoint === 'midlife');
  const midLetters = midRows.map((r) => computeGrade(r.finalPlayer, bar).letter);
  const maxMidRank = midLetters.reduce((m, l) => Math.max(m, LETTER_RANK[l]), 0);
  const reachable = midLetters.some((l) => l === 'A' || l === 'S');
  log(`  midlife best-played reaches A/S?  ${reachable ? 'YES' : 'NO — locked out'}   (max letter: ${RANK_LETTER[maxMidRank]})`);
  log('');
}

// ── pooled overview: how many runs are S/A/B/C/D under each bar? ────────
log('## pooled (all 240 runs) — does the bar create a real grade RANGE?');
log(`  ${padL('bar', 5)}  ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}   ${pad('S%', 4)}`);
for (const bar of BARS) {
  const h = emptyHist();
  for (const r of rows) h[computeGrade(r.finalPlayer, bar).letter] += 1;
  const total = h.S + h.A + h.B + h.C + h.D;
  const sPct = Math.round((h.S / total) * 100);
  log(`  ${padL(bar.toFixed(2), 5)}  ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}   ${padL(sPct + '%', 4)}`);
}
log('');
void START_POINTS;
