import {
  FOUNDATION_PATH_BY_ID,
  type FoundationPathId,
} from '../data/foundationPaths';
import {
  START_POINT_BY_ID,
  type StartPointDirection,
  type StartPointId,
} from '../data/startPoints';
import { RUN_TARGET_AGE_DEFAULT } from '../data/constants';
import { ALL_EVENTS } from '../content';

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

  // Player-chosen freedom-goal age, set at run start (range 40–60). The
  // run-end trigger compares against this rather than the global default,
  // so different runs can target different ages. Survives save/load via
  // the Player shape itself.
  targetAge: number;

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

  // Which start-point machine spawned this player. Additive on save/load —
  // legacy saves without this field can safely default-treat as 'university'.
  // Drives summary labels (start-age → endAge) and any future start-aware UI.
  startPointId?: StartPointId;
};

export function createPlayer(
  pathId: FoundationPathId,
  targetAge: number = RUN_TARGET_AGE_DEFAULT,
): Player {
  const b = FOUNDATION_PATH_BY_ID[pathId].baseline;
  const startingNetWorth = Math.round(
    b.cash + b.assets + b.investments - b.debt,
  );
  return {
    age: 18,
    month: 0,
    phase: 'foundation',
    foundationPath: pathId,
    targetAge,

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

    startPointId: 'university',
  };
}

// LifeDirection → legacy leaning_* flag. Foundation's whats_next event
// already writes these flags during a normal foundation run; this table
// mirrors that mapping so non-foundation starts (which skip whats_next) can
// stamp the same flag at spawn time. Direction-gated content downstream
// gates on the flag, not on player.direction, so this keeps the existing
// requiresFlags scheme intact.
export const LEANING_FLAG_FOR_DIRECTION: Record<StartPointDirection, string> = {
  corporate: 'leaning_corporate',
  founder: 'leaning_founder',
  freelancer: 'leaning_independent',
};

// Spawn a player from a start point. `university` falls straight through to
// createPlayer so the byte-for-byte default new-run shape is preserved — the
// existing foundation-path picker stays the path of truth for those runs.
// The later starts (early/established/midlife) apply the start-point seed
// directly, commit the supplied direction, and PRE-MARK the choose_direction
// event as fired so the in-game direction beat never refires for a player who
// already committed at run setup. They also push the started_* flag so future
// content can branch on which entry machine was used.
export function createPlayerFromStartPoint(
  startPointId: StartPointId,
  direction?: StartPointDirection,
): Player {
  const sp = START_POINT_BY_ID[startPointId];

  if (sp.id === 'university') {
    // The university picker re-uses today's exact default new-run path; we
    // just stamp the start-point id on top so summary labels can read it
    // consistently with the later starts.
    return { ...createPlayer('university'), startPointId: 'university' };
  }

  if (!sp.seed) {
    throw new Error(`start point ${startPointId} missing seed`);
  }
  if (sp.requiresDirection && !direction) {
    throw new Error(`start point ${startPointId} requires a direction`);
  }

  const seed = sp.seed;
  const startingNetWorth = Math.round(
    seed.cash + seed.assets - seed.liabilities,
  );

  return {
    age: sp.startAge,
    month: 0,
    phase: sp.startPhase,
    // foundationPath is incidental for non-foundation starts (foundation
    // events are phase-gated and never fire from a career/growth phase). We
    // park it on 'university' as a stable placeholder so the schema stays
    // satisfied; nothing reads it for these starts.
    foundationPath: 'university',
    targetAge: RUN_TARGET_AGE_DEFAULT,

    cash: seed.cash,
    salary: seed.salary,
    expenses: seed.expenses,
    debt: seed.liabilities,
    investments: 0,
    assets: seed.assets,
    passiveIncome: seed.passiveIncome,

    skill: seed.strengths.skill,
    network: seed.strengths.network,
    reputation: seed.strengths.reputation,
    discipline: seed.strengths.discipline,
    riskTolerance: seed.strengths.riskTolerance,
    ambition: seed.strengths.ambition,

    stress: 15,   // TODO_TUNE — baseline pressure for any seeded start
    health: 80,   // TODO_TUNE

    // Direction-conditioned career/growth/freedom content gates on the
    // existing `leaning_*` flag (set during foundation by whats_next).
    // Non-foundation starts skip that beat, so we stamp the matching
    // leaning_* flag here too — keeps the existing requiresFlags scheme
    // working for direction-gated late-life events without engine changes.
    flags: [
      ...sp.setsFlags,
      ...(direction ? [LEANING_FLAG_FOR_DIRECTION[direction]] : []),
    ],
    // Pre-resolve the direction beat AND every foundation-phase event so
    // none of them can re-enter the eligible pool for a player who skipped
    // foundation. A few foundation events (e.g. the university income-relief
    // beats) intentionally bleed past age 22 via `maxAge: 24` but rely on
    // `phase: 'foundation'` metadata to opt out for non-foundation starts —
    // since they don't all carry a conditions.phase gate, the firedEventIds
    // filter is the right "existing gating" hook to enforce that here.
    firedEventIds: [
      'choose_direction',
      ...ALL_EVENTS.filter((e) => e.phase === 'foundation').map((e) => e.id),
    ],
    direction: direction ?? null,

    stressMomentum: 0,
    netWorthHistory: [startingNetWorth],

    pendingDecisions: [],

    startPointId: sp.id,
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
