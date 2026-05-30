// Run grade — MASTER §12. Weighted toward freedom + sustainability, not raw
// money. S/A/B/C/D with thresholds and component weights in ONE tunable place.
//
// Composite score (0–100):
//   freedom        0–50  cap × ( min(1, freedomRatio / TARGET_FREEDOM_AT_END_AGE) )^FREEDOM_EXPONENT
//   sustainability 0–30  low stress + intact health + non-spiraling net worth
//   growth         0–20  cap × min(1, avgStrength / GROWTH_CEILING)

import type { Player } from '../game/player';
import { netWorth } from '../game/player';

export type GradeLetter = 'S' | 'A' | 'B' | 'C' | 'D';

export type GradeResult = {
  letter: GradeLetter;
  score: number; // 0–100
  components: {
    freedom: number;        // 0–50
    sustainability: number; // 0–30
    growth: number;         // 0–20
  };
};

// Freedom target — what "100% of the freedom rubric" means at END_AGE.
// Expressed in freedomRatio units (passiveIncome / expenses). Phase-4
// closeout: REVERTED to a flat bar after the Phase-3 age-scaled
// experiment (bar(18)=0.65 → bar(38)=0.50). The "later = harder" framing
// proved wrong — start-age is flavor, not a difficulty ladder, so every
// run is judged against the same coverage rubric and "freedom by 60"
// means the same thing for an 18-start and a 38-start. History: 0.15
// (linear) → 0.65 (concave, single bar) → 0.50–0.65 age-scaled (Phase 3,
// reverted) → flat 0.65 (Phase 4 closeout).
export const FREEDOM_BAR = 0.65;

// Back-compat alias for callers reading TARGET_FREEDOM_AT_END_AGE. The
// flat bar IS the target at end-age; keeping the older name pointing at
// the same constant lets per-path sim harnesses keep their imports valid.
export const TARGET_FREEDOM_AT_END_AGE = FREEDOM_BAR;

// Concave freedom curve. exponent < 1 rewards early progress more than late,
// so a player at ratio 0.30 (half the cap) earns roughly 73% of the points,
// not 50%. Tuned to make the 15%-of-cap reference run a clean B, not a
// saturated A. History: 1.0 (linear) → 0.45.
export const FREEDOM_EXPONENT = 0.45;

// Growth normalization. avgStrength / GROWTH_CEILING → 0..1, clipped at 1.
// 75 means a player averaging 75 across the six strengths saturates growth;
// the cap was 100 in the shipped formula but most full-path runs only reach
// avgStrength ~50, so 100 systematically under-rewarded growth. History:
// 100 → 75.
export const GROWTH_CEILING = 75;

// Single tunable knob block — edit freely.
export const GRADE_CONFIG = {
  // S raised from 85 → 89 in prompt 7.5 (88 first, +1 nudge after the live
  // table landed at 19%). With the concave freedom curve + lower growth
  // ceiling, the +4 total nudge pulls pooled S into the 10–16% target
  // without re-tuning the curves.
  thresholds: { S: 89, A: 70, B: 55, C: 40 } as const, // anything below C → D
  weights: {
    freedom: {
      cap: 50,
    },
    sustainability: {
      cap: 30,
      stressMax: 15,       // (1 - stress/100) × stressMax  → low stress wins
      healthMax: 10,       // (health/100)    × healthMax   → intact health
      netWorthBonus: 5,    // flat +5 if netWorth > 0 (not spiraling)
    },
    growth: {
      cap: 20,
    },
  },
};

const STRENGTH_FIELDS: ReadonlyArray<keyof Player> = [
  'skill',
  'network',
  'reputation',
  'discipline',
  'riskTolerance',
  'ambition',
];

function freedomRatioOf(p: Player): number {
  return p.expenses > 0 ? p.passiveIncome / p.expenses : 0;
}

// Optional `target` + `options` let measurement harnesses (e.g. src/sim)
// rescore an already-simulated end-state under alternative freedom curves
// and growth ceilings without re-running the sim. All defaults are the
// SHIPPED values (TARGET_FREEDOM_AT_END_AGE / FREEDOM_EXPONENT /
// GROWTH_CEILING above); omit / pass undefined to use them.
export type GradeOptions = {
  freedomExponent?: number;
  growthCeiling?: number;
};

export function computeGrade(
  p: Player,
  target?: number,
  options?: GradeOptions,
): GradeResult {
  const w = GRADE_CONFIG.weights;
  // Precedence: an explicit target arg always wins (measurement harnesses
  // use this to sweep candidate bars). Otherwise use the flat FREEDOM_BAR
  // — every run is judged against the same coverage rubric regardless of
  // start age.
  const ceiling =
    target !== undefined && target > 0 ? target : FREEDOM_BAR;
  const exponent =
    options?.freedomExponent !== undefined && options.freedomExponent > 0
      ? options.freedomExponent
      : FREEDOM_EXPONENT;
  const growthCeiling =
    options?.growthCeiling !== undefined && options.growthCeiling > 0
      ? options.growthCeiling
      : GROWTH_CEILING;

  const freedomRatio = freedomRatioOf(p);
  const freedomBase = Math.max(0, Math.min(1, freedomRatio / ceiling));
  const freedomProgress = Math.pow(freedomBase, exponent);
  const freedom = w.freedom.cap * freedomProgress;

  const stressScore =
    Math.max(0, 1 - p.stress / 100) * w.sustainability.stressMax;
  const healthScore =
    Math.min(1, Math.max(0, p.health / 100)) * w.sustainability.healthMax;
  const netWorthScore = netWorth(p) > 0 ? w.sustainability.netWorthBonus : 0;
  const sustainability = Math.min(
    w.sustainability.cap,
    stressScore + healthScore + netWorthScore,
  );

  const avgStrength =
    STRENGTH_FIELDS.reduce((sum, k) => sum + (p[k] as number), 0) /
    STRENGTH_FIELDS.length;
  const growthFraction = Math.min(
    1,
    Math.max(0, avgStrength / growthCeiling),
  );
  const growth = w.growth.cap * growthFraction;

  const score = Math.round(freedom + sustainability + growth);
  const t = GRADE_CONFIG.thresholds;
  const letter: GradeLetter =
    score >= t.S ? 'S'
    : score >= t.A ? 'A'
    : score >= t.B ? 'B'
    : score >= t.C ? 'C'
    : 'D';

  return {
    letter,
    score,
    components: {
      freedom: Math.round(freedom),
      sustainability: Math.round(sustainability),
      growth: Math.round(growth),
    },
  };
}
