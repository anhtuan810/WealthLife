// Event content schema — see MASTER §26.
// The engine is a dumb interpreter over these types; intelligence lives in data.

import type { FoundationPathId } from '../data/foundationPaths';
import type { LifeDirection, Phase } from '../game/player';

// Numeric Player fields that an event Choice can read/write as deltas.
// Keep this union flat — it doubles as both effect keys and stat-threshold keys.
export type StatKey =
  | 'cash'
  | 'debt'
  | 'salary'
  | 'expenses'
  | 'investments'
  | 'assets'
  | 'passiveIncome'
  | 'skill'
  | 'network'
  | 'reputation'
  | 'discipline'
  | 'riskTolerance'
  | 'ambition'
  | 'stress'
  | 'health';

export type EventCategory =
  | 'foundation'
  | 'career'
  | 'investing'
  | 'pressure'
  | 'opportunity';

// Threshold expressions like ">=40" / "<=5000" / "<25". Parsed by the engine.
export type StatThresholds = Partial<Record<StatKey, string>>;

export type EventConditions = {
  minAge?: number;
  maxAge?: number;
  phase?: Phase;
  foundationPath?: FoundationPathId[];
  stats?: StatThresholds;
  requiresFlags?: string[];
  forbidsFlags?: string[];
};

export type Choice = {
  id: string;
  label: string;
  effects: Partial<Record<StatKey, number>>;
  setsFlags?: string[];
  // Commits the player to a direction (corporate / founder / freelancer).
  // Used by the choose_direction beat; treated as the source of truth for
  // anything reading "what arc is the player on" — see Player.direction.
  setsDirection?: Exclude<LifeDirection, null>;
  resultText?: string;
};

export type GameEvent = {
  id: string;
  title: string;
  category: EventCategory;
  phase: Phase;
  priority?: number;       // higher = fires before normal weighted events
  weight?: number;         // soft randomness among eligible events (default 1)
  repeatable?: boolean;    // default false; fires once per run unless true
  conditions?: EventConditions;
  choices: Choice[];
  fallbackText?: string;   // deterministic text used when AI narrative is off (always, for MVP)
  tags?: string[];
  art?: string;            // asset key, e.g. 'event_student_loan'. Optional; placeholder shows if absent.
};

// Pacing controller output (§10).
export type Beat = 'quiet' | 'decision' | 'priority';

// Endings as data — MASTER §12 / §26. Same condition system as events; the
// engine returns the highest-priority Ending whose condition passes at run-end.
// Multiple records may share an id/title/copy to express OR semantics across
// the AND-only EventConditions schema (the evaluator returns the first match
// among same-priority entries, so list-order resolves ties deterministically).
export type Ending = {
  id: string;
  priority: number;
  condition: EventConditions;
  title: string;
  copy: string;
};
