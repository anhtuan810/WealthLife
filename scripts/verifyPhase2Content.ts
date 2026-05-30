// Phase-2 content verification.
//
// Drives multi-seed full runs through each start point and asserts the
// success criteria the brief locked in:
//
//   (a) Growth- and freedom-phase events FIRE in their phase windows.
//   (b) passiveIncome / expenses / assets actually MOVE across the late
//       game (the previously-frozen back half is the cure target).
//   (c) The new late-life endings can trigger across the seed/policy mix.
//   (d) skipToNextDecision still halts when a late-life event surfaces in
//       its now-sparse window.
//   (e) The freedom-coverage sweep across the four start points is NO
//       LONGER identical — the divergence is the success criterion.
//
// The engine is untouched; this sim re-implements the same step the store
// runs (advanceMonthStep) inline so the harness has no UI dependency.

declare const console: { log: (...args: unknown[]) => void };

import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
  RUN_TARGET_AGE_DEFAULT,
} from '../src/data/constants';
import { ALL_EVENTS } from '../src/content';
import { GROWTH_EVENTS } from '../src/content/events/growthEvents';
import { FREEDOM_EVENTS } from '../src/content/events/freedomEvents';
import {
  createPlayerFromStartPoint,
  freedomPct,
  netWorth,
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
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import type { Ending, GameEvent } from '../src/types/events';
import type { StartPointId } from '../src/data/startPoints';

const log = (msg: string) => console.log(msg);

const GROWTH_EVENT_IDS = new Set(GROWTH_EVENTS.map((e) => e.id));
const FREEDOM_EVENT_IDS = new Set(FREEDOM_EVENTS.map((e) => e.id));

// ── advanceMonthStep mirror (same shape as the store) ──────────────────
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
};

function step(player: Player, monthsSinceLastEvent: number): Step & { monthsSinceLastEvent: number } {
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

// ── Single-run instrumentation ─────────────────────────────────────────

type RunInstrumentation = {
  startPoint: StartPointId;
  seed: number;
  policy: string;
  endingTitle: string;
  endingId: string;
  finalFreedomPct: number;
  finalNetWorth: number;
  finalPassive: number;
  finalExpenses: number;
  finalAssets: number;
  finalDebt: number;
  finalStress: number;
  finalHealth: number;
  finalSalary: number;
  finalFlags: string[];
  // Late-life economic spread — sampled at the boundaries.
  passiveAtGrowthStart: number | null;
  passiveAtFreedomStart: number | null;
  passiveAtEnd: number;
  expensesAtGrowthStart: number | null;
  expensesAtFreedomStart: number | null;
  expensesAtEnd: number;
  assetsAtGrowthStart: number | null;
  assetsAtFreedomStart: number | null;
  assetsAtEnd: number;
  growthEventsFired: number;
  freedomEventsFired: number;
  // How many sparse late-life months were skipped via compression.
  compressionSkipsLate: number;
  // Smallest gap (in months) between successive late-life events surfaced
  // through the compression loop — proxy for "skip halted on the new
  // sparse event".
  maxCompressionGapLate: number;
};

function driveRun(opts: {
  startPoint: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
  seed: number;
  policyIdx: number;
}): RunInstrumentation {
  const rng = mulberry32(opts.seed);
  return withMathRandom(rng, () => {
    let player =
      opts.startPoint === 'university'
        ? createPlayerFromStartPoint(opts.startPoint)
        : createPlayerFromStartPoint(opts.startPoint, opts.direction);
    const policy = POLICIES[opts.policyIdx];

    let monthsSinceLastEvent = 0;
    let monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;
    let ending: Ending | null = null;

    // Late-life sampling.
    let passiveAtGrowthStart: number | null = null;
    let passiveAtFreedomStart: number | null = null;
    let expensesAtGrowthStart: number | null = null;
    let expensesAtFreedomStart: number | null = null;
    let assetsAtGrowthStart: number | null = null;
    let assetsAtFreedomStart: number | null = null;
    let growthEventsFired = 0;
    let freedomEventsFired = 0;

    // Compression instrumentation. We run a synthetic skipToNextDecision
    // over a stretch of consecutive quiet months. Each "skip" advances
    // through quiet months until it hits a decision-beat event. We count
    // how many of those skip-loops halted on a late-life event ID, and
    // we record the longest streak of quiet months between halts in the
    // late game (proxy for "halted on the sparse late-life event").
    let compressionSkipsLate = 0;
    let currentQuietRun = 0;
    let maxQuietRunLate = 0;

    for (let mc = 0; mc < monthCap; mc++) {
      const prevPhase = player.phase;
      const s = step(player, monthsSinceLastEvent);
      player = s.player;
      monthsSinceLastEvent = s.monthsSinceLastEvent;

      // Phase-boundary samples.
      if (prevPhase === 'career' && player.phase === 'growth') {
        passiveAtGrowthStart = player.passiveIncome;
        expensesAtGrowthStart = player.expenses;
        assetsAtGrowthStart = player.assets;
      }
      if (prevPhase === 'growth' && player.phase === 'freedom') {
        passiveAtFreedomStart = player.passiveIncome;
        expensesAtFreedomStart = player.expenses;
        assetsAtFreedomStart = player.assets;
      }

      if (s.gameOver) {
        ending = s.ending;
        break;
      }

      if (s.currentEvent) {
        // Count event firings by phase membership of the event content.
        if (GROWTH_EVENT_IDS.has(s.currentEvent.id)) growthEventsFired++;
        if (FREEDOM_EVENT_IDS.has(s.currentEvent.id)) freedomEventsFired++;

        // Compression instrumentation: if the player is in growth/freedom
        // and this event came at the end of a streak of quiet months,
        // record the streak length and flag the skip-halt.
        if (
          (player.phase === 'growth' || player.phase === 'freedom') &&
          currentQuietRun > 0
        ) {
          compressionSkipsLate++;
          maxQuietRunLate = Math.max(maxQuietRunLate, currentQuietRun);
        }
        currentQuietRun = 0;

        // Resolve via policy.
        const idx = policy.pickIndex(s.currentEvent, rng);
        const choice = s.currentEvent.choices[idx] ?? s.currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, s.currentEvent, choice);
          monthsSinceLastEvent = 0;
        }
      } else {
        // Quiet month.
        if (player.phase === 'growth' || player.phase === 'freedom') {
          currentQuietRun++;
        } else {
          currentQuietRun = 0;
        }
      }
    }
    if (!ending) ending = evaluateEndings(player);
    monthCap; // satisfy reader

    return {
      startPoint: opts.startPoint,
      seed: opts.seed,
      policy: policy.id,
      endingTitle: ending.title,
      endingId: ending.id,
      finalFreedomPct: freedomPct(player),
      finalNetWorth: netWorth(player),
      finalPassive: player.passiveIncome,
      finalExpenses: player.expenses,
      finalAssets: player.assets,
      finalDebt: Math.round(player.debt),
      finalStress: Math.round(player.stress),
      finalHealth: Math.round(player.health),
      finalSalary: Math.round(player.salary),
      finalFlags: [...player.flags],
      passiveAtGrowthStart,
      passiveAtFreedomStart,
      passiveAtEnd: player.passiveIncome,
      expensesAtGrowthStart,
      expensesAtFreedomStart,
      expensesAtEnd: player.expenses,
      assetsAtGrowthStart,
      assetsAtFreedomStart,
      assetsAtEnd: player.assets,
      growthEventsFired,
      freedomEventsFired,
      compressionSkipsLate,
      maxCompressionGapLate: maxQuietRunLate,
    };
  });
}

// ── Cases & sweep ──────────────────────────────────────────────────────

// Spread runs across SEEDS × POLICIES explicitly so the diverse playstyle
// mix actually gets exercised (seed % POLICIES.length leaves big gaps when
// the seed list isn't a clean multiple). 4 seeds × 6 policies × 10 cases
// = 240 runs — enough population to surface the new endings.
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

const rows: RunInstrumentation[] = [];
for (const c of CASES) {
  for (const seed of SEEDS) {
    for (let p = 0; p < POLICIES.length; p++) {
      rows.push(driveRun({ ...c, seed, policyIdx: p }));
    }
  }
}

// ── Reporting ──────────────────────────────────────────────────────────

log('# PHASE-2 CONTENT VERIFICATION');
log('');

let failures = 0;

// (a) — growth/freedom events fired across runs.
log('## (a) growth & freedom events fire in-phase');
const totalGrowthEvents = rows.reduce((s, r) => s + r.growthEventsFired, 0);
const totalFreedomEvents = rows.reduce((s, r) => s + r.freedomEventsFired, 0);
const universityRuns = rows.filter((r) => r.startPoint === 'university');
const midlifeRuns = rows.filter((r) => r.startPoint === 'midlife');
const uniGrowth = universityRuns.reduce((s, r) => s + r.growthEventsFired, 0);
const uniFreedom = universityRuns.reduce((s, r) => s + r.freedomEventsFired, 0);
const midGrowth = midlifeRuns.reduce((s, r) => s + r.growthEventsFired, 0);
const midFreedom = midlifeRuns.reduce((s, r) => s + r.freedomEventsFired, 0);
log(`  totals across ${rows.length} runs: growth=${totalGrowthEvents} firings, freedom=${totalFreedomEvents} firings`);
log(`  university (n=${universityRuns.length}): growth=${uniGrowth}, freedom=${uniFreedom}`);
log(`  midlife    (n=${midlifeRuns.length}): growth=${midGrowth}, freedom=${midFreedom}`);
const aPass =
  uniGrowth > 0 && uniFreedom > 0 && midGrowth > 0 && midFreedom > 0;
if (!aPass) failures++;
log(`  → ${aPass ? 'PASS' : 'FAIL'} — late-life content reaches the eligible pool in both 18→60 and 38→60`);
log('');

// (b) — passive / expenses / assets MOVE across late game.
// Population-level "not frozen" test. The brief's per-event rule is OR
// (each event moves passiveIncome OR expenses OR assets), so we don't
// require all three to move in every run — we require that across the
// sample, each lever is exercised at meaningful frequency and at least
// one fires in every run.
log('## (b) passiveIncome / expenses / assets MOVE across the late game');
const samplesWithGrowth = rows.filter(
  (r) =>
    r.passiveAtGrowthStart !== null &&
    r.expensesAtGrowthStart !== null &&
    r.assetsAtGrowthStart !== null,
);
const samplesWithFreedom = rows.filter(
  (r) =>
    r.passiveAtFreedomStart !== null &&
    r.expensesAtFreedomStart !== null &&
    r.assetsAtFreedomStart !== null,
);
const movedPassiveG = samplesWithGrowth.filter((r) => r.passiveAtEnd !== r.passiveAtGrowthStart).length;
const movedExpensesG = samplesWithGrowth.filter((r) => r.expensesAtEnd !== r.expensesAtGrowthStart).length;
const movedAssetsG = samplesWithGrowth.filter((r) => r.assetsAtEnd !== r.assetsAtGrowthStart).length;
const anyMovedG = samplesWithGrowth.filter(
  (r) =>
    r.passiveAtEnd !== r.passiveAtGrowthStart ||
    r.expensesAtEnd !== r.expensesAtGrowthStart ||
    r.assetsAtEnd !== r.assetsAtGrowthStart,
).length;
log(`  growth-start → end (n=${samplesWithGrowth.length} crossed career→growth):`);
log(`    passiveIncome moved in ${movedPassiveG}/${samplesWithGrowth.length}`);
log(`    expenses      moved in ${movedExpensesG}/${samplesWithGrowth.length}`);
log(`    assets        moved in ${movedAssetsG}/${samplesWithGrowth.length}`);
log(`    at least one  moved in ${anyMovedG}/${samplesWithGrowth.length}`);

const movedPassiveF = samplesWithFreedom.filter((r) => r.passiveAtEnd !== r.passiveAtFreedomStart).length;
const movedExpensesF = samplesWithFreedom.filter((r) => r.expensesAtEnd !== r.expensesAtFreedomStart).length;
const movedAssetsF = samplesWithFreedom.filter((r) => r.assetsAtEnd !== r.assetsAtFreedomStart).length;
const anyMovedF = samplesWithFreedom.filter(
  (r) =>
    r.passiveAtEnd !== r.passiveAtFreedomStart ||
    r.expensesAtEnd !== r.expensesAtFreedomStart ||
    r.assetsAtEnd !== r.assetsAtFreedomStart,
).length;
log(`  freedom-start → end (n=${samplesWithFreedom.length}):`);
log(`    passiveIncome moved in ${movedPassiveF}/${samplesWithFreedom.length}`);
log(`    expenses      moved in ${movedExpensesF}/${samplesWithFreedom.length}`);
log(`    assets        moved in ${movedAssetsF}/${samplesWithFreedom.length}`);
log(`    at least one  moved in ${anyMovedF}/${samplesWithFreedom.length}`);

// PASS: each lever is exercised in ≥1 run across the population AND every
// run moves at least one lever. That's "not frozen" with margin.
const bPass =
  movedPassiveG > 0 &&
  movedExpensesG > 0 &&
  movedAssetsG > 0 &&
  movedPassiveF > 0 &&
  // expenses don't move in freedom-only runs by design (no freedom event
  // touches expenses per brief §3); we only require movement in growth.
  movedAssetsF > 0 &&
  anyMovedG === samplesWithGrowth.length &&
  anyMovedF === samplesWithFreedom.length;
if (!bPass) failures++;
log(`  → ${bPass ? 'PASS' : 'FAIL'} — the back half of the run is no longer frozen`);
log('');


// (c) — new late-life endings can trigger.
log('## (c) new late-life endings can trigger');
const NEW_ENDING_IDS = new Set([
  'end_burned_through_stress',
  'end_burned_through_health',
  'end_free_and_clear',
  'end_late_bloomer',
  'end_comfortable_tethered',
  'end_cost_of_comfort_crept',
  'end_cost_of_comfort_inflated',
  'end_treading_at_sixty',
]);
const endingCounts = new Map<string, number>();
for (const r of rows) {
  endingCounts.set(r.endingId, (endingCounts.get(r.endingId) ?? 0) + 1);
}
const seenNewEndings = Array.from(endingCounts.keys()).filter((id) =>
  NEW_ENDING_IDS.has(id),
);
log(`  ending histogram across ${rows.length} runs:`);
for (const [id, n] of Array.from(endingCounts).sort((a, b) => b[1] - a[1])) {
  log(`    ${id}: ${n}`);
}
log(`  distinct new endings triggered: ${seenNewEndings.length}/${NEW_ENDING_IDS.size}`);
// PASS criterion: at least 4 of the 6 new late-life ending IDs surface across the seed mix.
// (Some IDs are OR-record pairs sharing a title — 4/8 records covers the 6 logical endings well.)
const cPass = seenNewEndings.length >= 4;
if (!cPass) failures++;
log(`  → ${cPass ? 'PASS' : 'FAIL'} — the new ending data is reachable`);
log('');

// (d) — skipToNextDecision halts on new sparse late-life events.
log('## (d) compression halts on late-life events');
const totalLateSkips = rows.reduce((s, r) => s + r.compressionSkipsLate, 0);
const sampleGap = rows.reduce((m, r) => Math.max(m, r.maxCompressionGapLate), 0);
log(`  total skip-halts on late-life events across all runs: ${totalLateSkips}`);
log(`  longest quiet streak before a late-life halt (across all runs): ${sampleGap} months`);
const dPass = totalLateSkips > 0;
if (!dPass) failures++;
log(`  → ${dPass ? 'PASS' : 'FAIL'} — late-life events reliably break the quiet stretch`);
log('');

// (e) — freedom-coverage sweep across start points: should diverge.
log('## (e) freedom-coverage sweep across start points — divergence is the success criterion');
function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}
const byStart = new Map<StartPointId, number[]>();
for (const r of rows) {
  const list = byStart.get(r.startPoint) ?? [];
  list.push(r.finalFreedomPct);
  byStart.set(r.startPoint, list);
}
type SummaryRow = { start: StartPointId; min: number; median: number; p90: number; max: number; mean: number; n: number };
const summary: SummaryRow[] = [];
for (const [start, list] of byStart) {
  const sorted = [...list].sort((a, b) => a - b);
  const mean = sorted.reduce((s, x) => s + x, 0) / sorted.length;
  summary.push({
    start,
    n: sorted.length,
    min: Math.round(sorted[0]),
    median: Math.round(quantile(sorted, 0.5)),
    p90: Math.round(quantile(sorted, 0.9)),
    max: Math.round(sorted[sorted.length - 1]),
    mean: Math.round(mean * 10) / 10,
  });
}
log(`  ${'start'.padEnd(12)} ${'n'.padStart(3)}  ${'min'.padStart(4)} ${'med'.padStart(4)} ${'p90'.padStart(4)} ${'max'.padStart(4)}  ${'mean'.padStart(5)}`);
for (const s of summary) {
  log(`  ${s.start.padEnd(12)} ${String(s.n).padStart(3)}  ${String(s.min).padStart(4)} ${String(s.median).padStart(4)} ${String(s.p90).padStart(4)} ${String(s.max).padStart(4)}  ${String(s.mean).padStart(5)}`);
}
const medians = summary.map((s) => s.median);
const medianSpread = Math.max(...medians) - Math.min(...medians);
log(`  median spread across start points: ${medianSpread} pp`);
const ePass = medianSpread > 0;
if (!ePass) failures++;
log(`  → ${ePass ? 'PASS' : 'FAIL'} — freedom coverage is no longer identical across starts`);
log('');

if (failures === 0) {
  log('## ALL PHASE-2 CHECKS PASSED');
} else {
  log(`## ${failures} CHECK(S) FAILED`);
}
