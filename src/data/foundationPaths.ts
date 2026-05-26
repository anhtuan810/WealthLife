// Foundation paths — the four ways a player can START at 18.
// This is the SINGLE tunable source for starting state. Edit these numbers
// freely; nothing else in the codebase hardcodes starting stats.
//
// Per MASTER §7 / §9 / §27: a foundation path is a starting *context*, not a
// class. It biases — but does not lock — the strength profile. Strengths
// (skill / network / reputation / discipline / riskTolerance / ambition) are
// 0–100 and will be reshaped by foundation-chapter decisions in later prompts.

export type FoundationPathId =
  | 'university'
  | 'vocational'
  | 'self_taught'
  | 'straight_to_work';

export type FoundationBaseline = {
  // Finances
  cash: number;
  debt: number;
  salary: number;          // gross monthly inflow (post-tax-ish for MVP)
  expenses: number;        // monthly burn
  investments: number;     // broad ETF / index — 0 at 18
  assets: number;          // illiquid (equity, property) — 0 at 18
  passiveIncome: number;   // dividends / rentals / royalties — 0 at 18

  // Strengths (0–100, §9)
  skill: number;
  network: number;
  reputation: number;
  discipline: number;
  riskTolerance: number;
  ambition: number;

  // Pressure (0–100)
  stress: number;
  health: number;
};

export type FoundationPath = {
  id: FoundationPathId;
  title: string;
  subtitle: string;        // one-line premium framing — starting CONTEXT, not class
  tags: readonly string[]; // 2–3 short tradeoff tags
  baseline: FoundationBaseline;
};

export const FOUNDATION_PATHS: readonly FoundationPath[] = [
  {
    id: 'university',
    title: 'University',
    subtitle: 'You bet four years and real debt on a higher ceiling.',
    tags: ['Debt risk', 'Slow start', 'Network upside'],
    baseline: {
      cash: 1_500,
      debt: 8_000,        // first-year loan already on the books
      salary: 0,          // full-time student, no income yet
      expenses: 900,
      investments: 0,
      assets: 0,
      passiveIncome: 0,
      skill: 25,          // a foot in the door, structured learning
      network: 20,        // campus is a network factory
      reputation: 10,
      discipline: 18,
      riskTolerance: 12,
      ambition: 20,
      stress: 15,
      health: 80,
    },
  },
  {
    id: 'vocational',
    title: 'Vocational Training',
    subtitle: 'You pick up a trade fast and start earning while peers study.',
    tags: ['Early income', 'Low debt', 'Narrow ceiling'],
    baseline: {
      cash: 2_200,
      debt: 2_000,        // small program fees
      salary: 1_200,      // apprentice / part-time trade wages
      expenses: 800,
      investments: 0,
      assets: 0,
      passiveIncome: 0,
      skill: 22,
      network: 12,
      reputation: 8,
      discipline: 22,     // trades reward showing up
      riskTolerance: 10,
      ambition: 14,
      stress: 12,
      health: 82,
    },
  },
  {
    id: 'self_taught',
    title: 'Self-Taught',
    subtitle: 'You skip the system and try to outlearn it on your own terms.',
    tags: ['No debt', 'Unstable income', 'High variance'],
    baseline: {
      cash: 1_200,
      debt: 0,
      salary: 600,        // gig / freelance scraps
      expenses: 700,
      investments: 0,
      assets: 0,
      passiveIncome: 0,
      skill: 20,          // raw but real
      network: 8,         // you have to build it from zero
      reputation: 6,
      discipline: 16,     // self-direction is hard
      riskTolerance: 22,  // already took the unconventional bet
      ambition: 22,
      stress: 14,
      health: 80,
    },
  },
  {
    id: 'straight_to_work',
    title: 'Straight to Work',
    subtitle: 'You trade the long game for a paycheck and independence today.',
    tags: ['Immediate income', 'Low ceiling', 'Real independence'],
    baseline: {
      cash: 1_800,
      debt: 500,          // a stray card balance
      salary: 1_800,      // full-time entry-level wage
      expenses: 950,      // rent on your own quickly
      investments: 0,
      assets: 0,
      passiveIncome: 0,
      skill: 14,
      network: 14,        // workplace contacts beat zero
      reputation: 8,
      discipline: 20,     // showing up to a real job
      riskTolerance: 10,
      ambition: 12,
      stress: 12,
      health: 82,
    },
  },
] as const;

export const FOUNDATION_PATH_BY_ID: Record<FoundationPathId, FoundationPath> =
  FOUNDATION_PATHS.reduce(
    (acc, p) => {
      acc[p.id] = p;
      return acc;
    },
    {} as Record<FoundationPathId, FoundationPath>,
  );
