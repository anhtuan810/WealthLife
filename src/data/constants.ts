// Run-length and phase-transition constants — single tunable place.
// Edit freely; the engine reads these and nothing hardcodes them elsewhere.

// Run ends at this age. MVP target slice is 18 → 25 (§8 / §12).
export const END_AGE = 25;

// Foundation ends at this age. After whats_next (priority-3, age 22) resolves,
// the store flips phase to "career"; a safety net at AGE 23 forces the flip
// even if no directional flag was set, so the player can't stall in foundation.
export const FOUNDATION_END_AGE = 22;
export const FOUNDATION_SAFETY_AGE = 23;

// Directional flags written by the late-foundation "what's next" event. The
// presence of any of these is the signal that foundation is complete.
export const DIRECTIONAL_FLAGS = [
  'leaning_corporate',
  'leaning_founder',
  'leaning_independent',
  'undecided',
] as const;
