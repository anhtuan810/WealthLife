// Single tunable config — monthly tick parameters only.
// Starting stats now live in src/data/foundationPaths.ts (single source per path).

import { $$ } from '../data/economyScale';

// Monthly tick (advance time, accrue interest, nudge stress). All values placeholders.
export const TICK_CONFIG = {
  monthsPerYear: 12,
  // Interest applied to outstanding debt each month (compounds). 0.005 ≈ 6% APR.
  debtInterestPerMonth: 0.005,
  // Model-1 passive-income compounding. Monthly growth applied to the
  // existing passiveIncome stream — represents reinvested distributions /
  // organic stream-growth without auto-investing the player's cash. Zero
  // stays zero (multiplication preserves a never-built passive at 0).
  // Phase-4 recalibration: lowered from 0.004 (4.9%/yr) to 0.002 (2.4%/yr)
  // so 25y of compounding multiplies by ~2× rather than ~4×; the brief's
  // "freedom needs ~6–10 income streams built and compounded over time"
  // requires per-event coverage AND compounding multiplier to stay
  // modest. TODO_TUNE — Phase 5 retunes once playtests inform balance.
  passiveGrowthPerMonth: 0.002,
  stress: {
    min: 0,
    max: 100,
    // Discrete stress shift each time momentum crosses ±1. Stress is on a
    // 0–100 scale (§27) so a single nudge moves the bar by `step`, not by 1.
    step: 5,
    // Per-month delta to the hidden `stressMomentum` accumulator; momentum shifts
    // the discrete stress level by `step` each time it crosses ±1. Keeps motion gentle.
    // Pressure is scaled by *severity*, not just presence — debt alone, when covered
    // by cash and cash-flow positive, is not a burden.
    deficitWeight: 1.5,         // × deficitRatio = min(1, -cashflow / max(expenses, 1))
    runwayWeight: 0.3,          // × runwayShortfall = clamp((comfRunway - runway) / comfRunway, 0, 1)
    debtBurdenWeight: 0.4,      // × min(1, debt / (income × debtIncomeMultiple)), only when burden active
    reliefWeight: 0.5,          // flat, when all comfort conditions hold

    // ABSOLUTE-DOLLAR constant — wrapped in $$ so it tracks the
    // ECONOMY_SCALE knob. The other stress fields are either ratios,
    // 0–100 deltas, or month counts (scale-invariant) — this is the only
    // one that broke under Phase-4 rescaling. Phase-4 commit: $500/mo
    // relief threshold under student-scale economy → $3,500/mo under
    // ECONOMY_SCALE = 7. Tunable from here.
    comfortableSurplus: $$(500), // $/month cashflow needed for relief
    comfortableRunway: 6,        // months of cash ÷ monthly burn needed for relief (ratio, scale-invariant)
    debtIncomeMultiple: 6,       // debt > N × monthly income counts as "large vs income" (ratio, scale-invariant)
  },
};
