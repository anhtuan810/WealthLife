import type { Player } from './player';
import { TICK_CONFIG } from './playerConfig';

// Pure monthly tick. Deterministic — no RNG, no I/O.
// Order of operations matters: interest accrues on existing debt BEFORE this month's
// cashflow, then cashflow lands, then any new shortfall rolls into liabilities.
export function tick(p: Player): Player {
  const cfg = TICK_CONFIG;

  // 1. Time
  const month = p.month + 1;
  const monthsElapsed = month - 1;
  const bumpAge =
    monthsElapsed > 0 && monthsElapsed % cfg.monthsPerYear === 0;
  const age = bumpAge ? p.age + 1 : p.age;

  // 2. Existing debt accrues interest first.
  let liabilities =
    p.liabilities > 0 ? p.liabilities * (1 + cfg.debtInterestPerMonth) : 0;

  // 3. Apply this month's cashflow.
  const cashflow = p.monthlyIncome + p.passiveIncome - p.monthlyExpenses;
  let cash = p.cash + cashflow;

  // Going into the red: clamp cash, roll shortfall into liabilities as new debt.
  if (cash < 0) {
    liabilities += -cash;
    cash = 0;
  }

  // 4. Stress momentum — keyed off *financial pressure*, not raw debt existence.
  //    Pressure: monthly deficit (scaled by severity) + thin runway (scaled by shortfall)
  //              + debt burden (only when really a burden).
  //    Relief: comfortable surplus + healthy runway + debt covered (or zero).
  //    Momentum accumulates until it crosses ±1, then nudges the discrete stress level.
  const s = cfg.stress;
  const monthlyBurn = Math.max(p.monthlyExpenses, 1);
  const runway = cash / monthlyBurn; // cash is post-clamp, so runway ≥ 0
  const debtCovered = liabilities <= 0 || cash >= liabilities;

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
    liabilities <= 0
      ? 0
      : p.monthlyIncome > 0
        ? liabilities / (p.monthlyIncome * s.debtIncomeMultiple)
        : Infinity;
  const debtBurdenActive =
    liabilities > 0 &&
    (cashflow < 0 || (debtVsIncomeRatio > 1 && !debtCovered));
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
    stress = Math.min(s.max, stress + 1);
    momentum -= 1;
  } else if (momentum <= -1) {
    stress = Math.max(s.min, stress - 1);
    momentum += 1;
  }

  // 5. Net worth history (rounded for clean rendering).
  const netWorth = Math.round(cash + p.assets - liabilities);
  const netWorthHistory = [...p.netWorthHistory, netWorth];

  return {
    ...p,
    month,
    age,
    cash,
    liabilities,
    stress,
    stressMomentum: momentum,
    netWorthHistory,
  };
}
