// Single tunable config — starting numbers per archetype AND monthly tick parameters.
// Edit these freely; nothing else hardcodes game numbers.

import type { ArchetypeId } from './archetypes';

// Monthly tick (advance time, accrue interest, nudge stress). All values placeholders.
export const TICK_CONFIG = {
  monthsPerYear: 12,
  // Interest applied to *all* liabilities each month (compounds). 0.005 ≈ 6% APR.
  debtInterestPerMonth: 0.005,
  stress: {
    min: 0,
    max: 5,
    // Per-month delta to the hidden `stressMomentum` accumulator; momentum shifts
    // the discrete stress level by 1 each time it crosses ±1. Keeps motion gentle.
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

export type StartingStats = {
  age: number;
  cash: number;
  assets: number;            // 401k, equity valuation, savings, etc.
  liabilities: number;       // student debt, credit-card balance, etc.
  monthlyIncome: number;     // gross paycheck / founder draw / freelance avg
  monthlyExpenses: number;   // fixed burn (rent, food, tools, etc.)
  passiveIncome: number;     // dividends, rentals, royalties — drives Freedom%
  stress: number;            // 0–5, see STRESS_LABEL in DashboardLayer
};

export const STARTING_STATS: Record<ArchetypeId, StartingStats> = {
  // Steady salary, moderate expenses, some student debt, low stress.
  // Net worth < cash because the student loan drags it down.
  corporate: {
    age: 24,
    cash: 6_800,
    assets: 14_200,          // small 401k seed
    liabilities: 18_000,     // student debt
    monthlyIncome: 5_200,    // post-tax-ish salary
    monthlyExpenses: 3_400,
    passiveIncome: 80,       // tiny dividend trickle
    stress: 2,               // Light
  },
  // Little/no salary, high burn, equity-heavy but cash-poor, higher stress.
  // Cash is tiny vs net worth because most value sits in illiquid equity.
  founder: {
    age: 28,
    cash: 1_800,
    assets: 24_000,          // paper-value equity in own startup
    liabilities: 2_400,      // ramen-era credit card
    monthlyIncome: 1_200,    // sub-market founder draw
    monthlyExpenses: 4_800,
    passiveIncome: 0,
    stress: 4,               // Heavy
  },
  // Lower fixed expenses, variable income, low baseline stress.
  // Modest savings, no debt, small course/royalty trickle.
  freelancer: {
    age: 26,
    cash: 3_400,
    assets: 2_800,           // small index-fund stash
    liabilities: 0,
    monthlyIncome: 3_800,    // variable average
    monthlyExpenses: 2_200,
    passiveIncome: 140,      // tiny course / template sales
    stress: 1,               // Easy
  },
};
