// Phase-3 measurement & seed derivation — REPORT-ONLY.
//
// PART 1: Derives proposed early (age 22) and established (age 26) seeds from
//         university (18) runs forward through the actual content. Reports
//         medians beside the current placeholder seed values. Does NOT
//         modify startPoints.ts.
//
// PART 2: Recomputes grade letters per run under four candidate freedom
//         bars that scale with START age (runway). grade.ts is untouched —
//         the candidate bar is just the `target` arg into computeGrade,
//         which the engine already accepts. Reports per-(start × bar)
//         histograms, median letter, and a fairness check showing whether
//         a BEST-PLAYED midlife run can reach A/S under each bar.
//
// PART 3: Light reachability diagnostic for the two rarest new endings —
//         exact gating condition + distribution of the gating stat across
//         eligible runs.
//
// The sim mirror of advanceMonthStep is the same shape the store uses.

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
import { START_POINTS, START_POINT_BY_ID, type StartPointId } from '../src/data/startPoints';
import type { Ending, GameEvent } from '../src/types/events';

const log = (msg: string) => console.log(msg);

// ── advanceMonthStep mirror (matches the store) ──────────────────────
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

// Snapshot the player state at the FIRST month their age reaches a target
// boundary. We only sample numeric fields the seed shape covers (per Part 1).
type SeedSnapshot = {
  salary: number;
  expenses: number;
  cash: number;
  assets: number;
  liabilities: number; // = debt
  passiveIncome: number;
  skill: number;
  network: number;
  reputation: number;
  discipline: number;
  riskTolerance: number;
  ambition: number;
};

const snap = (p: Player): SeedSnapshot => ({
  salary: Math.round(p.salary),
  expenses: Math.round(p.expenses),
  cash: Math.round(p.cash),
  assets: Math.round(p.assets),
  liabilities: Math.round(p.debt),
  passiveIncome: Math.round(p.passiveIncome),
  skill: Math.round(p.skill),
  network: Math.round(p.network),
  reputation: Math.round(p.reputation),
  discipline: Math.round(p.discipline),
  riskTolerance: Math.round(p.riskTolerance),
  ambition: Math.round(p.ambition),
});

type Run = {
  startPoint: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
  seed: number;
  policy: string;
  // Snapshots — present only when the run crossed that age boundary.
  snap22: SeedSnapshot | null;
  snap26: SeedSnapshot | null;
  // Full final player so we can rescore under candidate freedom bars.
  finalPlayer: Player;
  endingId: string;
  endingTitle: string;
  coverage: number; // passiveIncome / expenses, clamped to [0, ∞) raw
};

function driveRun(
  startPoint: StartPointId,
  direction: 'corporate' | 'founder' | 'freelancer' | undefined,
  seed: number,
  policyIdx: number,
): Run {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player =
      startPoint === 'university'
        ? createPlayerFromStartPoint(startPoint)
        : createPlayerFromStartPoint(startPoint, direction);
    const policy = POLICIES[policyIdx];

    let monthsSinceLastEvent = 0;
    let ending: Ending | null = null;
    let snap22: SeedSnapshot | null = null;
    let snap26: SeedSnapshot | null = null;
    const monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;

    for (let mc = 0; mc < monthCap; mc++) {
      const prevAge = player.age;
      const s = step(player, monthsSinceLastEvent);
      player = s.player;
      monthsSinceLastEvent = s.monthsSinceLastEvent;

      // Take snapshot the first time we tick past 22 / 26. prevAge < N &&
      // player.age >= N catches the moment of crossing for one-shot capture.
      if (prevAge < 22 && player.age >= 22 && snap22 === null) {
        snap22 = snap(player);
      }
      if (prevAge < 26 && player.age >= 26 && snap26 === null) {
        snap26 = snap(player);
      }

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

    return {
      startPoint,
      direction,
      seed,
      policy: policy.id,
      snap22,
      snap26,
      finalPlayer: player,
      endingId: ending.id,
      endingTitle: ending.title,
      coverage: player.expenses > 0 ? player.passiveIncome / player.expenses : 0,
    };
  });
}

// ── Drive the same matrix the Phase-2 verification used ─────────────
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

const rows: Run[] = [];
for (const c of CASES) {
  for (const s of SEEDS) {
    for (let p = 0; p < POLICIES.length; p++) {
      rows.push(driveRun(c.startPoint, c.direction, s, p));
    }
  }
}

// ── Stats helpers ──────────────────────────────────────────────────────
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

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  return Math.round(quantile(sorted, 0.5));
}

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

// ─────────────────────────────────────────────────────────────────────
// PART 1 — derived early/established seeds from university (18) runs
// ─────────────────────────────────────────────────────────────────────

log('# PART 1 — DERIVED EARLY / ESTABLISHED SEEDS (medians of university 18 runs)');
log('');

const uniRows = rows.filter((r) => r.startPoint === 'university');
const snaps22 = uniRows.map((r) => r.snap22).filter((x): x is SeedSnapshot => x !== null);
const snaps26 = uniRows.map((r) => r.snap26).filter((x): x is SeedSnapshot => x !== null);

const FIELDS: ReadonlyArray<keyof SeedSnapshot> = [
  'salary',
  'expenses',
  'cash',
  'assets',
  'liabilities',
  'passiveIncome',
  'skill',
  'network',
  'reputation',
  'discipline',
  'riskTolerance',
  'ambition',
];

function medianSnap(snaps: SeedSnapshot[]): SeedSnapshot {
  const out = {} as SeedSnapshot;
  for (const k of FIELDS) {
    out[k] = median(snaps.map((s) => s[k]));
  }
  return out;
}

const derivedEarly = medianSnap(snaps22);
const derivedEstablished = medianSnap(snaps26);

const earlyPlaceholder = START_POINT_BY_ID.early.seed!;
const establishedPlaceholder = START_POINT_BY_ID.established.seed!;

function currentSeedRow(seed: typeof earlyPlaceholder, key: keyof SeedSnapshot): number {
  if (key === 'skill' || key === 'network' || key === 'reputation' || key === 'discipline' || key === 'riskTolerance' || key === 'ambition') {
    return seed.strengths[key];
  }
  // salary / expenses / cash / assets / liabilities / passiveIncome
  return (seed as unknown as Record<string, number>)[key];
}

log(`(n=${snaps22.length} university runs crossed age 22 · n=${snaps26.length} crossed age 26)`);
log('');
log('  early (22):');
log(`    ${pad('field', 14)} ${padL('current', 10)}  ${padL('proposed', 10)}  ${padL('Δ', 10)}`);
for (const k of FIELDS) {
  const cur = currentSeedRow(earlyPlaceholder, k);
  const prop = derivedEarly[k];
  const delta = prop - cur;
  const sign = delta > 0 ? '+' : '';
  log(`    ${pad(k, 14)} ${padL(cur, 10)}  ${padL(prop, 10)}  ${padL(sign + delta, 10)}`);
}
log('');
log('  established (26):');
log(`    ${pad('field', 14)} ${padL('current', 10)}  ${padL('proposed', 10)}  ${padL('Δ', 10)}`);
for (const k of FIELDS) {
  const cur = currentSeedRow(establishedPlaceholder, k);
  const prop = derivedEstablished[k];
  const delta = prop - cur;
  const sign = delta > 0 ? '+' : '';
  log(`    ${pad(k, 14)} ${padL(cur, 10)}  ${padL(prop, 10)}  ${padL(sign + delta, 10)}`);
}
log('');
log('  midlife (38): no upstream content covers age 26→38, so this seed must');
log('                stay hand-authored. The Part-1 derivation cannot reach it.');
log('');

// ─────────────────────────────────────────────────────────────────────
// PART 2 — grade distributions under candidate freedom bars
// ─────────────────────────────────────────────────────────────────────

log('# PART 2 — GRADE DISTRIBUTIONS UNDER CANDIDATE FREEDOM BARS');
log('');
log('  Candidates (linear in start age, anchored bar(18) = 0.65):');
log('    B0  fixed 0.65 (baseline, current behavior)');
log('    B1  bar(38) = 0.40 → ~0.60 @22, ~0.55 @26');
log('    B2  bar(38) = 0.50 → ~0.62 @22, ~0.59 @26');
log('    B3  bar(38) = 0.30 → ~0.58 @22, ~0.51 @26');
log('  (grade.ts FREEDOM_EXPONENT and GROWTH_CEILING unchanged; only the bar varies.)');
log('');

type BarFn = (startAge: number) => number;
const BARS: { name: string; bar: BarFn; line: string }[] = [
  { name: 'B0', bar: () => 0.65, line: 'fixed 0.65' },
  { name: 'B1', bar: (a) => 0.65 - 0.0125 * (a - 18), line: 'bar(38)=0.40, slope -0.0125/yr' },
  { name: 'B2', bar: (a) => 0.65 - 0.0075 * (a - 18), line: 'bar(38)=0.50, slope -0.0075/yr' },
  { name: 'B3', bar: (a) => 0.65 - 0.0175 * (a - 18), line: 'bar(38)=0.30, slope -0.0175/yr' },
];

type Histogram = Record<GradeLetter, number>;
const emptyHist = (): Histogram => ({ S: 0, A: 0, B: 0, C: 0, D: 0 });
const LETTERS: GradeLetter[] = ['S', 'A', 'B', 'C', 'D'];
const LETTER_RANK: Record<GradeLetter, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };
const RANK_LETTER: Record<number, GradeLetter> = { 5: 'S', 4: 'A', 3: 'B', 2: 'C', 1: 'D' };

function medianLetter(letters: GradeLetter[]): GradeLetter {
  if (letters.length === 0) return 'D';
  const ranks = letters.map((l) => LETTER_RANK[l]).sort((a, b) => a - b);
  const m = ranks[Math.floor(ranks.length / 2)];
  return RANK_LETTER[m] ?? 'D';
}

const startPointBars: Record<StartPointId, Record<string, Histogram>> = {
  university: {},
  early: {},
  established: {},
  midlife: {},
};
for (const sp of START_POINTS) {
  for (const b of BARS) startPointBars[sp.id][b.name] = emptyHist();
}

const startPointLetters: Record<StartPointId, Record<string, GradeLetter[]>> = {
  university: {},
  early: {},
  established: {},
  midlife: {},
};
for (const sp of START_POINTS) {
  for (const b of BARS) startPointLetters[sp.id][b.name] = [];
}

for (const r of rows) {
  const startAge = START_POINT_BY_ID[r.startPoint].startAge;
  for (const b of BARS) {
    const bar = Math.max(0.01, b.bar(startAge));
    const g = computeGrade(r.finalPlayer, bar);
    startPointBars[r.startPoint][b.name][g.letter] += 1;
    startPointLetters[r.startPoint][b.name].push(g.letter);
  }
}

// Per-start table — detail column wide enough to hold the longest line
// so the histogram columns stay aligned.
const DETAIL_W = 50;
for (const sp of START_POINTS) {
  log(`  ${sp.id} (n=${startPointLetters[sp.id]['B0'].length})`);
  log(`    ${pad('bar', 6)} ${pad('detail', DETAIL_W)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}   ${pad('median', 8)}`);
  for (const b of BARS) {
    const h = startPointBars[sp.id][b.name];
    const ml = medianLetter(startPointLetters[sp.id][b.name]);
    const barNum = b.bar(sp.startAge).toFixed(2);
    log(
      `    ${pad(b.name, 6)} ${pad(`bar(${sp.startAge})=${barNum}  (${b.line})`, DETAIL_W)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}   ${pad(ml, 8)}`,
    );
  }
  log('');
}

// Fairness check — can best-played midlife reach A or S under each bar?
log('  Fairness — best-played midlife (38) run under each bar:');
log(`    ${pad('bar', 6)} ${pad('detail', 20)} ${padL('coverage p90', 14)} ${padL('coverage max', 14)} ${pad('max letter', 11)} ${pad('A+/S reachable?', 16)}`);
const midRows = rows.filter((r) => r.startPoint === 'midlife');
const midCoverages = midRows.map((r) => r.coverage).sort((a, b) => a - b);
const cov_p90 = quantile(midCoverages, 0.9);
const cov_max = midCoverages[midCoverages.length - 1] ?? 0;
for (const b of BARS) {
  const bar = Math.max(0.01, b.bar(38));
  const letters = midRows.map((r) => computeGrade(r.finalPlayer, bar).letter);
  // Max letter actually observed
  const maxLetterRank = letters.reduce((m, l) => Math.max(m, LETTER_RANK[l]), 0);
  const maxLetter = RANK_LETTER[maxLetterRank] ?? 'D';
  const reachable = letters.some((l) => l === 'A' || l === 'S');
  log(
    `    ${pad(b.name, 6)} ${pad(`bar(38)=${bar.toFixed(2)}`, 28)} ${padL(cov_p90.toFixed(2), 14)} ${padL(cov_max.toFixed(2), 14)} ${pad(maxLetter, 11)} ${pad(reachable ? 'yes' : 'NO — locked out', 16)}`,
  );
}
log('');

// ─────────────────────────────────────────────────────────────────────
// PART 3 — ending-reachability diagnostic (light)
// ─────────────────────────────────────────────────────────────────────

log('# PART 3 — ENDING REACHABILITY DIAGNOSTIC (rarest new endings)');
log('');

type RareReport = {
  endingId: string;
  conditionText: string;
  flagRequired: string | null;
  statKey: keyof Player;
  statOp: '>=' | '<=';
  statThreshold: number;
};

const RARE: RareReport[] = [
  {
    endingId: 'end_late_bloomer',
    conditionText: "requiresFlags: ['started_midlife'], stats: { passiveIncome: '>=700' }",
    flagRequired: 'started_midlife',
    statKey: 'passiveIncome',
    statOp: '>=',
    statThreshold: 700,
  },
  {
    endingId: 'end_cost_of_comfort_inflated',
    conditionText: "requiresFlags: ['inflated_lifestyle'], stats: { passiveIncome: '<=900' }",
    flagRequired: 'inflated_lifestyle',
    statKey: 'passiveIncome',
    statOp: '<=',
    statThreshold: 900,
  },
];

for (const r of RARE) {
  log(`  ${r.endingId}`);
  log(`    condition: ${r.conditionText}`);
  const flagBearers = r.flagRequired
    ? rows.filter((row) => row.finalPlayer.flags.includes(r.flagRequired!))
    : rows;
  log(`    runs that satisfy flag '${r.flagRequired}': ${flagBearers.length}/${rows.length}`);
  const stats = flagBearers
    .map((row) => Math.round(row.finalPlayer[r.statKey] as number))
    .sort((a, b) => a - b);
  if (stats.length === 0) {
    log(`    no runs satisfy the flag — stat distribution is empty`);
  } else {
    const passing = stats.filter((v) =>
      r.statOp === '>=' ? v >= r.statThreshold : v <= r.statThreshold,
    );
    log(
      `    distribution of ${r.statKey} across those runs: min=${stats[0]} p25=${Math.round(quantile(stats, 0.25))} p50=${Math.round(quantile(stats, 0.5))} p75=${Math.round(quantile(stats, 0.75))} p90=${Math.round(quantile(stats, 0.9))} max=${stats[stats.length - 1]}`,
    );
    log(
      `    runs that ALSO satisfy ${r.statKey} ${r.statOp} ${r.statThreshold}: ${passing.length}/${stats.length}`,
    );
    const gap =
      r.statOp === '>='
        ? r.statThreshold - quantile(stats, 0.5)
        : quantile(stats, 0.5) - r.statThreshold;
    log(
      `    median sits ${Math.abs(Math.round(gap))} units ${gap > 0 ? 'BELOW' : 'past'} the ${r.statOp} ${r.statThreshold} threshold.`,
    );
  }
  log('');
}

log('# END OF REPORT — no game logic was modified.');
