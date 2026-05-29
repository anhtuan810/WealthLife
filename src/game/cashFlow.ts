import type { Player } from './player';
import { TICK_CONFIG } from './playerConfig';

// Single source of truth for the dashboard's projected cash-flow figure and
// the breakdown shown in the detail sheet. The sheet reconciles to the
// summary by deriving both from this helper — never recomputing.
//
// Model (a): "what actually hits cash". Mirrors the engine exactly. tick.ts
// applies `cashflow = salary + passiveIncome − expenses` to p.cash; debt
// interest accrues onto the debt principal (it never leaves cash). So this
// projection MUST equal the engine's real monthly cash delta. Debt growth
// lives in the debt sheet, not here.

export type CashFlowBreakdown = {
  active: number; // wage / salary
  passive: number; // passive income
  inflowTotal: number;
  expenses: number; // monthly burn — the only outflow that hits cash
  outflowTotal: number;
  net: number; // matches projectedCashFlow(player) and tick.ts cashflow
};

// Kept for DebtDetail — the figure is debt growth, not a cash outflow. Do
// NOT use this in cashFlowBreakdown; it would re-introduce the model (b)
// mismatch with the engine.
export function debtInterestFor(p: Player): number {
  return p.debt > 0 ? p.debt * TICK_CONFIG.debtInterestPerMonth : 0;
}

export function cashFlowBreakdown(p: Player): CashFlowBreakdown {
  const active = p.salary;
  const passive = p.passiveIncome;
  const inflowTotal = active + passive;
  const expenses = p.expenses;
  const outflowTotal = expenses;
  const net = inflowTotal - outflowTotal;
  return {
    active,
    passive,
    inflowTotal,
    expenses,
    outflowTotal,
    net,
  };
}

export function projectedCashFlow(p: Player): number {
  return cashFlowBreakdown(p).net;
}
