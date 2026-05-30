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
  // Phase-3 commit: derived from the Part-1 measurement sweep — median
  // university-player state at the moment age reaches the start-point's
  // age, across the full seeds × policies matrix. Salary verified as the
  // raw derived value: choose_direction sets no salary effect, so
  // pre-firing it for non-foundation starts does not suppress a
  // commit-time salary bump. The seed therefore matches what a
  // university player actually looks like the instant they cross 22.
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
      salary: 1_575,
      expenses: 580,
      cash: 25_375,
      assets: 0,
      liabilities: 15_415,
      passiveIncome: 83,
      strengths: {
        skill: 40,
        network: 38,
        reputation: 24,
        discipline: 46,
        riskTolerance: 21,
        ambition: 39,
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
    seed: {
      salary: 2_275,
      expenses: 750,
      cash: 108_740,
      assets: 14_000,
      liabilities: 23_829,
      passiveIncome: 403,
      strengths: {
        skill: 55,
        network: 57,
        reputation: 40,
        discipline: 71,
        riskTolerance: 39,
        ambition: 70,
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
    seed: {
      salary: 8_500,        // TODO_TUNE
      expenses: 5_500,      // TODO_TUNE
      cash: 35_000,         // TODO_TUNE
      assets: 65_000,       // TODO_TUNE
      liabilities: 12_000,  // TODO_TUNE — mortgage tail
      passiveIncome: 350,   // TODO_TUNE
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
