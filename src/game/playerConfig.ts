// Single tunable config — monthly tick parameters only.
// Starting stats now live in src/data/foundationPaths.ts (single source per path).

// Monthly tick (advance time, accrue interest, nudge stress). All values placeholders.
export const TICK_CONFIG = {
  monthsPerYear: 12,
  // Interest applied to outstanding debt each month (compounds). 0.005 ≈ 6% APR.
  debtInterestPerMonth: 0.005,
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

    comfortableSurplus: 500,    // $/month cashflow needed for relief
    comfortableRunway: 6,       // months of cash ÷ monthly burn needed for relief
    debtIncomeMultiple: 6,      // debt > N × monthly income counts as "large vs income"
  },
};
