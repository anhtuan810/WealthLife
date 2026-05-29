// Event engine — MASTER §26.
// Dumb interpreter over the GameEvent schema. Knows nothing about specific
// events. Adding content = appending objects to /content/*; this file does NOT
// change when content grows.

import type { Player } from '../game/player';
import type {
  Beat,
  Choice,
  Ending,
  EventConditions,
  GameEvent,
  StatKey,
} from '../types/events';
import { ALL_ENDINGS } from '../content/endings';

// --- threshold expressions -------------------------------------------------

const THRESHOLD_RE = /^\s*(>=|<=|>|<|==|!=)\s*(-?\d+(?:\.\d+)?)\s*$/;

function evalThreshold(value: number, expr: string): boolean {
  const m = expr.match(THRESHOLD_RE);
  if (!m) return false;
  const n = parseFloat(m[2]);
  switch (m[1]) {
    case '>=': return value >= n;
    case '<=': return value <= n;
    case '>':  return value > n;
    case '<':  return value < n;
    case '==': return value === n;
    case '!=': return value !== n;
    default:   return false;
  }
}

// --- condition evaluation --------------------------------------------------

export function evaluateConditions(
  player: Player,
  conds: EventConditions | undefined,
): boolean {
  if (!conds) return true;

  if (conds.minAge !== undefined && player.age < conds.minAge) return false;
  if (conds.maxAge !== undefined && player.age > conds.maxAge) return false;
  if (conds.phase !== undefined && player.phase !== conds.phase) return false;

  if (conds.foundationPath && !conds.foundationPath.includes(player.foundationPath)) {
    return false;
  }

  if (conds.requiresFlags) {
    for (const f of conds.requiresFlags) {
      if (!player.flags.includes(f)) return false;
    }
  }

  if (conds.forbidsFlags) {
    for (const f of conds.forbidsFlags) {
      if (player.flags.includes(f)) return false;
    }
  }

  if (conds.stats) {
    for (const key of Object.keys(conds.stats) as StatKey[]) {
      const expr = conds.stats[key];
      if (!expr) continue;
      const value = (player[key as keyof Player] as number) ?? 0;
      if (!evalThreshold(value, expr)) return false;
    }
  }

  return true;
}

export function getEligibleEvents(
  player: Player,
  all: readonly GameEvent[],
): GameEvent[] {
  const parkedIds = new Set(player.pendingDecisions.map((p) => p.eventId));
  return all.filter((e) => {
    if (!e.repeatable && player.firedEventIds.includes(e.id)) return false;
    if (parkedIds.has(e.id)) return false;
    return evaluateConditions(player, e.conditions);
  });
}

// --- selection -------------------------------------------------------------

function weightedRandom(events: GameEvent[]): GameEvent | null {
  if (events.length === 0) return null;
  const total = events.reduce((s, e) => s + (e.weight ?? 1), 0);
  if (total <= 0) return events[0];
  let r = Math.random() * total;
  for (const e of events) {
    r -= e.weight ?? 1;
    if (r <= 0) return e;
  }
  return events[events.length - 1];
}

export function pickEvent(
  eligible: GameEvent[],
  beat: Exclude<Beat, 'quiet'>,
): GameEvent | null {
  if (eligible.length === 0) return null;
  if (beat === 'priority') {
    const withPriority = eligible.filter((e) => (e.priority ?? 0) > 0);
    if (withPriority.length === 0) return null;
    return withPriority.reduce((best, e) =>
      (e.priority ?? 0) > (best.priority ?? 0) ? e : best,
    );
  }
  // decision beat — pick weighted-random among non-priority eligibles
  const normal = eligible.filter((e) => !(e.priority ?? 0));
  return weightedRandom(normal.length > 0 ? normal : eligible);
}

// --- choice application ----------------------------------------------------

// Strengths + pressure are clamped to 0..100 per §27.
const CLAMP_0_100: ReadonlySet<StatKey> = new Set<StatKey>([
  'skill',
  'network',
  'reputation',
  'discipline',
  'riskTolerance',
  'ambition',
  'stress',
  'health',
]);

// These can't go negative — money/balances are bounded below.
const CLAMP_NON_NEG: ReadonlySet<StatKey> = new Set<StatKey>([
  'debt',
  'salary',
  'expenses',
  'investments',
  'assets',
  'passiveIncome',
]);

function clampStat(key: StatKey, value: number): number {
  if (CLAMP_0_100.has(key)) return Math.max(0, Math.min(100, value));
  if (CLAMP_NON_NEG.has(key)) return Math.max(0, value);
  return value; // cash can swing negative; the next tick rolls shortfall into debt
}

// Pure. Applies choice effects, writes flags, marks the event as fired.
// Cash is reconciled here too: if a choice puts cash below zero, the shortfall
// rolls into debt immediately so the dashboard never shows negative cash.
export function applyChoice(
  player: Player,
  event: GameEvent,
  choice: Choice,
): Player {
  const next: Player = { ...player };

  for (const key of Object.keys(choice.effects) as StatKey[]) {
    const delta = choice.effects[key];
    if (typeof delta !== 'number') continue;
    const current = (next[key as keyof Player] as number) ?? 0;
    const updated = clampStat(key, current + delta);
    (next as unknown as Record<string, number>)[key] = updated;
  }

  // Cash → debt rollover, so the player never sees a negative balance.
  if (next.cash < 0) {
    next.debt = Math.max(0, next.debt + -next.cash);
    next.cash = 0;
  }

  if (choice.setsFlags && choice.setsFlags.length > 0) {
    const merged = new Set([...next.flags, ...choice.setsFlags]);
    next.flags = Array.from(merged);
  }

  // Direction commitment — written by the choose_direction beat. Once set,
  // the figure outfit (and any future direction-aware logic) reads from this
  // field rather than inferring from leaning_* flags.
  if (choice.setsDirection) {
    next.direction = choice.setsDirection;
  }

  if (!event.repeatable && !next.firedEventIds.includes(event.id)) {
    next.firedEventIds = [...next.firedEventIds, event.id];
  }

  return next;
}

// --- ending evaluation ----------------------------------------------------

// Highest-priority Ending whose condition passes. ALL_ENDINGS includes a
// catch-all (priority 0, empty condition) so this always returns one.
// Ties at the same priority resolve to list order (first match wins) — a
// deliberate, deterministic property used by the OR-pair endings.
export function evaluateEndings(player: Player): Ending {
  const sorted = [...ALL_ENDINGS].sort((a, b) => b.priority - a.priority);
  for (const e of sorted) {
    if (evaluateConditions(player, e.condition)) return e;
  }
  // ALL_ENDINGS must include a catch-all; this is only reachable if someone
  // removes the default.
  return sorted[sorted.length - 1];
}
