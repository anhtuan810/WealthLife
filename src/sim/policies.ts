// Choice policies for the per-path sim harness. The harness assigns one policy
// per seed so the spread across runs reflects a mix of plausible playstyles
// instead of a single optimal lever. Scoring is intentionally simple — we want
// a defensible spread for tuning grade.ts, not an ML player.

import type { Choice, GameEvent, StatKey } from '../types/events';
import type { Rng } from './rng';

export type Policy = {
  id: string;
  description: string;
  pickIndex: (event: GameEvent, rand: Rng) => number;
};

const num = (effects: Partial<Record<StatKey, number>>, key: StatKey): number =>
  effects[key] ?? 0;

// Liquid + income proxy. Salary and passive income are multiplied by 12 because
// a recurring inflow is worth a year of months to a forward-looking player.
function moneyScore(c: Choice): number {
  const e = c.effects;
  return (
    num(e, 'cash') +
    num(e, 'salary') * 12 +
    num(e, 'passiveIncome') * 12 +
    num(e, 'investments') +
    num(e, 'assets') -
    num(e, 'debt')
  );
}

const STRENGTH_KEYS: ReadonlyArray<StatKey> = [
  'skill',
  'network',
  'reputation',
  'discipline',
  'riskTolerance',
  'ambition',
];

function growthScore(c: Choice): number {
  return STRENGTH_KEYS.reduce((sum, k) => sum + num(c.effects, k), 0);
}

function stressDelta(c: Choice): number {
  return num(c.effects, 'stress') - num(c.effects, 'health');
}

function ambitionScore(c: Choice): number {
  return num(c.effects, 'ambition') + num(c.effects, 'riskTolerance');
}

// Argmax over choices. Ties broken deterministically by the RNG draw so two
// runs with the same seed + path produce identical results.
function pickArgmax(
  event: GameEvent,
  score: (c: Choice) => number,
  rand: Rng,
): number {
  if (event.choices.length === 0) return 0;
  const scores = event.choices.map(score);
  const max = Math.max(...scores);
  const tied: number[] = [];
  scores.forEach((s, i) => {
    if (s === max) tied.push(i);
  });
  if (tied.length === 1) return tied[0];
  return tied[Math.floor(rand() * tied.length)];
}

const weightedRandomPolicy: Policy = {
  id: 'weighted_random',
  description: 'Uniformly random over choices — baseline for noisy play.',
  pickIndex: (event, rand) => Math.floor(rand() * event.choices.length),
};

const maximizeMoneyPolicy: Policy = {
  id: 'maximize_money',
  description: 'Picks the choice with the highest immediate money/income lift.',
  pickIndex: (event, rand) => pickArgmax(event, moneyScore, rand),
};

const maximizeGrowthPolicy: Policy = {
  id: 'maximize_growth',
  description: 'Picks the choice with the highest sum of strength deltas.',
  pickIndex: (event, rand) => pickArgmax(event, growthScore, rand),
};

const minimizeStressPolicy: Policy = {
  id: 'minimize_stress',
  description:
    'Picks the choice that protects stress/health the most (negative stress delta wins).',
  pickIndex: (event, rand) => pickArgmax(event, (c) => -stressDelta(c), rand),
};

const maximizeAmbitionPolicy: Policy = {
  id: 'maximize_ambition',
  description:
    'Picks the choice with the biggest ambition + riskTolerance lift — high-variance player.',
  pickIndex: (event, rand) => pickArgmax(event, ambitionScore, rand),
};

const balancedPolicy: Policy = {
  id: 'balanced',
  description:
    'Blended scoring: 0.5 × normalized money + 0.3 × growth − 0.2 × stress delta. Normalization is per-event so axes with different magnitudes can mix.',
  pickIndex: (event, rand) => {
    if (event.choices.length === 0) return 0;
    const moneys = event.choices.map(moneyScore);
    const growths = event.choices.map(growthScore);
    const stresses = event.choices.map(stressDelta);
    const range = (xs: number[]): number => {
      const max = Math.max(...xs);
      const min = Math.min(...xs);
      return Math.max(1e-6, max - min);
    };
    const mMin = Math.min(...moneys);
    const gMin = Math.min(...growths);
    const sMin = Math.min(...stresses);
    const mRange = range(moneys);
    const gRange = range(growths);
    const sRange = range(stresses);
    const scores = event.choices.map((_c, i) => {
      const mNorm = (moneys[i] - mMin) / mRange;
      const gNorm = (growths[i] - gMin) / gRange;
      const sNorm = (stresses[i] - sMin) / sRange;
      return 0.5 * mNorm + 0.3 * gNorm - 0.2 * sNorm;
    });
    const max = Math.max(...scores);
    const tied: number[] = [];
    scores.forEach((s, i) => {
      if (s === max) tied.push(i);
    });
    return tied.length === 1
      ? tied[0]
      : tied[Math.floor(rand() * tied.length)];
  },
};

export const POLICIES: readonly Policy[] = [
  weightedRandomPolicy,
  maximizeMoneyPolicy,
  maximizeGrowthPolicy,
  minimizeStressPolicy,
  maximizeAmbitionPolicy,
  balancedPolicy,
];
