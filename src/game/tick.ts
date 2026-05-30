import { projectedCashFlow } from './cashFlow';
import { freedomPct, type Player } from './player';
import { TICK_CONFIG } from './playerConfig';

// Pure monthly tick. Deterministic — no RNG, no I/O.
// Order of operations matters: interest accrues on existing debt BEFORE this month's
// cashflow, then cashflow lands, then any new shortfall rolls into debt.
//
// NOTE: this is the legacy tick that powers the dev "Next Month" button. The beat
// system (§10) will wrap this in a later prompt — keep field names in sync with §27.
export function tick(p: Player): Player {
  const cfg = TICK_CONFIG;

  // 0. Snapshot the projection for the month being closed, using the same
  //    helper the dashboard reads. The next month's dashboard compares its
  //    fresh projection against this value to draw the ↑/↓ cue. Captured
  //    before any tick mutations so it reflects exactly what was shown to
  //    the player when they pressed Next Month.
  const lastProjectedFlow = projectedCashFlow(p);

  // 1. Time
  const month = p.month + 1;
  const monthsElapsed = month - 1;
  const bumpAge =
    monthsElapsed > 0 && monthsElapsed % cfg.monthsPerYear === 0;
  const age = bumpAge ? p.age + 1 : p.age;

  // 2. Existing debt accrues interest first.
  let debt = p.debt > 0 ? p.debt * (1 + cfg.debtInterestPerMonth) : 0;

  // 3. Apply this month's cashflow.
  const cashflow = p.salary + p.passiveIncome - p.expenses;
  let cash = p.cash + cashflow;

  // Going into the red: clamp cash, roll shortfall into debt as new liability.
  if (cash < 0) {
    debt += -cash;
    cash = 0;
  }

  // 4. Stress momentum — keyed off *financial pressure*, not raw debt existence.
  //    Pressure: monthly deficit (scaled by severity) + thin runway (scaled by shortfall)
  //              + debt burden (only when really a burden).
  //    Relief: comfortable surplus + healthy runway + debt covered (or zero).
  //    Momentum accumulates until it crosses ±1, then nudges discrete stress by `step`.
  const s = cfg.stress;
  const monthlyBurn = Math.max(p.expenses, 1);
  const runway = cash / monthlyBurn; // cash is post-clamp, so runway ≥ 0
  const debtCovered = debt <= 0 || cash >= debt;

  const deficitRatio =
    cashflow < 0 ? Math.min(1, -cashflow / monthlyBurn) : 0;
  const deficitPressure = deficitRatio * s.deficitWeight;

  const runwayShortfall =
    runway < s.comfortableRunway
      ? Math.max(0, Math.min(1, (s.comfortableRunway - runway) / s.comfortableRunway))
      : 0;
  const runwayPressure = runwayShortfall * s.runwayWeight;

  // Debt is only a real burden when (a) you're in deficit, or
  // (b) it's large vs income AND not comfortably covered by cash.
  const debtVsIncomeRatio =
    debt <= 0
      ? 0
      : p.salary > 0
        ? debt / (p.salary * s.debtIncomeMultiple)
        : Infinity;
  const debtBurdenActive =
    debt > 0 && (cashflow < 0 || (debtVsIncomeRatio > 1 && !debtCovered));
  const debtBurdenPressure = debtBurdenActive
    ? Math.min(1, debtVsIncomeRatio) * s.debtBurdenWeight
    : 0;

  const reliefActive =
    cashflow >= s.comfortableSurplus &&
    runway >= s.comfortableRunway &&
    debtCovered;
  const reliefAmount = reliefActive ? s.reliefWeight : 0;

  let momentum =
    p.stressMomentum +
    deficitPressure +
    runwayPressure +
    debtBurdenPressure -
    reliefAmount;
  let stress = p.stress;
  if (momentum >= 1) {
    stress = Math.min(s.max, stress + s.step);
    momentum -= 1;
  } else if (momentum <= -1) {
    stress = Math.max(s.min, stress - s.step);
    momentum += 1;
  }

  // 5. Model-1 passive-income compounding. Applied AFTER this month's
  //    cashflow lands so the player's current statement still reflects the
  //    stream they actually earned this month — growth shows up in next
  //    month's number, the same way debt-interest accrues for the next
  //    month's balance. Multiplication preserves the zero floor naturally:
  //    a never-built passiveIncome of 0 stays 0. Deterministic, no RNG.
  const passiveIncome = p.passiveIncome * (1 + cfg.passiveGrowthPerMonth);

  // 6. Net worth history (rounded for clean rendering).
  const netWorth = Math.round(cash + p.assets + p.investments - debt);
  const netWorthHistory = [...p.netWorthHistory, netWorth];

  const next: Player = {
    ...p,
    month,
    age,
    cash,
    debt,
    passiveIncome,
    stress,
    stressMomentum: momentum,
    netWorthHistory,
    lastProjectedFlow,
  };

  return next;
}
