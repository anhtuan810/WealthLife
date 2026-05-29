import {
  FOUNDATION_PATH_BY_ID,
  type FoundationPathId,
} from '../data/foundationPaths';

// Per MASTER §27. v3: no locked archetype/careerDirection. Identity is the
// shape of strengths + flags, narrated at run-end.
export type Phase = 'foundation' | 'career' | 'growth' | 'freedom';

// First-class direction commitment, written by the choose_direction beat at
// the foundation→career transition. Null until the player commits. Anything
// rendering "what arc is this person on" should prefer player.direction once
// set; pre-choice they can still fall back to leaning_* flags as a soft
// signal of where the past has tilted.
export type LifeDirection = 'corporate' | 'founder' | 'freelancer' | null;

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

  // Committed direction (set by the choose_direction beat). Null until the
  // player commits; downstream readers should fall back to flag-derived
  // leaning while this is null.
  direction: LifeDirection;

  // Engine-internal: continuous accumulator that nudges discrete stress.
  stressMomentum: number;
  // One entry per recorded month, including run start.
  netWorthHistory: number[];

  // Decisions the player tapped "Decide later" on. They sit inert here until
  // expiry/reopen logic lands in a follow-up; the engine just suppresses these
  // ids from new event picks so a parked decision can't be re-presented fresh.
  pendingDecisions: { eventId: string; parkedMonth: number; expiryMonth: number }[];

  // Projected monthly cash flow captured at the most recent tick — used by
  // the dashboard to show a ↑/↓ trend cue against the current projection.
  // Undefined for a fresh player (before any month has been advanced) so the
  // arrow is suppressed on month 0.
  lastProjectedFlow?: number;
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
    direction: null,

    stressMomentum: 0,
    netWorthHistory: [startingNetWorth],

    pendingDecisions: [],
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
  { key: 'reputation', label: 'REPUTATION' },
  { key: 'discipline', label: 'DISCIPLINE' },
  { key: 'riskTolerance', label: 'RISK' },
  { key: 'ambition', label: 'AMBITION' },
];

// Soft-signal direction inferred from leaning_* flags accumulated through
// foundation. Used as a HINT (e.g. "your past has tilted toward founder") in
// the choose_direction beat before the player has a committed direction, and
// as a fallback for the figure outfit while player.direction is still null.
export function leaningFromFlags(
  flags: readonly string[],
): LifeDirection {
  if (flags.includes('leaning_corporate')) return 'corporate';
  if (flags.includes('leaning_founder')) return 'founder';
  if (flags.includes('leaning_independent')) return 'freelancer';
  return null;
}

export const netWorth = (p: Player): number =>
  p.cash + p.assets + p.investments - p.debt;

// Freedom% = passive-income coverage of monthly burn, clamped to [0, 100].
export const freedomPct = (p: Player): number => {
  if (p.expenses <= 0) return 0;
  const ratio = p.passiveIncome / p.expenses;
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
};
