import type { ArchetypeId } from './archetypes';
import { STARTING_STATS } from './playerConfig';

export type Player = {
  archetypeId: ArchetypeId;
  age: number;
  month: number;
  cash: number;
  assets: number;
  liabilities: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  passiveIncome: number;
  stress: number;
  // Continuous accumulator that nudges discrete stress when it crosses ±1.
  stressMomentum: number;
  // One entry per completed month, including month 1 (creation).
  netWorthHistory: number[];
};

export function createPlayer(archetypeId: ArchetypeId): Player {
  const s = STARTING_STATS[archetypeId];
  const startingNetWorth = Math.round(s.cash + s.assets - s.liabilities);
  return {
    archetypeId,
    month: 1,
    age: s.age,
    cash: s.cash,
    assets: s.assets,
    liabilities: s.liabilities,
    monthlyIncome: s.monthlyIncome,
    monthlyExpenses: s.monthlyExpenses,
    passiveIncome: s.passiveIncome,
    stress: s.stress,
    stressMomentum: 0,
    netWorthHistory: [startingNetWorth],
  };
}

export const netWorth = (p: Player): number => p.cash + p.assets - p.liabilities;

// Freedom% = passive income coverage of monthly burn, clamped to [0, 100].
export const freedomPct = (p: Player): number => {
  if (p.monthlyExpenses <= 0) return 0;
  const ratio = p.passiveIncome / p.monthlyExpenses;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};
