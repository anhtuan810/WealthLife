// Single content registry — the engine reads only this.
// Add new event files here; nothing else needs to change.

import type { GameEvent } from '../types/events';
import { FOUNDATION_EVENTS } from './events/foundationEvents';
import { CAREER_EVENTS } from './events/careerEvents';
import { GROWTH_EVENTS } from './events/growthEvents';
import { FREEDOM_EVENTS } from './events/freedomEvents';

export const ALL_EVENTS: readonly GameEvent[] = [
  ...FOUNDATION_EVENTS,
  ...CAREER_EVENTS,
  ...GROWTH_EVENTS,
  ...FREEDOM_EVENTS,
];
