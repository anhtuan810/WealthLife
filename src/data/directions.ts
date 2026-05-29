// Direction → display title. Single source of truth for any UI that surfaces
// "what arc is this person on" as a human-readable label.

import type { LifeDirection, Phase } from '../game/player';

export const DIRECTION_TITLES: Record<Exclude<LifeDirection, null>, string> = {
  corporate: 'Corporate Climber',
  founder: 'Startup Founder',
  freelancer: 'Freelancer',
};

export type IdentityTitle = {
  label: string;
  muted: boolean;
};

// Resolve the small identity line that sits under the LifeFigure. Foundation
// and pre-commit career states read muted so a committed identity carries the
// strongest visual weight.
export function identityTitle(
  phase: Phase,
  direction: LifeDirection,
): IdentityTitle {
  if (phase === 'foundation') {
    return { label: 'University', muted: true };
  }
  if (direction) {
    return { label: DIRECTION_TITLES[direction], muted: false };
  }
  return { label: 'Finding your direction', muted: true };
}
