// Pacing controller — MASTER §10.
// The monthly loop calls this every month to classify the beat.
//   quiet     → cashflow ticks, no decision (most months outside foundation)
//   decision  → fire a weighted-random eligible event
//   priority  → a high-priority eligible event jumps the queue immediately
//
// Foundation phase is dense: cooldown 0, so any eligible event fires next month.

import type { Beat } from '../types/events';
import type { Phase } from '../game/player';

export const PHASE_COOLDOWN: Record<Phase, number> = {
  foundation: 0,
  career: 3,
  growth: 4,
  freedom: 5,
};

type DecideArgs = {
  phase: Phase;
  monthsSinceLastEvent: number;
  hasPriorityEligible: boolean;
};

export function decideBeat({
  phase,
  monthsSinceLastEvent,
  hasPriorityEligible,
}: DecideArgs): Beat {
  if (hasPriorityEligible) return 'priority';
  if (monthsSinceLastEvent >= PHASE_COOLDOWN[phase]) return 'decision';
  return 'quiet';
}
