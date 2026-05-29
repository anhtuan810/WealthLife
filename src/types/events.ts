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
  // Months a parked ("Decide later") decision survives before lapsing. Absent
  // means use CATEGORY_DEFER_DEFAULT for the event's category. A value of 0
  // means the decision is non-deferrable and the card must be answered now.
  deferWindow?: number;
  // Consequences for letting a parked decision lapse (expire). Absent =
  // silent vanish, no effects (the common case). Mirrors the effect-bearing
  // fields of Choice so the same applyChoice path can run it.
  onLapse?: {
    effects?: Partial<Record<StatKey, number>>;
    setsFlags?: string[];
    resultText?: string;
  };
};

// Category-level default for how long a parked decision survives. Pressure
// beats are immediate by default (0 = non-deferrable). Foundation defaults to
// 2 so the general run of university decisions can be parked; the few true
// must-decide-now beats (whats_next, major_choice, drop_out_decision,
// networking_event) override back to 0 in content. Overridden per-event via
// GameEvent.deferWindow.
export const CATEGORY_DEFER_DEFAULT: Record<EventCategory, number> = {
  pressure: 0,
  foundation: 2,
  opportunity: 3,
  career: 3,
  investing: 3,
};

// Single source of truth for "how long can this decision sit parked." Reads
// the per-event override if present, otherwise falls back to the category
// default. A return value of 0 means the event is not deferrable.
export function effectiveDeferWindow(event: GameEvent): number {
  return event.deferWindow ?? CATEGORY_DEFER_DEFAULT[event.category];
}

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
