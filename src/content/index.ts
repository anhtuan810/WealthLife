// Single content registry — the engine reads only this.
// Add new event files here; nothing else needs to change.

import type { GameEvent } from '../types/events';
import { FOUNDATION_EVENTS } from './events/foundationEvents';
import { CAREER_EVENTS } from './events/careerEvents';

export const ALL_EVENTS: readonly GameEvent[] = [
  ...FOUNDATION_EVENTS,
  ...CAREER_EVENTS,
];
