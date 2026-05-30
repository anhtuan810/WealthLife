// Phase-3 commit re-sweep. The shipped grade.ts is now driven by
// freedomBarForStartAge (anchored bar(18)=0.65 → bar(38)=0.50, candidate
// B2 from the Phase-3 measurement). Seeds have been replaced with the
// Part-1 derived medians. Two ending ordering bugs are fixed. This sweep
// confirms the post-commit gradient.
//
// Reports:
//   - coverage spread per start (min/p25/p50/p75/p90/max)
//   - grade histogram + median letter per start, computed against the
//     SHIPPED grade with the now-age-scaled bar (no explicit `target`
//     arg; computeGrade reads player.startPointId)
//   - monotonic-gradient + fairness checks
//   - new-ending firing rates (end_late_bloomer + end_cost_of_comfort_inflated)

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
import {
  computeGrade,
  freedomBarForStartAge,
  type GradeLetter,
} from '../src/systems/grade';
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import { START_POINTS, START_POINT_BY_ID, type StartPointId } from '../src/data/startPoints';
import type { Ending, GameEvent } from '../src/types/events';

const log = (msg: string) => console.log(msg);

// ── step mirror (matches the store) ────────────────────────────────────
function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}

function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;
  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return {
      ...p,
      phase: 'career',
      flags: addUniqueFlag(p.flags, 'undecided'),
    };
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
  const currentIdx = LATER_PHASE_ORDER.indexOf(
    p.phase as Exclude<Phase, 'foundation'>,
  );
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;
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
  currentEvent: GameEvent | null;
  gameOver: boolean;
  ending: Ending | null;
  monthsSinceLastEvent: number;
};

function step(player: Player, monthsSinceLastEvent: number): Step {
  const ticked = expirePending(tick(player));
  const phased = maybeAdvancePhase(maybeTransitionToCareer(ticked));
  const nextMonths = monthsSinceLastEvent + 1;
  if (phased.age >= phased.targetAge) {
    return {
      player: phased,
      currentEvent: null,
      gameOver: true,
      ending: evaluateEndings(phased),
      monthsSinceLastEvent: nextMonths,
    };
  }
  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriority = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMonths,
    hasPriorityEligible: hasPriority,
  });
  if (beat === 'quiet') {
    return {
      player: phased,
      currentEvent: null,
      gameOver: false,
      ending: null,
      monthsSinceLastEvent: nextMonths,
    };
  }
  const event = pickEvent(eligible, beat);
  return {
    player: phased,
    currentEvent: event,
    gameOver: false,
    ending: null,
    monthsSinceLastEvent: nextMonths,
  };
}

type Row = {
  startPoint: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
  seed: number;
  policy: string;
  endingId: string;
  endingTitle: string;
  coveragePct: number; // freedomPct (clamped)
  coverageRaw: number; // raw passive/expenses (unclamped)
  letter: GradeLetter;
  score: number;
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

    let monthsSinceLastEvent = 0;
    let ending: Ending | null = null;
    const monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;

    for (let mc = 0; mc < monthCap; mc++) {
      const s = step(player, monthsSinceLastEvent);
      player = s.player;
      monthsSinceLastEvent = s.monthsSinceLastEvent;
      if (s.gameOver) {
        ending = s.ending;
        break;
      }
      if (s.currentEvent) {
        const idx = policy.pickIndex(s.currentEvent, rng);
        const choice = s.currentEvent.choices[idx] ?? s.currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, s.currentEvent, choice);
          monthsSinceLastEvent = 0;
        }
      }
    }
    if (!ending) ending = evaluateEndings(player);
    // computeGrade with no target arg now reads the age-scaled bar via
    // player.startPointId — exactly the shipped behavior.
    const g = computeGrade(player);
    const coverageRaw =
      player.expenses > 0 ? player.passiveIncome / player.expenses : 0;
    const coverageClamped = Math.max(0, Math.min(100, Math.round(coverageRaw * 100)));
    return {
      startPoint,
      direction,
      seed,
      policy: policy.id,
      endingId: ending.id,
      endingTitle: ending.title,
      coveragePct: coverageClamped,
      coverageRaw: Math.round(coverageRaw * 1000) / 1000,
      letter: g.letter,
      score: g.score,
    };
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
function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  if (sortedAsc.length === 1) return sortedAsc[0];
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  const frac = pos - lo;
  return sortedAsc[lo] * (1 - frac) + sortedAsc[hi] * frac;
}
function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

const LETTER_RANK: Record<GradeLetter, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const RANK_LETTER: Record<number, GradeLetter> = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' };

type Histogram = Record<GradeLetter, number>;
const emptyHist = (): Histogram => ({ S: 0, A: 0, B: 0, C: 0, D: 0 });
function medianLetter(letters: GradeLetter[]): GradeLetter {
  if (letters.length === 0) return 'D';
  const ranks = letters.map((l) => LETTER_RANK[l]).sort((a, b) => a - b);
  const m = ranks[Math.floor(ranks.length / 2)];
  return RANK_LETTER[m] ?? 'D';
}

// ── reporting ──────────────────────────────────────────────────────────
log('# PHASE-3 COMMIT — POST-CHANGE SWEEP');
log('');
log('  Grade reads age-scaled freedomBarForStartAge() — no explicit target arg.');
log(`  bar(18)=${freedomBarForStartAge(18).toFixed(2)}  bar(22)=${freedomBarForStartAge(22).toFixed(2)}  bar(26)=${freedomBarForStartAge(26).toFixed(2)}  bar(38)=${freedomBarForStartAge(38).toFixed(2)}`);
log('');

// Coverage spread per start.
log('## coverage spread per start (final passiveIncome / expenses × 100, clamped 0–100)');
log(`  ${pad('start', 12)} ${padL('n', 4)}  ${padL('min', 4)} ${padL('p25', 4)} ${padL('p50', 4)} ${padL('p75', 4)} ${padL('p90', 4)} ${padL('max', 4)}  ${padL('mean', 5)}`);
const byStartCov = new Map<StartPointId, number[]>();
for (const r of rows) {
  const list = byStartCov.get(r.startPoint) ?? [];
  list.push(r.coveragePct);
  byStartCov.set(r.startPoint, list);
}
const startOrder: StartPointId[] = ['university', 'early', 'established', 'midlife'];
const medianCovByStart: Record<StartPointId, number> = {
  university: 0,
  early: 0,
  established: 0,
  midlife: 0,
};
for (const sp of startOrder) {
  const list = byStartCov.get(sp) ?? [];
  const sorted = [...list].sort((a, b) => a - b);
  const mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
  const p50 = Math.round(quantile(sorted, 0.5));
  medianCovByStart[sp] = p50;
  log(
    `  ${pad(sp, 12)} ${padL(sorted.length, 4)}  ${padL(Math.round(sorted[0]), 4)} ${padL(Math.round(quantile(sorted, 0.25)), 4)} ${padL(p50, 4)} ${padL(Math.round(quantile(sorted, 0.75)), 4)} ${padL(Math.round(quantile(sorted, 0.9)), 4)} ${padL(Math.round(sorted[sorted.length - 1]), 4)}  ${padL((Math.round(mean * 10) / 10).toFixed(1), 5)}`,
  );
}
log('');

// Grade histogram per start.
log('## grade histogram + median letter per start (shipped age-scaled bar)');
log(`  ${pad('start', 12)} ${padL('n', 4)}  ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}  ${pad('median', 8)} ${padL('median score', 13)}`);
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
  histByStart[r.startPoint][r.letter] += 1;
  lettersByStart[r.startPoint].push(r.letter);
  scoresByStart[r.startPoint].push(r.score);
}
const medianLetterByStart: Record<StartPointId, GradeLetter> = {
  university: 'D',
  early: 'D',
  established: 'D',
  midlife: 'D',
};
for (const sp of startOrder) {
  const h = histByStart[sp];
  const ml = medianLetter(lettersByStart[sp]);
  medianLetterByStart[sp] = ml;
  const scoresSorted = [...scoresByStart[sp]].sort((a, b) => a - b);
  const medScore = Math.round(quantile(scoresSorted, 0.5));
  log(
    `  ${pad(sp, 12)} ${padL(lettersByStart[sp].length, 4)}  ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}  ${pad(ml, 8)} ${padL(medScore, 13)}`,
  );
}
log('');

// Gradient monotonic checks.
log('## gradient monotonicity');
const covMedians = startOrder.map((sp) => medianCovByStart[sp]);
const letterMedians = startOrder.map((sp) => LETTER_RANK[medianLetterByStart[sp]]);
function isNonIncreasing(xs: number[]): boolean {
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[i - 1]) return false;
  return true;
}
log(`  coverage medians (uni → early → established → midlife): ${covMedians.join(' → ')}`);
log(`    monotonic non-increasing: ${isNonIncreasing(covMedians) ? 'YES' : 'NO'}`);
log(`  median-letter rank (S=5..D=1): ${startOrder.map((sp, i) => `${sp.slice(0, 3)}=${medianLetterByStart[sp]}(${letterMedians[i]})`).join('  ')}`);
log(`    monotonic non-increasing rank: ${isNonIncreasing(letterMedians) ? 'YES' : 'NO'}`);
log('');

// Fairness: midlife not locked out of A/S, not inverted.
const midRows = rows.filter((r) => r.startPoint === 'midlife');
const midHist = histByStart['midlife'];
const midReachesAOrS = midRows.some((r) => r.letter === 'A' || r.letter === 'S');
const midMaxLetter = midRows.reduce(
  (m, r) => Math.max(m, LETTER_RANK[r.letter]),
  0,
);
log('## midlife fairness');
log(`  midlife histogram: S=${midHist.S} A=${midHist.A} B=${midHist.B} C=${midHist.C} D=${midHist.D}`);
log(`  median letter: ${medianLetterByStart['midlife']}`);
log(`  best-played run reaches A or S: ${midReachesAOrS ? 'YES' : 'NO'}  (max letter observed: ${RANK_LETTER[midMaxLetter]})`);
log(`  midlife median letter not above university median: ${LETTER_RANK[medianLetterByStart['midlife']] <= LETTER_RANK[medianLetterByStart['university']] ? 'YES (not inverted)' : 'NO (INVERTED)'}`);
log('');

// Ending histogram.
log('## ending histogram (across all 240 runs)');
const endingCounts = new Map<string, number>();
for (const r of rows) {
  endingCounts.set(r.endingId, (endingCounts.get(r.endingId) ?? 0) + 1);
}
const sortedEndings = Array.from(endingCounts).sort((a, b) => b[1] - a[1]);
for (const [id, n] of sortedEndings) {
  log(`  ${pad(id, 36)} ${padL(n, 4)}`);
}
log('');
const newLateBloomer = endingCounts.get('end_late_bloomer') ?? 0;
const newCostInflated = endingCounts.get('end_cost_of_comfort_inflated') ?? 0;
log(`  end_late_bloomer:             ${newLateBloomer}  (Phase-2 baseline: 5 — now ${newLateBloomer >= 24 ? 'meaningful' : 'still rare'})`);
log(`  end_cost_of_comfort_inflated: ${newCostInflated}  (Phase-2 baseline: 1 — now ${newCostInflated >= 5 ? 'meaningful' : 'still rare'})`);
log('');
log('# END OF SWEEP');
