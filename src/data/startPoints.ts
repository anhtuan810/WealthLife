// Start points — the four entry machines into a run.
//
// A "start point" is WHERE on the life arc the player begins. It is
// orthogonal to the foundation-path concept (which describes the 18-year-old
// foundation chapter). University starts at 18 and uses the existing
// foundation-path flow; the three later starts seed straight into career or
// growth phase with a placeholder financial/strength profile and a committed
// direction.
//
// Seed values below are PLACEHOLDERS — marked TODO_TUNE. The shape is
// deliberate (later start = higher salary, expenses, savings, strengths) but
// the magnitudes are not yet balanced. Do not lock in.

import type { LifeDirection, Phase } from '../game/player';

export type StartPointId = 'university' | 'early' | 'established' | 'midlife';

export type StartPointSeed = {
  salary: number;
  expenses: number;
  cash: number;
  assets: number;
  liabilities: number; // → Player.debt
  passiveIncome: number;
  strengths: {
    skill: number;
    network: number;
    reputation: number;
    discipline: number;
    riskTolerance: number;
    ambition: number;
  };
};

export type StartPoint = {
  id: StartPointId;
  label: string;        // card title — e.g. "University · 18"
  blurb: string;        // one-line framing for the card
  runwayHint: string;   // "more runway / gentler" vs "less runway / harder"
  startAge: number;
  startPhase: Phase;
  requiresDirection: boolean;
  setsFlags: readonly string[];
  // Omitted for university — that start defers to createPlayer's existing
  // default new-run state so the byte-for-byte behavior is preserved.
  seed?: StartPointSeed;
};

export const START_POINTS: readonly StartPoint[] = [
  {
    id: 'university',
    label: 'University · 18',
    blurb: 'Begin at the very start. Pick a foundation; the past is yours to write.',
    runwayHint: '42 years of runway — the gentlest arc.',
    startAge: 18,
    startPhase: 'foundation',
    requiresDirection: false,
    setsFlags: [],
  },
  // Phase-4 re-derivation: medians of the university-18 run forward
  // through the RESCALED economy (ECONOMY_SCALE = 5), sampled the month
  // the player crosses age 22 / 26, with Model-1 passive compounding
  // active. Expenses, cash, liabilities, passive, and the six strengths
  // are derived-as-is. SALARY is the one hand-tuned field: the raw
  // derived salary stacks aggressively from foundation events and lands
  // the savings rate at 62–70%; the brief target is 10–35%, so salary
  // is set to the value that lands the savings rate inside the band
  // given derived expenses. Phase 5 will likely re-tune foundation
  // salary-grant magnitudes once playtests inform balance.
  {
    id: 'early',
    label: 'Early Career · 22',
    blurb: 'Just out of the gate. Direction already chosen.',
    runwayHint: '38 years of runway — still gentle.',
    startAge: 22,
    startPhase: 'career',
    requiresDirection: true,
    setsFlags: ['started_early'],
    seed: {
      salary: 5_400,         // hand-tuned: (5400 − 4060) / 5400 ≈ 25% savings
      expenses: 4_060,       // derived (real_estate +600 ≈ 14.8% coverage ✓)
      cash: 157_947,         // derived
      assets: 0,             // derived
      liabilities: 107_902,  // derived
      passiveIncome: 10,     // derived
      strengths: {
        skill: 40,           // derived
        network: 38,         // derived
        reputation: 26,      // derived
        discipline: 45,      // derived
        riskTolerance: 15,   // derived
        ambition: 37,        // derived
      },
    },
  },
  {
    id: 'established',
    label: 'Established · 26',
    blurb: 'A few years in. Habits and salary already shaping the curve.',
    runwayHint: '34 years of runway — moderate.',
    startAge: 26,
    startPhase: 'career',
    requiresDirection: true,
    setsFlags: ['started_established'],
    // Phase-4 close-out thin: the derived seed was the median of OPTIMIZING
    // university players (cash 420k, passive 244, expenses 4230) — richer
    // than a typical fresh 26-year-old. Under flat bar 0.65 that median
    // saturated the freedom term (67% coverage → 50/50 pts) and produced
    // 40 S / 14 A / 15 B / 3 C with median S (92) while the other starts
    // landed median A around 75–88. Thinned to a plausible 26yo: less
    // cash buffer, modestly higher expenses, lower starting passive.
    // Strengths unchanged.
    seed: {
      salary: 6_500,         // hand-tuned: (6500 − 5000) / 6500 ≈ 23% savings
      expenses: 5_000,       // hand-tuned: +18% over the derived 4230
      cash: 200_000,         // hand-tuned: ~48% of derived 420k — realistic 26yo buffer
      assets: 13_300,        // derived
      liabilities: 139_189,  // derived
      passiveIncome: 200,    // hand-tuned: down from derived 244
      strengths: {
        skill: 54,           // derived
        network: 57,         // derived
        reputation: 40,      // derived
        discipline: 72,      // derived
        riskTolerance: 36,   // derived
        ambition: 70,        // derived
      },
    },
  },
  {
    id: 'midlife',
    label: 'Mid-life · 38',
    blurb: 'Halfway in. The runway is shorter; the lever arm, longer.',
    runwayHint: '22 years of runway — the hardest, sharpest arc.',
    startAge: 38,
    startPhase: 'growth',
    requiresDirection: true,
    setsFlags: ['started_midlife'],
    // Phase-4 hand-author (NOT sim-derived — no upstream content covers
    // 26 → 38). Phase-4 close-out retune (flat-bar revert): under bar
    // 0.65 the prior 9% start coverage locked midlife out of S; lifted
    // to passive 1,200 / expenses 8,500 (14.1% start). Final midlife
    // distribution under the flat 0.65 bar: 26 S / 46 A / 0 B / 0 C —
    // modal A with S reachable, hard-but-fair. Mean coverage 50.0.
    // PHASE-5 SANITY CHECK ME — extrapolations, not measured.
    seed: {
      salary: 12_000,        // hand-authored: ~29% savings rate
      expenses: 8_500,       // hand-authored: midlife life-stage cost-of-living
      cash: 700_000,         // hand-authored: established 420k + 12y compounding
      assets: 350_000,       // hand-authored: 12y of real-estate / portfolio build
      liabilities: 200_000,  // hand-authored: mortgage tail at scale 7
      passiveIncome: 1_200,  // hand-authored: start coverage ≈ 14.1%
      strengths: {
        skill: 58,          // TODO_TUNE
        network: 50,        // TODO_TUNE
        reputation: 46,     // TODO_TUNE
        discipline: 48,     // TODO_TUNE
        riskTolerance: 30,  // TODO_TUNE
        ambition: 38,       // TODO_TUNE
      },
    },
  },
] as const;

export const START_POINT_BY_ID: Record<StartPointId, StartPoint> =
  START_POINTS.reduce(
    (acc, sp) => {
      acc[sp.id] = sp;
      return acc;
    },
    {} as Record<StartPointId, StartPoint>,
  );

// Compile-time check — kept here so a future LifeDirection rename surfaces
// at the type layer rather than at runtime in createPlayerFromStartPoint.
export type StartPointDirection = Exclude<LifeDirection, null>;
