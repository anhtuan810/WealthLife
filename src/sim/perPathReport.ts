// Per-path tuning sim — MEASUREMENT ONLY.
//
// Runs N seeded full runs (18 → END_AGE) per foundation path with a shared
// seed set so paths are compared on equal noise. The choice policy is varied
// by seed (round-robin over POLICIES) so the spread reflects a mix of
// plausible playstyles, not a single optimal lever.
//
// This module imports the engine but NEVER mutates it. Math.random is swapped
// to a seeded RNG for the duration of each run and restored on exit. No
// engine, grade, content, or player-config edits live here — strictly a
// reporter that the next prompt can act on.

import {
  DIRECTIONAL_FLAGS,
  END_AGE,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
} from '../data/constants';
import {
  FOUNDATION_PATHS,
  type FoundationPathId,
} from '../data/foundationPaths';
import {
  createPlayer,
  freedomPct,
  netWorth,
  type Phase,
  type Player,
} from '../game/player';
import { tick } from '../game/tick';
import { ALL_EVENTS } from '../content';
import {
  applyChoice,
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../systems/eventEngine';
import { decideBeat } from '../systems/pacingController';
import {
  computeGrade,
  GRADE_CONFIG,
  type GradeLetter,
  type GradeOptions,
} from '../systems/grade';
import type { Ending } from '../types/events';
import { mulberry32, withMathRandom } from './rng';
import { POLICIES, type Policy } from './policies';

// --- cross-pull probe classification --------------------------------------
//
// Hand-picked sets used ONLY by the cross-pull probe. An "opportunity" here
// means an event whose dominant choice path nudges the player toward that
// direction. Events that genuinely straddle two directions (mentor_role_intro,
// mentor_warm_intro) are left out to keep the probe a clean signal.

const CORPORATE_OPP_IDS: ReadonlySet<string> = new Set([
  // foundation
  'bigco_full_time_offer',
  'trade_promotion',
  // career
  'promotion_review',
  'corporate_leadership_offer',
  'bigco_alumni_referral',
  'finished_degree_consulting_role',
]);

const FOUNDER_OPP_IDS: ReadonlySet<string> = new Set([
  // foundation
  'acquihire_offer',
  'side_project_milestone',
  // career
  'startup_offer',
  'founder_scaling_decision',
  'dropped_out_grit_opportunity',
  // career — universal cross-pull (flag-poor paths can reach it)
  'universal_cross_pull',
]);

const INDEPENDENT_OPP_IDS: ReadonlySet<string> = new Set([
  // foundation
  'first_freelance_client',
  'first_freelance_referral',
  'freelance_retainer',
  // career
  'independent_brand_launch',
  'studio_launch',
  'agency_expansion',
]);

// --- types ----------------------------------------------------------------

export type Leaning = 'corporate' | 'founder' | 'independent' | 'undecided' | 'none';

// Minimum end-state needed by computeGrade. Stored per row so the target
// sweep can rescore without re-running the sim.
export type EndStateSnapshot = {
  cash: number;
  debt: number;
  salary: number;
  expenses: number;
  investments: number;
  assets: number;
  passiveIncome: number;
  skill: number;
  network: number;
  reputation: number;
  discipline: number;
  riskTolerance: number;
  ambition: number;
  stress: number;
  health: number;
};

export type RunRow = {
  path: FoundationPathId;
  seed: number;
  policy: string;
  monthsPlayed: number;

  freedomPct: number;
  // Raw, UNCLAMPED terminal freedom coverage = passiveIncome / expenses,
  // rounded to 3 decimals. Lets us see how runs stack up against the
  // shipped 0.65 bar without losing the high tail to a clamp.
  freedomCoverage: number;
  gradeLetter: GradeLetter;
  gradeScore: number;
  components: { freedom: number; sustainability: number; growth: number };

  finalNetWorth: number;
  netWorthSlopePerMonth: number;

  peakStress: number;
  finalStress: number;

  endingId: string;
  endingTitle: string;

  leaning: Leaning;
  sawCorporateOppEligible: boolean;
  sawFounderOppEligible: boolean;
  sawIndependentOppEligible: boolean;

  // Enough state to rescore this run under a different freedom target.
  finalSnapshot: EndStateSnapshot;
  flags: readonly string[];
};

export type PerPathSummary = {
  path: FoundationPathId;
  runs: number;

  freedom: { min: number; median: number; p90: number; max: number };
  gradeHistogram: Record<GradeLetter, number>;

  // Mean of each grade component AT END expressed as a fraction of its cap.
  // Confirms whether `growth` tops out near ~6/20 (~0.30).
  componentFractions: { freedom: number; sustainability: number; growth: number };
  componentMaxes: { freedom: number; sustainability: number; growth: number };

  netWorth: { medianFinal: number; medianSlopePerMonth: number };
  stress: { medianPeak: number; medianFinal: number };
  endings: Record<string, number>;

  leaningCounts: Record<Leaning, number>;

  // Cross-pull probe: among runs whose leaning_X flag is set, what fraction
  // ever had ≥1 opportunity of the OTHER two flavors eligible?
  crossPull: {
    corporate: { runs: number; pctSawOtherFlavor: number };
    founder: { runs: number; pctSawOtherFlavor: number };
    independent: { runs: number; pctSawOtherFlavor: number };
  };
};

export type Report = {
  config: { seeds: number; policiesUsed: readonly string[] };
  rows: RunRow[];
  perPath: Record<FoundationPathId, PerPathSummary>;
};

// --- internal: foundation→career transition (mirrors gameStore) ----------
//
// Duplicated here intentionally so the harness doesn't have to import the
// Zustand store (which would drag React Native in). The logic is small and
// behaviorally locked by the existing app — if it drifts, a sim regression
// will surface in the next report run.

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

// Mirrors gameStore.maybeAdvancePhase. Age-based progression for the later
// flips (career→growth at 35, growth→freedom at 50). Foundation→career is
// owned by maybeTransitionToCareer above.
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

// --- single run -----------------------------------------------------------

function detectLeaning(p: Player): Leaning {
  if (p.flags.includes('leaning_corporate')) return 'corporate';
  if (p.flags.includes('leaning_founder')) return 'founder';
  if (p.flags.includes('leaning_independent')) return 'independent';
  if (p.flags.includes('undecided')) return 'undecided';
  return 'none';
}

export function driveRun(
  pathId: FoundationPathId,
  seed: number,
  policy: Policy,
  excludeEventIds?: ReadonlySet<string>,
  targetAge?: number,
): RunRow {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player = createPlayer(pathId, targetAge);
    let monthsSinceLastEvent = 0;
    let peakStress = player.stress;
    let sawCorp = false;
    let sawFounder = false;
    let sawIndependent = false;
    let endingResult: Ending | null = null;
    const excluded = excludeEventIds;

    // Safety cap: 12 × (END_AGE − 18) + plenty of slack. A correctly-driven
    // run terminates at the age check, so this is purely defensive.
    const monthCap = (END_AGE - 18) * 12 + 24;

    for (let step = 0; step < monthCap; step++) {
      player = tick(player);
      player = maybeAdvancePhase(maybeTransitionToCareer(player));
      monthsSinceLastEvent += 1;
      if (player.stress > peakStress) peakStress = player.stress;

      if (player.age >= player.targetAge) {
        endingResult = evaluateEndings(player);
        break;
      }

      const rawEligible = getEligibleEvents(player, ALL_EVENTS);
      const eligible = excluded
        ? rawEligible.filter((e) => !excluded.has(e.id))
        : rawEligible;
      for (const e of eligible) {
        if (!sawCorp && CORPORATE_OPP_IDS.has(e.id)) sawCorp = true;
        if (!sawFounder && FOUNDER_OPP_IDS.has(e.id)) sawFounder = true;
        if (!sawIndependent && INDEPENDENT_OPP_IDS.has(e.id)) sawIndependent = true;
      }

      const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
      const beat = decideBeat({
        phase: player.phase,
        monthsSinceLastEvent,
        hasPriorityEligible,
      });
      if (beat === 'quiet') continue;

      const event = pickEvent(eligible, beat);
      if (!event) continue;

      const idx = policy.pickIndex(event, rng);
      const choice =
        event.choices[idx] ?? event.choices[0];
      if (!choice) continue;

      player = applyChoice(player, event, choice);
      // Mirror gameStore.chooseOption: snapshot net worth after the choice
      // by UPDATING the current month's trailing entry in place. §13
      // contract: history holds one entry per month, so a choice resolved
      // within month N overwrites the month-N entry tick already pushed,
      // never appends.
      const snapshotNet = Math.round(
        player.cash + player.assets + player.investments - player.debt,
      );
      const nextHistory =
        player.netWorthHistory.length > 0
          ? [...player.netWorthHistory.slice(0, -1), snapshotNet]
          : [snapshotNet];
      player = {
        ...player,
        netWorthHistory: nextHistory,
      };
      monthsSinceLastEvent = 0;
    }

    if (!endingResult) endingResult = evaluateEndings(player);
    const grade = computeGrade(player);
    const finalNet = netWorth(player);
    const slopePerMonth =
      player.month > 0
        ? (player.netWorthHistory[player.netWorthHistory.length - 1] -
            player.netWorthHistory[0]) /
          player.month
        : 0;

    return {
      path: pathId,
      seed,
      policy: policy.id,
      monthsPlayed: player.month,

      freedomPct: freedomPct(player),
      freedomCoverage:
        player.expenses > 0
          ? Math.round((player.passiveIncome / player.expenses) * 1000) / 1000
          : 0,
      gradeLetter: grade.letter,
      gradeScore: grade.score,
      components: grade.components,

      finalNetWorth: finalNet,
      netWorthSlopePerMonth: Math.round(slopePerMonth * 100) / 100,

      peakStress,
      finalStress: player.stress,

      endingId: endingResult.id,
      endingTitle: endingResult.title,

      leaning: detectLeaning(player),
      sawCorporateOppEligible: sawCorp,
      sawFounderOppEligible: sawFounder,
      sawIndependentOppEligible: sawIndependent,

      finalSnapshot: {
        cash: player.cash,
        debt: player.debt,
        salary: player.salary,
        expenses: player.expenses,
        investments: player.investments,
        assets: player.assets,
        passiveIncome: player.passiveIncome,
        skill: player.skill,
        network: player.network,
        reputation: player.reputation,
        discipline: player.discipline,
        riskTolerance: player.riskTolerance,
        ambition: player.ambition,
        stress: player.stress,
        health: player.health,
      },
      flags: [...player.flags],
    };
  });
}

// --- target sweep ---------------------------------------------------------
//
// A run's TRAJECTORY is independent of the freedom target — the target only
// rescales the freedom component. So we rescore each already-finished run
// against candidate targets and aggregate. No re-running the sim.

// Construct a Player-shaped object that exposes only the fields computeGrade
// reads. Untouched fields are stub values; the scorer ignores them.
function snapshotToPlayer(snap: EndStateSnapshot): Player {
  return {
    ...snap,
    age: END_AGE,
    targetAge: END_AGE,
    month: 0,
    phase: 'career',
    foundationPath: FOUNDATION_PATHS[0].id,
    flags: [],
    firedEventIds: [],
    direction: null,
    stressMomentum: 0,
    netWorthHistory: [],
    pendingDecisions: [],
  };
}

export type TargetSweepBucket = {
  target: number;
  perPath: Record<
    FoundationPathId,
    { runs: number; gradeHistogram: Record<GradeLetter, number> }
  >;
  pooled: {
    runs: number;
    gradeHistogram: Record<GradeLetter, number>;
    componentFractions: { freedom: number; sustainability: number; growth: number };
    componentMaxes: { freedom: number; sustainability: number; growth: number };
  };
};

export const DEFAULT_TARGET_SWEEP: readonly number[] = [0.15, 0.45, 0.55, 0.6, 0.7];

export function runTargetSweep(
  rows: readonly RunRow[],
  targets: readonly number[] = DEFAULT_TARGET_SWEEP,
): TargetSweepBucket[] {
  const caps = {
    freedom: GRADE_CONFIG.weights.freedom.cap,
    sustainability: GRADE_CONFIG.weights.sustainability.cap,
    growth: GRADE_CONFIG.weights.growth.cap,
  };

  return targets.map((target) => {
    const perPath = {} as Record<
      FoundationPathId,
      { runs: number; gradeHistogram: Record<GradeLetter, number> }
    >;
    for (const p of FOUNDATION_PATHS) {
      perPath[p.id] = {
        runs: 0,
        gradeHistogram: { S: 0, A: 0, B: 0, C: 0, D: 0 },
      };
    }
    const pooledHist: Record<GradeLetter, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    };
    let sumFreedomFrac = 0;
    let sumSustFrac = 0;
    let sumGrowthFrac = 0;

    for (const r of rows) {
      const player = snapshotToPlayer(r.finalSnapshot);
      const g = computeGrade(player, target);
      perPath[r.path].runs += 1;
      perPath[r.path].gradeHistogram[g.letter] += 1;
      pooledHist[g.letter] += 1;
      sumFreedomFrac += g.components.freedom / caps.freedom;
      sumSustFrac += g.components.sustainability / caps.sustainability;
      sumGrowthFrac += g.components.growth / caps.growth;
    }

    const n = rows.length || 1;
    return {
      target,
      perPath,
      pooled: {
        runs: rows.length,
        gradeHistogram: pooledHist,
        componentFractions: {
          freedom: Math.round((sumFreedomFrac / n) * 1000) / 1000,
          sustainability: Math.round((sumSustFrac / n) * 1000) / 1000,
          growth: Math.round((sumGrowthFrac / n) * 1000) / 1000,
        },
        componentMaxes: caps,
      },
    };
  });
}

// --- freedom-curve sweep --------------------------------------------------
//
// Shape sweep, not target sweep. The shipped freedom term is
//   freedom = cap × min(1, ratio / ceiling)
// We generalize to
//   freedom = cap × ( min(1, ratio / ceiling) ) ^ exponent
// and walk a small grid. exponent = 1 reproduces today's linear cap and is
// the control: at the shipped ceiling 0.15 every pair (0.15, 1.0) should
// match the live grades. We pass the candidate ceiling via the existing
// `target` arg and the exponent via GradeOptions — grade.ts defaults are
// untouched.

export const DEFAULT_FREEDOM_CEILINGS: readonly number[] = [0.55, 0.65, 0.75];
export const DEFAULT_FREEDOM_EXPONENTS: readonly number[] = [0.35, 0.45, 0.6, 1.0];

export type FreedomCurveBucket = {
  ceiling: number;
  exponent: number;
  perPath: Record<
    FoundationPathId,
    { runs: number; gradeHistogram: Record<GradeLetter, number> }
  >;
  pooled: {
    runs: number;
    gradeHistogram: Record<GradeLetter, number>;
    freedomFraction: number;
  };
};

function emptyHist(): Record<GradeLetter, number> {
  return { S: 0, A: 0, B: 0, C: 0, D: 0 };
}

export function runFreedomCurveSweep(
  rows: readonly RunRow[],
  ceilings: readonly number[] = DEFAULT_FREEDOM_CEILINGS,
  exponents: readonly number[] = DEFAULT_FREEDOM_EXPONENTS,
): FreedomCurveBucket[] {
  const cap = GRADE_CONFIG.weights.freedom.cap;
  const out: FreedomCurveBucket[] = [];
  for (const ceiling of ceilings) {
    for (const exponent of exponents) {
      const perPath = {} as Record<
        FoundationPathId,
        { runs: number; gradeHistogram: Record<GradeLetter, number> }
      >;
      for (const p of FOUNDATION_PATHS) {
        perPath[p.id] = { runs: 0, gradeHistogram: emptyHist() };
      }
      const pooled = emptyHist();
      let sumFreedomFrac = 0;
      for (const r of rows) {
        const player = snapshotToPlayer(r.finalSnapshot);
        const opts: GradeOptions = { freedomExponent: exponent };
        const g = computeGrade(player, ceiling, opts);
        perPath[r.path].runs += 1;
        perPath[r.path].gradeHistogram[g.letter] += 1;
        pooled[g.letter] += 1;
        sumFreedomFrac += g.components.freedom / cap;
      }
      const n = rows.length || 1;
      out.push({
        ceiling,
        exponent,
        perPath,
        pooled: {
          runs: rows.length,
          gradeHistogram: pooled,
          freedomFraction: Math.round((sumFreedomFrac / n) * 1000) / 1000,
        },
      });
    }
  }
  return out;
}

// --- growth-ceiling sweep -------------------------------------------------
//
// The shipped growth term normalizes against an implicit ceiling of 100
// (avgStrength can reach 100 only if every strength is maxed). The sweep
// lowers this ceiling so a terminal slice average saturates closer to full
// marks. factor = 1.0 is the control; the others compress.

export const DEFAULT_GROWTH_CEILING_FACTORS: readonly number[] = [1.0, 0.66, 0.5];
const SHIPPED_GROWTH_CEILING = 100;

export type GrowthCeilingBucket = {
  factor: number;
  ceiling: number;
  perPath: Record<
    FoundationPathId,
    { runs: number; gradeHistogram: Record<GradeLetter, number> }
  >;
  pooled: {
    runs: number;
    gradeHistogram: Record<GradeLetter, number>;
    growthFraction: number;
  };
};

export function runGrowthCeilingSweep(
  rows: readonly RunRow[],
  factors: readonly number[] = DEFAULT_GROWTH_CEILING_FACTORS,
): GrowthCeilingBucket[] {
  const cap = GRADE_CONFIG.weights.growth.cap;
  const out: GrowthCeilingBucket[] = [];
  for (const factor of factors) {
    const ceiling = SHIPPED_GROWTH_CEILING * factor;
    const perPath = {} as Record<
      FoundationPathId,
      { runs: number; gradeHistogram: Record<GradeLetter, number> }
    >;
    for (const p of FOUNDATION_PATHS) {
      perPath[p.id] = { runs: 0, gradeHistogram: emptyHist() };
    }
    const pooled = emptyHist();
    let sumGrowthFrac = 0;
    for (const r of rows) {
      const player = snapshotToPlayer(r.finalSnapshot);
      const opts: GradeOptions = { growthCeiling: ceiling };
      const g = computeGrade(player, undefined, opts);
      perPath[r.path].runs += 1;
      perPath[r.path].gradeHistogram[g.letter] += 1;
      pooled[g.letter] += 1;
      sumGrowthFrac += g.components.growth / cap;
    }
    const n = rows.length || 1;
    out.push({
      factor,
      ceiling,
      perPath,
      pooled: {
        runs: rows.length,
        gradeHistogram: pooled,
        growthFraction: Math.round((sumGrowthFrac / n) * 1000) / 1000,
      },
    });
  }
  return out;
}

// --- reference run -------------------------------------------------------
//
// Pick the university Strong Start row closest to (freedom=15%, $114k net
// worth) using a normalized two-axis distance. This is the run we want the
// freedom curve to read as "B with headroom" — saturating to A means the
// curve under-rewards the next 30% of freedom, punishing to C means it
// over-punishes a legitimately solid slice.

export type ReferenceRunBreakdown = {
  ceiling: number;
  exponent: number;
  freedom: number;
  sustainability: number;
  growth: number;
  total: number;
  letter: GradeLetter;
};

export function findUniversityReferenceRun(
  rows: readonly RunRow[],
  targetFreedomPct = 15,
  targetNetWorth = 114_000,
): RunRow | null {
  const candidates = rows.filter(
    (r) => r.path === 'university' && r.endingTitle === 'Strong Start',
  );
  if (candidates.length === 0) return null;
  let best: { row: RunRow; score: number } | null = null;
  for (const r of candidates) {
    const dF =
      Math.abs(r.freedomPct - targetFreedomPct) /
      Math.max(targetFreedomPct, 1);
    const dN =
      Math.abs(r.finalNetWorth - targetNetWorth) /
      Math.max(targetNetWorth, 1);
    const score = dF + dN;
    if (!best || score < best.score) best = { row: r, score };
  }
  return best?.row ?? null;
}

export function scoreReferenceUnderCurves(
  row: RunRow,
  ceilings: readonly number[] = DEFAULT_FREEDOM_CEILINGS,
  exponents: readonly number[] = DEFAULT_FREEDOM_EXPONENTS,
): ReferenceRunBreakdown[] {
  const player = snapshotToPlayer(row.finalSnapshot);
  const out: ReferenceRunBreakdown[] = [];
  for (const ceiling of ceilings) {
    for (const exponent of exponents) {
      const g = computeGrade(player, ceiling, { freedomExponent: exponent });
      out.push({
        ceiling,
        exponent,
        freedom: g.components.freedom,
        sustainability: g.components.sustainability,
        growth: g.components.growth,
        total: g.score,
        letter: g.letter,
      });
    }
  }
  return out;
}

// --- burnout-by-policy ---------------------------------------------------

export type BurnoutByPolicyRow = {
  path: FoundationPathId;
  policy: string;
  runs: number;
  endings: Record<string, number>;
  medianPeakStress: number;
  medianFinalStress: number;
};

export function burnoutByPolicy(
  rows: readonly RunRow[],
): BurnoutByPolicyRow[] {
  const buckets = new Map<string, RunRow[]>();
  for (const r of rows) {
    const k = `${r.path}::${r.policy}`;
    const arr = buckets.get(k) ?? [];
    arr.push(r);
    buckets.set(k, arr);
  }
  const out: BurnoutByPolicyRow[] = [];
  for (const [k, bucket] of buckets) {
    const [path, policy] = k.split('::') as [FoundationPathId, string];
    const endings: Record<string, number> = {};
    for (const r of bucket) {
      endings[r.endingTitle] = (endings[r.endingTitle] ?? 0) + 1;
    }
    out.push({
      path,
      policy,
      runs: bucket.length,
      endings,
      medianPeakStress: Math.round(median(bucket.map((r) => r.peakStress))),
      medianFinalStress: Math.round(median(bucket.map((r) => r.finalStress))),
    });
  }
  // Deterministic ordering: path order from FOUNDATION_PATHS, policy order
  // from POLICIES.
  const pathOrder = new Map(FOUNDATION_PATHS.map((p, i) => [p.id, i]));
  const policyOrder = new Map(POLICIES.map((p, i) => [p.id, i]));
  out.sort((a, b) => {
    const dp = (pathOrder.get(a.path) ?? 0) - (pathOrder.get(b.path) ?? 0);
    if (dp !== 0) return dp;
    return (policyOrder.get(a.policy) ?? 0) - (policyOrder.get(b.policy) ?? 0);
  });
  return out;
}

// --- summary helpers ------------------------------------------------------

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

const median = (xs: number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  return quantile(sorted, 0.5);
};

function summarize(path: FoundationPathId, rows: RunRow[]): PerPathSummary {
  const freedomSorted = rows
    .map((r) => r.freedomPct)
    .sort((a, b) => a - b);

  const grade: Record<GradeLetter, number> = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const r of rows) grade[r.gradeLetter] += 1;

  const caps = {
    freedom: GRADE_CONFIG.weights.freedom.cap,
    sustainability: GRADE_CONFIG.weights.sustainability.cap,
    growth: GRADE_CONFIG.weights.growth.cap,
  };
  const mean = (xs: number[]): number =>
    xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
  const freedomFrac = mean(rows.map((r) => r.components.freedom / caps.freedom));
  const sustFrac = mean(
    rows.map((r) => r.components.sustainability / caps.sustainability),
  );
  const growthFrac = mean(rows.map((r) => r.components.growth / caps.growth));

  const endings: Record<string, number> = {};
  for (const r of rows) {
    endings[r.endingTitle] = (endings[r.endingTitle] ?? 0) + 1;
  }

  const leaningCounts: Record<Leaning, number> = {
    corporate: 0,
    founder: 0,
    independent: 0,
    undecided: 0,
    none: 0,
  };
  for (const r of rows) leaningCounts[r.leaning] += 1;

  // Cross-pull probe per leaning. "Other flavor" excludes the leaning itself.
  const probeFor = (
    leaning: 'corporate' | 'founder' | 'independent',
  ): { runs: number; pctSawOtherFlavor: number } => {
    const subset = rows.filter((r) => r.leaning === leaning);
    if (subset.length === 0) return { runs: 0, pctSawOtherFlavor: 0 };
    const otherSeen = subset.filter((r) => {
      if (leaning === 'corporate')
        return r.sawFounderOppEligible || r.sawIndependentOppEligible;
      if (leaning === 'founder')
        return r.sawCorporateOppEligible || r.sawIndependentOppEligible;
      return r.sawCorporateOppEligible || r.sawFounderOppEligible;
    }).length;
    return {
      runs: subset.length,
      pctSawOtherFlavor: Math.round((otherSeen / subset.length) * 100),
    };
  };

  return {
    path,
    runs: rows.length,
    freedom: {
      min: Math.round(freedomSorted[0] ?? 0),
      median: Math.round(quantile(freedomSorted, 0.5)),
      p90: Math.round(quantile(freedomSorted, 0.9)),
      max: Math.round(freedomSorted[freedomSorted.length - 1] ?? 0),
    },
    gradeHistogram: grade,
    componentFractions: {
      freedom: Math.round(freedomFrac * 1000) / 1000,
      sustainability: Math.round(sustFrac * 1000) / 1000,
      growth: Math.round(growthFrac * 1000) / 1000,
    },
    componentMaxes: caps,
    netWorth: {
      medianFinal: Math.round(median(rows.map((r) => r.finalNetWorth))),
      medianSlopePerMonth:
        Math.round(median(rows.map((r) => r.netWorthSlopePerMonth)) * 100) /
        100,
    },
    stress: {
      medianPeak: Math.round(median(rows.map((r) => r.peakStress))),
      medianFinal: Math.round(median(rows.map((r) => r.finalStress))),
    },
    endings,
    leaningCounts,
    crossPull: {
      corporate: probeFor('corporate'),
      founder: probeFor('founder'),
      independent: probeFor('independent'),
    },
  };
}

// --- public API -----------------------------------------------------------

export type RunReportOptions = {
  // ≥20 seeds per the prompt; default 24 = clean multiple of POLICIES.length.
  seeds?: number;
  // Starting seed offset; same seed set is shared across all four paths.
  seedBase?: number;
  // Event IDs to remove from the eligible pool — used for before/after
  // content-effect comparisons. Same seeds + same policies → the only
  // difference between two runs is the event set.
  excludeEventIds?: ReadonlySet<string>;
  // Per-run target age (40–60). Omit to let createPlayer default to
  // RUN_TARGET_AGE_DEFAULT.
  targetAge?: number;
};

// Event IDs added in the prompt 7.3 content pass. Pass this set as
// excludeEventIds to reproduce the pre-content baseline against the same
// seeds.
export const NEW_CONTENT_EVENT_IDS: ReadonlySet<string> = new Set([
  'university_income_relief_lowsalary',
  'university_income_relief_debt',
  'university_income_relief_stress',
  'universal_cross_pull',
  'career_layoff_with_fund',
  'career_layoff_no_fund',
]);

export function runReport(opts: RunReportOptions = {}): Report {
  const seeds = Math.max(20, opts.seeds ?? 24);
  const base = opts.seedBase ?? 1;
  const sharedSeeds: number[] = [];
  for (let i = 0; i < seeds; i++) sharedSeeds.push(base + i);

  const rows: RunRow[] = [];
  const perPath = {} as Record<FoundationPathId, PerPathSummary>;

  for (const path of FOUNDATION_PATHS) {
    const pathRows: RunRow[] = [];
    for (let i = 0; i < sharedSeeds.length; i++) {
      const seed = sharedSeeds[i];
      // Round-robin policy assignment — same (seed,policy) pairing across
      // paths, so paths are compared on the same play styles too.
      const policy = POLICIES[i % POLICIES.length];
      pathRows.push(
        driveRun(path.id, seed, policy, opts.excludeEventIds, opts.targetAge),
      );
    }
    rows.push(...pathRows);
    perPath[path.id] = summarize(path.id, pathRows);
  }

  return {
    config: {
      seeds,
      policiesUsed: POLICIES.map((p) => p.id),
    },
    rows,
    perPath,
  };
}

// --- named scoring-config sweep ------------------------------------------
//
// Combined freedom-curve × growth-ceiling preview. Caller supplies named
// configs (control, F1, F2, F3) and we rescore every row under each, so the
// per-path + pooled histograms can be eyeballed side by side without
// re-running the sim. grade.ts defaults stay shipped values; we only pass
// the optional params from here.

export type NamedScoringConfig = {
  name: string;
  description: string;
  target: number;          // freedom ceiling (passed as the 2nd computeGrade arg)
  freedomExponent: number; // 1 reproduces the shipped linear cap
  growthCeiling: number;   // 100 reproduces the shipped formula
};

export const DEFAULT_SCORING_CONFIGS: readonly NamedScoringConfig[] = [
  {
    name: 'control',
    description:
      'Shipped formula: freedom ceiling 0.15, exponent 1.0, growth ceiling 100. Sanity check — should reproduce live grades exactly.',
    target: 0.15,
    freedomExponent: 1,
    growthCeiling: 100,
  },
  {
    name: 'F1',
    description:
      'Primary candidate: freedom ceiling 0.65, exponent 0.45, growth ceiling 66.',
    target: 0.65,
    freedomExponent: 0.45,
    growthCeiling: 66,
  },
  {
    name: 'F2',
    description:
      'Softer freedom: ceiling 0.55, exponent 0.45, growth ceiling 66.',
    target: 0.55,
    freedomExponent: 0.45,
    growthCeiling: 66,
  },
  {
    name: 'F3',
    description:
      'Higher growth bar: freedom ceiling 0.65, exponent 0.45, growth ceiling 75.',
    target: 0.65,
    freedomExponent: 0.45,
    growthCeiling: 75,
  },
];

export type ScoringConfigBucket = {
  config: NamedScoringConfig;
  perPath: Record<
    FoundationPathId,
    { runs: number; gradeHistogram: Record<GradeLetter, number> }
  >;
  pooled: {
    runs: number;
    gradeHistogram: Record<GradeLetter, number>;
    freedomFraction: number;
    sustainabilityFraction: number;
    growthFraction: number;
  };
};

export function runScoringConfigSweep(
  rows: readonly RunRow[],
  configs: readonly NamedScoringConfig[] = DEFAULT_SCORING_CONFIGS,
): ScoringConfigBucket[] {
  const caps = {
    freedom: GRADE_CONFIG.weights.freedom.cap,
    sustainability: GRADE_CONFIG.weights.sustainability.cap,
    growth: GRADE_CONFIG.weights.growth.cap,
  };
  return configs.map((config) => {
    const perPath = {} as Record<
      FoundationPathId,
      { runs: number; gradeHistogram: Record<GradeLetter, number> }
    >;
    for (const p of FOUNDATION_PATHS) {
      perPath[p.id] = { runs: 0, gradeHistogram: emptyHist() };
    }
    const pooledHist = emptyHist();
    let sumFreedomFrac = 0;
    let sumSustFrac = 0;
    let sumGrowthFrac = 0;
    for (const r of rows) {
      const player = snapshotToPlayer(r.finalSnapshot);
      const g = computeGrade(player, config.target, {
        freedomExponent: config.freedomExponent,
        growthCeiling: config.growthCeiling,
      });
      perPath[r.path].runs += 1;
      perPath[r.path].gradeHistogram[g.letter] += 1;
      pooledHist[g.letter] += 1;
      sumFreedomFrac += g.components.freedom / caps.freedom;
      sumSustFrac += g.components.sustainability / caps.sustainability;
      sumGrowthFrac += g.components.growth / caps.growth;
    }
    const n = rows.length || 1;
    return {
      config,
      perPath,
      pooled: {
        runs: rows.length,
        gradeHistogram: pooledHist,
        freedomFraction: Math.round((sumFreedomFrac / n) * 1000) / 1000,
        sustainabilityFraction: Math.round((sumSustFrac / n) * 1000) / 1000,
        growthFraction: Math.round((sumGrowthFrac / n) * 1000) / 1000,
      },
    };
  });
}

// --- rescore grid (cool the S band via growth ceiling) ------------------
//
// 6-cell grid: primary row at freedom exponent 0.45, backup at 0.50; both
// at freedom ceiling 0.65. Growth ceiling sweeps {75, 85, 95}.
// Auto-pick rule: pooled S in [10,15]%, B modal, 15%-reference is a B with
// total ≥ 45 (5 above the C threshold), prefer the 0.45 row, tie-break on
// the most balanced C/D tail.

export const RESCORE_GRID_CONFIGS: readonly NamedScoringConfig[] = [
  {
    name: 'P-75',
    description: 'primary (exp 0.45), growthCeiling 75',
    target: 0.65,
    freedomExponent: 0.45,
    growthCeiling: 75,
  },
  {
    name: 'P-85',
    description: 'primary (exp 0.45), growthCeiling 85',
    target: 0.65,
    freedomExponent: 0.45,
    growthCeiling: 85,
  },
  {
    name: 'P-95',
    description: 'primary (exp 0.45), growthCeiling 95',
    target: 0.65,
    freedomExponent: 0.45,
    growthCeiling: 95,
  },
  {
    name: 'B-75',
    description: 'backup (exp 0.50), growthCeiling 75',
    target: 0.65,
    freedomExponent: 0.5,
    growthCeiling: 75,
  },
  {
    name: 'B-85',
    description: 'backup (exp 0.50), growthCeiling 85',
    target: 0.65,
    freedomExponent: 0.5,
    growthCeiling: 85,
  },
  {
    name: 'B-95',
    description: 'backup (exp 0.50), growthCeiling 95',
    target: 0.65,
    freedomExponent: 0.5,
    growthCeiling: 95,
  },
];

export type QualifyingCell = {
  cell: ScoringConfigBucket;
  reference: {
    freedom: number;
    sustainability: number;
    growth: number;
    total: number;
    letter: GradeLetter;
  } | null;
};

export function pickQualifyingCell(
  grid: readonly ScoringConfigBucket[],
  refRun: RunRow | null,
): QualifyingCell | null {
  const C_THRESHOLD = GRADE_CONFIG.thresholds.C;
  const HEADROOM_MIN = 5;
  const qualifying: ScoringConfigBucket[] = [];
  for (const cell of grid) {
    const h = cell.pooled.gradeHistogram;
    const total = h.S + h.A + h.B + h.C + h.D;
    if (total === 0) continue;
    const sPct = (h.S / total) * 100;
    if (sPct < 10 || sPct > 15) continue;
    const bModal = h.B > h.S && h.B > h.A && h.B > h.C && h.B > h.D;
    if (!bModal) continue;
    if (refRun) {
      const refBreakdown = scoreRowUnderConfigs(refRun, [cell.config])[0];
      if (
        refBreakdown.letter !== 'B' ||
        refBreakdown.total < C_THRESHOLD + HEADROOM_MIN
      ) {
        continue;
      }
    }
    qualifying.push(cell);
  }
  if (qualifying.length === 0) return null;

  const primary = qualifying.filter((c) => c.config.freedomExponent === 0.45);
  const pool = primary.length > 0 ? primary : qualifying;

  // Most balanced C/D: minimize |C-D|, tie-break by larger C+D (more tail).
  const chosen = pool.reduce((best, cur) => {
    const bh = best.pooled.gradeHistogram;
    const ch = cur.pooled.gradeHistogram;
    const bDiff = Math.abs(bh.C - bh.D);
    const cDiff = Math.abs(ch.C - ch.D);
    if (cDiff < bDiff) return cur;
    if (cDiff === bDiff && ch.C + ch.D > bh.C + bh.D) return cur;
    return best;
  });

  const refBreakdown = refRun
    ? scoreRowUnderConfigs(refRun, [chosen.config])[0]
    : null;
  return {
    cell: chosen,
    reference: refBreakdown
      ? {
          freedom: refBreakdown.freedom,
          sustainability: refBreakdown.sustainability,
          growth: refBreakdown.growth,
          total: refBreakdown.total,
          letter: refBreakdown.letter,
        }
      : null,
  };
}

export function printRescoreGrid(after: Report): QualifyingCell | null {
  const lines: string[] = [];
  lines.push('## RESCORE GRID — cool the S band via growth ceiling (no resim)');
  lines.push(
    '# primary: freedom ceiling 0.65, exp 0.45 × growth ceiling in {75, 85, 95}',
  );
  lines.push(
    '# backup:  freedom ceiling 0.65, exp 0.50 × growth ceiling in {75, 85, 95}',
  );

  const grid = runScoringConfigSweep(after.rows, RESCORE_GRID_CONFIGS);
  const refRun = findReferenceRunAcrossPaths(after.rows);

  for (const b of grid) {
    lines.push('');
    lines.push(
      `${b.config.name}: ceiling=${b.config.target}, exp=${b.config.freedomExponent}, growthCeiling=${b.config.growthCeiling}`,
    );
    lines.push(
      `  ${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
    );
    for (const p of FOUNDATION_PATHS) {
      const h = b.perPath[p.id].gradeHistogram;
      lines.push(
        `  ${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
      );
    }
    const ph = b.pooled.gradeHistogram;
    const total = ph.S + ph.A + ph.B + ph.C + ph.D || 1;
    const pct = (n: number): string => `${Math.round((n / total) * 100)}%`;
    lines.push(
      `  ${pad('POOLED', 18)} ${padL(ph.S, 4)} ${padL(ph.A, 4)} ${padL(ph.B, 4)} ${padL(ph.C, 4)} ${padL(ph.D, 4)}   S=${pct(ph.S)}  A=${pct(ph.A)}  B=${pct(ph.B)}  C=${pct(ph.C)}  D=${pct(ph.D)}`,
    );
    if (refRun) {
      const rb = scoreRowUnderConfigs(refRun, [b.config])[0];
      lines.push(
        `  15%-ref  total=${rb.total} letter=${rb.letter}  (freedom=${rb.freedom}/50  sust=${rb.sustainability}/30  growth=${rb.growth}/20)`,
      );
    }
  }

  const picked = pickQualifyingCell(grid, refRun);
  lines.push('');
  if (!picked) {
    lines.push(
      '## NO CELL QUALIFIED — apply nothing. (Criteria: pooled S ∈ [10,15]%, B modal, 15%-ref is B with total ≥ 45.)',
    );
  } else {
    const c = picked.cell.config;
    const h = picked.cell.pooled.gradeHistogram;
    const total = h.S + h.A + h.B + h.C + h.D || 1;
    const pct = (n: number): string => `${Math.round((n / total) * 100)}%`;
    lines.push(
      `## QUALIFYING CELL: ${c.name}  (ceiling=${c.target}, exp=${c.freedomExponent}, growthCeiling=${c.growthCeiling})`,
    );
    lines.push(
      `   pooled = S=${h.S} (${pct(h.S)})  A=${h.A} (${pct(h.A)})  B=${h.B} (${pct(h.B)})  C=${h.C} (${pct(h.C)})  D=${h.D} (${pct(h.D)})`,
    );
    if (picked.reference) {
      lines.push(
        `   15%-ref breakdown: freedom=${picked.reference.freedom}/50  sust=${picked.reference.sustainability}/30  growth=${picked.reference.growth}/20  total=${picked.reference.total}  letter=${picked.reference.letter}`,
      );
    }
    lines.push(
      `   → To lock: set TARGET_FREEDOM_AT_END_AGE=${c.target}, freedom exponent default=${c.freedomExponent}, growth ceiling default=${c.growthCeiling} in grade.ts`,
    );
  }
  lines.push('');
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
  return picked;
}

// --- widened reference run picker ----------------------------------------

export function findReferenceRunAcrossPaths(
  rows: readonly RunRow[],
  targetFreedomPct = 15,
  targetNetWorth = 114_000,
): RunRow | null {
  const candidates = rows.filter((r) => r.endingTitle === 'Strong Start');
  if (candidates.length === 0) return null;
  let best: { row: RunRow; score: number } | null = null;
  for (const r of candidates) {
    const dF =
      Math.abs(r.freedomPct - targetFreedomPct) /
      Math.max(targetFreedomPct, 1);
    const dN =
      Math.abs(r.finalNetWorth - targetNetWorth) /
      Math.max(targetNetWorth, 1);
    const score = dF + dN;
    if (!best || score < best.score) best = { row: r, score };
  }
  return best?.row ?? null;
}

export function scoreRowUnderConfigs(
  row: RunRow,
  configs: readonly NamedScoringConfig[] = DEFAULT_SCORING_CONFIGS,
): Array<{
  config: NamedScoringConfig;
  freedom: number;
  sustainability: number;
  growth: number;
  total: number;
  letter: GradeLetter;
}> {
  const player = snapshotToPlayer(row.finalSnapshot);
  return configs.map((config) => {
    const g = computeGrade(player, config.target, {
      freedomExponent: config.freedomExponent,
      growthCeiling: config.growthCeiling,
    });
    return {
      config,
      freedom: g.components.freedom,
      sustainability: g.components.sustainability,
      growth: g.components.growth,
      total: g.score,
      letter: g.letter,
    };
  });
}

// --- before/after diff printers ------------------------------------------

export function printContentEffect(before: Report, after: Report): void {
  const lines: string[] = [];
  lines.push(
    '## CONTENT EFFECT — ending histogram BEFORE vs AFTER (shipped grade.ts defaults)',
  );
  for (const p of FOUNDATION_PATHS) {
    const beforeEndings = before.perPath[p.id].endings;
    const afterEndings = after.perPath[p.id].endings;
    const titles = new Set<string>([
      ...Object.keys(beforeEndings),
      ...Object.keys(afterEndings),
    ]);
    const ordered = Array.from(titles).sort();
    lines.push('');
    lines.push(p.id);
    lines.push(
      `  ${pad('ending', 22)} ${padL('before', 7)} ${padL('after', 7)} ${padL('delta', 7)}`,
    );
    for (const t of ordered) {
      const b = beforeEndings[t] ?? 0;
      const a = afterEndings[t] ?? 0;
      const d = a - b;
      const deltaStr = (d > 0 ? '+' : '') + d;
      lines.push(
        `  ${pad(t, 22)} ${padL(b, 7)} ${padL(a, 7)} ${padL(deltaStr, 7)}`,
      );
    }
  }
  lines.push('');
  lines.push(
    '## CONTENT EFFECT — cross-pull probe (% of leaning_X runs that saw OTHER-flavor opportunity)',
  );
  lines.push(
    `  ${pad('path', 18)} ${pad('leaning', 14)} ${padL('n (b/a)', 9)} ${padL('before%', 8)} ${padL('after%', 7)} ${padL('delta', 7)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const b = before.perPath[p.id].crossPull;
    const a = after.perPath[p.id].crossPull;
    const rows: Array<[string, typeof b.corporate, typeof a.corporate]> = [
      ['corporate', b.corporate, a.corporate],
      ['founder', b.founder, a.founder],
      ['independent', b.independent, a.independent],
    ];
    for (const [name, bb, aa] of rows) {
      const delta = aa.pctSawOtherFlavor - bb.pctSawOtherFlavor;
      const dStr = (delta > 0 ? '+' : '') + delta;
      lines.push(
        `  ${pad(p.id, 18)} ${pad(name, 14)} ${padL(`${bb.runs}/${aa.runs}`, 9)} ${padL(bb.pctSawOtherFlavor, 8)} ${padL(aa.pctSawOtherFlavor, 7)} ${padL(dStr, 7)}`,
      );
    }
  }
  lines.push('');
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}

export function printCombinedGradePreview(after: Report): void {
  const lines: string[] = [];
  lines.push(
    '## COMBINED GRADE PREVIEW — params via harness, grade.ts defaults untouched',
  );
  const sweep = runScoringConfigSweep(after.rows);
  for (const b of sweep) {
    lines.push('');
    lines.push(
      `config: ${b.config.name}  (ceiling=${b.config.target}, exp=${b.config.freedomExponent}, growthCeiling=${b.config.growthCeiling})`,
    );
    lines.push(`  ${b.config.description}`);
    lines.push(
      `  ${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
    );
    for (const p of FOUNDATION_PATHS) {
      const h = b.perPath[p.id].gradeHistogram;
      lines.push(
        `  ${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
      );
    }
    const ph = b.pooled.gradeHistogram;
    const total = ph.S + ph.A + ph.B + ph.C + ph.D || 1;
    const pct = (n: number): string =>
      `${Math.round((n / total) * 100)}%`;
    lines.push(
      `  ${pad('POOLED', 18)} ${padL(ph.S, 4)} ${padL(ph.A, 4)} ${padL(ph.B, 4)} ${padL(ph.C, 4)} ${padL(ph.D, 4)}   (${pct(ph.S)}/${pct(ph.A)}/${pct(ph.B)}/${pct(ph.C)}/${pct(ph.D)})`,
    );
    lines.push(
      `  pooled component fractions: freedom=${b.pooled.freedomFraction.toFixed(3)}  sust=${b.pooled.sustainabilityFraction.toFixed(3)}  growth=${b.pooled.growthFraction.toFixed(3)}`,
    );
  }
  lines.push('');
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}

export function printReferenceRunAllPaths(after: Report): void {
  const lines: string[] = [];
  lines.push(
    '## REFERENCE RUN — all paths, nearest (freedom=15%, networth≈$114k)',
  );
  const ref = findReferenceRunAcrossPaths(after.rows);
  if (!ref) {
    lines.push('  (no Strong Start row found across any path)');
    // eslint-disable-next-line no-console
    console.log(lines.join('\n'));
    return;
  }
  const avgStrength =
    (ref.finalSnapshot.skill +
      ref.finalSnapshot.network +
      ref.finalSnapshot.reputation +
      ref.finalSnapshot.discipline +
      ref.finalSnapshot.riskTolerance +
      ref.finalSnapshot.ambition) /
    6;
  lines.push(
    `  path=${ref.path}  seed=${ref.seed}  policy=${ref.policy}  freedomPct=${ref.freedomPct}  finalNetWorth=$${Math.round(ref.finalNetWorth)}  peakStress=${ref.peakStress}  endStress=${ref.finalStress}`,
  );
  lines.push(
    `  passiveIncome=$${ref.finalSnapshot.passiveIncome}/mo  expenses=$${ref.finalSnapshot.expenses}/mo  avgStrength=${avgStrength.toFixed(1)}  ending=${ref.endingTitle}`,
  );
  lines.push('');
  lines.push(
    `  ${pad('config', 10)} ${padL('freedom/50', 11)} ${padL('sustain/30', 11)} ${padL('growth/20', 10)} ${padL('total', 6)} ${padL('letter', 6)}`,
  );
  const breakdown = scoreRowUnderConfigs(ref);
  for (const b of breakdown) {
    lines.push(
      `  ${pad(b.config.name, 10)} ${padL(b.freedom, 11)} ${padL(b.sustainability, 11)} ${padL(b.growth, 10)} ${padL(b.total, 6)} ${padL(b.letter, 6)}`,
    );
  }
  lines.push('');
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}

// --- console formatter ----------------------------------------------------

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

export function printReport(report: Report): void {
  const lines: string[] = [];
  lines.push(
    `# Per-path sim — ${report.config.seeds} seeds × ${FOUNDATION_PATHS.length} paths` +
      ` = ${report.config.seeds * FOUNDATION_PATHS.length} runs`,
  );
  lines.push(`# Policies (round-robin by seed): ${report.config.policiesUsed.join(', ')}`);
  lines.push('');

  // ── Freedom % table ────────────────────────────────────────────────────
  lines.push('## Final freedom% (min / median / p90 / max)');
  lines.push(
    `${pad('path', 18)} ${padL('min', 5)} ${padL('med', 5)} ${padL('p90', 5)} ${padL('max', 5)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const s = report.perPath[p.id];
    lines.push(
      `${pad(p.id, 18)} ${padL(s.freedom.min, 5)} ${padL(s.freedom.median, 5)} ${padL(s.freedom.p90, 5)} ${padL(s.freedom.max, 5)}`,
    );
  }
  lines.push('');

  // ── Grade histogram ────────────────────────────────────────────────────
  lines.push('## Grade histogram (count of S / A / B / C / D)');
  lines.push(
    `${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const h = report.perPath[p.id].gradeHistogram;
    lines.push(
      `${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
    );
  }
  lines.push('');

  // ── Grade components (mean fraction of cap) ────────────────────────────
  lines.push('## Mean grade components at run end (fraction of cap)');
  lines.push(
    `${pad('path', 18)} ${padL('freedom/50', 11)} ${padL('sust/30', 8)} ${padL('growth/20', 10)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const f = report.perPath[p.id].componentFractions;
    const c = report.perPath[p.id].componentMaxes;
    lines.push(
      `${pad(p.id, 18)} ` +
        `${padL((f.freedom * c.freedom).toFixed(1) + ` (${f.freedom.toFixed(2)})`, 11)} ` +
        `${padL((f.sustainability * c.sustainability).toFixed(1) + ` (${f.sustainability.toFixed(2)})`, 8)} ` +
        `${padL((f.growth * c.growth).toFixed(1) + ` (${f.growth.toFixed(2)})`, 10)}`,
    );
  }
  lines.push('');

  // ── Net worth & stress ─────────────────────────────────────────────────
  lines.push('## Net worth & stress (medians)');
  lines.push(
    `${pad('path', 18)} ${padL('final$', 10)} ${padL('slope$/mo', 10)} ${padL('peakStress', 11)} ${padL('endStress', 10)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const s = report.perPath[p.id];
    lines.push(
      `${pad(p.id, 18)} ${padL(s.netWorth.medianFinal, 10)} ${padL(s.netWorth.medianSlopePerMonth, 10)} ${padL(s.stress.medianPeak, 11)} ${padL(s.stress.medianFinal, 10)}`,
    );
  }
  lines.push('');

  // ── Endings ────────────────────────────────────────────────────────────
  lines.push('## Ending histogram (counts)');
  for (const p of FOUNDATION_PATHS) {
    const e = report.perPath[p.id].endings;
    const entries = Object.entries(e).sort((a, b) => b[1] - a[1]);
    lines.push(
      `${pad(p.id, 18)} ${entries.map(([k, v]) => `${k}=${v}`).join('  ')}`,
    );
  }
  lines.push('');

  // ── Cross-pull probe ───────────────────────────────────────────────────
  lines.push('## Cross-pull probe (% of leaning_X runs that ever had ≥1 OTHER-flavor opportunity eligible)');
  lines.push(
    `${pad('path', 18)} ${padL('corp n', 7)} ${padL('corp%', 6)} ${padL('found n', 8)} ${padL('found%', 7)} ${padL('ind n', 6)} ${padL('ind%', 6)}`,
  );
  for (const p of FOUNDATION_PATHS) {
    const c = report.perPath[p.id].crossPull;
    lines.push(
      `${pad(p.id, 18)} ${padL(c.corporate.runs, 7)} ${padL(c.corporate.pctSawOtherFlavor, 6)} ${padL(c.founder.runs, 8)} ${padL(c.founder.pctSawOtherFlavor, 7)} ${padL(c.independent.runs, 6)} ${padL(c.independent.pctSawOtherFlavor, 6)}`,
    );
  }
  lines.push('');

  // ── Target sweep ───────────────────────────────────────────────────────
  lines.push(
    '## Freedom-target sweep — rescored from finalSnapshot, no resim',
  );
  lines.push(
    `# Targets: ${DEFAULT_TARGET_SWEEP.join(', ')} (grade.ts shipped default = 0.15, untouched)`,
  );
  const sweep = runTargetSweep(report.rows);
  for (const bucket of sweep) {
    lines.push('');
    lines.push(`target = ${bucket.target}`);
    lines.push(
      `  ${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
    );
    for (const p of FOUNDATION_PATHS) {
      const h = bucket.perPath[p.id].gradeHistogram;
      lines.push(
        `  ${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
      );
    }
    const ph = bucket.pooled.gradeHistogram;
    lines.push(
      `  ${pad('POOLED', 18)} ${padL(ph.S, 4)} ${padL(ph.A, 4)} ${padL(ph.B, 4)} ${padL(ph.C, 4)} ${padL(ph.D, 4)}`,
    );
    const pf = bucket.pooled.componentFractions;
    const pc = bucket.pooled.componentMaxes;
    lines.push(
      `  pooled components (fraction of cap):  ` +
        `freedom ${(pf.freedom * pc.freedom).toFixed(1)}/${pc.freedom} (${pf.freedom.toFixed(2)})  ` +
        `sustainability ${(pf.sustainability * pc.sustainability).toFixed(1)}/${pc.sustainability} (${pf.sustainability.toFixed(2)})  ` +
        `growth ${(pf.growth * pc.growth).toFixed(1)}/${pc.growth} (${pf.growth.toFixed(2)})`,
    );
  }
  lines.push('');

  // ── Freedom-curve sweep ────────────────────────────────────────────────
  lines.push(
    '## Freedom-curve sweep — points = cap × (min(1, ratio/ceiling))^exponent',
  );
  lines.push(
    `# Ceilings: ${DEFAULT_FREEDOM_CEILINGS.join(', ')}   Exponents: ${DEFAULT_FREEDOM_EXPONENTS.join(', ')}   (exponent=1.0 reproduces today's linear cap)`,
  );
  const curveBuckets = runFreedomCurveSweep(report.rows);
  for (const b of curveBuckets) {
    lines.push('');
    lines.push(
      `ceiling=${b.ceiling}  exponent=${b.exponent}` +
        (b.exponent === 1 ? '   [linear control]' : ''),
    );
    lines.push(
      `  ${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
    );
    for (const p of FOUNDATION_PATHS) {
      const h = b.perPath[p.id].gradeHistogram;
      lines.push(
        `  ${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
      );
    }
    const ph = b.pooled.gradeHistogram;
    lines.push(
      `  ${pad('POOLED', 18)} ${padL(ph.S, 4)} ${padL(ph.A, 4)} ${padL(ph.B, 4)} ${padL(ph.C, 4)} ${padL(ph.D, 4)}   pooled freedom-frac=${b.pooled.freedomFraction.toFixed(3)}`,
    );
  }
  lines.push('');

  // ── Growth-ceiling sweep ───────────────────────────────────────────────
  lines.push(
    '## Growth-ceiling sweep — growth = cap × min(1, avgStrength / ceiling)',
  );
  lines.push(
    `# Shipped ceiling = ${SHIPPED_GROWTH_CEILING}; factors: ${DEFAULT_GROWTH_CEILING_FACTORS.join(', ')}   (factor=1.0 reproduces shipped formula)`,
  );
  const growthBuckets = runGrowthCeilingSweep(report.rows);
  for (const b of growthBuckets) {
    lines.push('');
    lines.push(
      `growthCeiling=${b.ceiling}  (factor=${b.factor})` +
        (b.factor === 1 ? '   [control]' : ''),
    );
    lines.push(
      `  ${pad('path', 18)} ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
    );
    for (const p of FOUNDATION_PATHS) {
      const h = b.perPath[p.id].gradeHistogram;
      lines.push(
        `  ${pad(p.id, 18)} ${padL(h.S, 4)} ${padL(h.A, 4)} ${padL(h.B, 4)} ${padL(h.C, 4)} ${padL(h.D, 4)}`,
      );
    }
    const ph = b.pooled.gradeHistogram;
    lines.push(
      `  ${pad('POOLED', 18)} ${padL(ph.S, 4)} ${padL(ph.A, 4)} ${padL(ph.B, 4)} ${padL(ph.C, 4)} ${padL(ph.D, 4)}   pooled growth-frac=${b.pooled.growthFraction.toFixed(3)}`,
    );
  }
  lines.push('');

  // ── Reference run ──────────────────────────────────────────────────────
  lines.push(
    '## Reference run: University Strong Start nearest (freedom=15%, networth≈$114k)',
  );
  const refRun = findUniversityReferenceRun(report.rows);
  if (!refRun) {
    lines.push('  (no candidate row found — university produced no Strong Start)');
  } else {
    lines.push(
      `  seed=${refRun.seed}  policy=${refRun.policy}  freedomPct=${refRun.freedomPct}  finalNetWorth=$${Math.round(refRun.finalNetWorth)}  peakStress=${refRun.peakStress}  endStress=${refRun.finalStress}`,
    );
    lines.push(
      `  passiveIncome=$${refRun.finalSnapshot.passiveIncome}/mo  expenses=$${refRun.finalSnapshot.expenses}/mo  avgStrength=${(
        (refRun.finalSnapshot.skill +
          refRun.finalSnapshot.network +
          refRun.finalSnapshot.reputation +
          refRun.finalSnapshot.discipline +
          refRun.finalSnapshot.riskTolerance +
          refRun.finalSnapshot.ambition) /
        6
      ).toFixed(1)}  flags=${refRun.flags.join(', ')}`,
    );
    lines.push('');
    lines.push(
      `  ${padL('ceiling', 8)} ${padL('exp', 6)} ${padL('freedom/50', 11)} ${padL('sustain/30', 11)} ${padL('growth/20', 10)} ${padL('total', 6)} ${padL('letter', 6)}`,
    );
    const breakdown = scoreReferenceUnderCurves(refRun);
    for (const b of breakdown) {
      const linearTag = b.exponent === 1 ? '*' : ' ';
      lines.push(
        `  ${padL(b.ceiling.toFixed(2), 8)} ${padL(b.exponent.toFixed(2) + linearTag, 6)} ${padL(b.freedom, 11)} ${padL(b.sustainability, 11)} ${padL(b.growth, 10)} ${padL(b.total, 6)} ${padL(b.letter, 6)}`,
      );
    }
    lines.push(`  (* = linear control, reproduces today's freedom formula at the same ceiling)`);
  }
  lines.push('');

  // ── University recovery check (median end stress per policy) ──────────
  lines.push(
    '## University recovery check — median peak vs. end stress per policy',
  );
  lines.push(
    `  ${pad('policy', 18)} ${padL('runs', 5)} ${padL('medPeakStress', 14)} ${padL('medEndStress', 13)} ${padL('medFreedomPct', 14)} ${padL('Burnout', 8)} ${padL('Strong', 7)} ${padL('Treading', 9)}`,
  );
  const uniRows = report.rows.filter((r) => r.path === 'university');
  for (const pol of POLICIES) {
    const subset = uniRows.filter((r) => r.policy === pol.id);
    if (subset.length === 0) continue;
    const endings: Record<string, number> = {};
    for (const r of subset) endings[r.endingTitle] = (endings[r.endingTitle] ?? 0) + 1;
    const medFree = Math.round(median(subset.map((r) => r.freedomPct)));
    const medPeak = Math.round(median(subset.map((r) => r.peakStress)));
    const medEnd = Math.round(median(subset.map((r) => r.finalStress)));
    lines.push(
      `  ${pad(pol.id, 18)} ${padL(subset.length, 5)} ${padL(medPeak, 14)} ${padL(medEnd, 13)} ${padL(medFree, 14)} ${padL(endings['Burnout Warning'] ?? 0, 8)} ${padL(endings['Strong Start'] ?? 0, 7)} ${padL(endings['Treading Water'] ?? 0, 9)}`,
    );
  }
  lines.push('');

  // ── Burnout-by-policy ──────────────────────────────────────────────────
  lines.push('## Burnout-by-policy — ending counts + median peak stress per (path, policy)');
  const bp = burnoutByPolicy(report.rows);
  // Collect ending titles in deterministic display order.
  const endingTitlesSeen = new Set<string>();
  for (const r of bp) for (const t of Object.keys(r.endings)) endingTitlesSeen.add(t);
  const endingTitles = Array.from(endingTitlesSeen).sort();

  let currentPath: FoundationPathId | null = null;
  for (const row of bp) {
    if (row.path !== currentPath) {
      currentPath = row.path;
      lines.push('');
      lines.push(currentPath);
      lines.push(
        `  ${pad('policy', 18)} ${padL('runs', 5)} ` +
          endingTitles.map((t) => padL(t, 18)).join(' ') +
          ` ${padL('medPeakStress', 14)} ${padL('medEndStress', 13)}`,
      );
    }
    lines.push(
      `  ${pad(row.policy, 18)} ${padL(row.runs, 5)} ` +
        endingTitles.map((t) => padL(row.endings[t] ?? 0, 18)).join(' ') +
        ` ${padL(row.medianPeakStress, 14)} ${padL(row.medianFinalStress, 13)}`,
    );
  }
  lines.push('');

  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}
