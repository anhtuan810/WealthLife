import {
  FOUNDATION_PATH_BY_ID,
  type FoundationPathId,
} from '../data/foundationPaths';

// Per MASTER §27. v3: no locked archetype/careerDirection. Identity is the
// shape of strengths + flags, narrated at run-end.
export type Phase = 'foundation' | 'career' | 'growth' | 'freedom';

export type Player = {
  age: number;
  month: number;
  phase: Phase;
  foundationPath: FoundationPathId;

  // Finances
  cash: number;
  salary: number;
  expenses: number;
  debt: number;
  investments: number;
  assets: number;
  passiveIncome: number;

  // Strengths (§9, 0–100)
  skill: number;
  network: number;
  reputation: number;
  discipline: number;
  riskTolerance: number;
  ambition: number;

  // Pressure (0–100)
  stress: number;
  health: number;

  // Emergent-identity wiring (§26)
  flags: string[];
  firedEventIds: string[];

  // Engine-internal: continuous accumulator that nudges discrete stress.
  stressMomentum: number;
  // One entry per recorded month, including run start.
  netWorthHistory: number[];
};

export function createPlayer(pathId: FoundationPathId): Player {
  const b = FOUNDATION_PATH_BY_ID[pathId].baseline;
  const startingNetWorth = Math.round(
    b.cash + b.assets + b.investments - b.debt,
  );
  return {
    age: 18,
    month: 0,
    phase: 'foundation',
    foundationPath: pathId,

    cash: b.cash,
    salary: b.salary,
    expenses: b.expenses,
    debt: b.debt,
    investments: b.investments,
    assets: b.assets,
    passiveIncome: b.passiveIncome,

    skill: b.skill,
    network: b.network,
    reputation: b.reputation,
    discipline: b.discipline,
    riskTolerance: b.riskTolerance,
    ambition: b.ambition,

    stress: b.stress,
    health: b.health,

    flags: [],
    firedEventIds: [],

    stressMomentum: 0,
    netWorthHistory: [startingNetWorth],
  };
}

// Display order for the six strength stats (§9, 0–100). Single source of truth
// for the summary grid and the strength-hexagon sigil.
export const STRENGTH_FIELDS: ReadonlyArray<{
  key: keyof Player;
  label: string;
}> = [
  { key: 'skill', label: 'SKILL' },
  { key: 'network', label: 'NETWORK' },
  { key: 'reputation', label: 'REP' },
  { key: 'discipline', label: 'DISCIPLINE' },
  { key: 'riskTolerance', label: 'RISK' },
  { key: 'ambition', label: 'AMBITION' },
];

export const netWorth = (p: Player): number =>
  p.cash + p.assets + p.investments - p.debt;

// Freedom% = passive-income coverage of monthly burn, clamped to [0, 100].
export const freedomPct = (p: Player): number => {
  if (p.expenses <= 0) return 0;
  const ratio = p.passiveIncome / p.expenses;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};
