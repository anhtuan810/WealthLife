// Run-length and phase-transition constants — single tunable place.
// Edit freely; the engine reads these and nothing hardcodes them elsewhere.

// Run ends at this age. The full life-arc target — phases flip on the way
// (foundation→career at 22, career→growth at 35, growth→freedom at 50) and
// the grade fires at run-end.
export const RUN_TARGET_AGE_DEFAULT = 60;

// Back-compat alias. Some callers (the sim harness, the dev seed) still read
// END_AGE; keep it pointed at the same number so there's a single source of
// truth for the run's terminal age.
export const END_AGE = RUN_TARGET_AGE_DEFAULT;

// Phase boundary table — single source for "what phase does this age live
// in." Tunable here. foundation→career is owned by maybeTransitionToCareer
// (which is flag-gated and has a safety net at 23); the later flips fall
// through maybeAdvancePhase, which resolves purely by age.
export const PHASE_START_AGES = {
  foundation: 18,
  career: 22,
  growth: 35,
  freedom: 50,
} as const;

// Foundation ends at this age. After whats_next (priority-3, age 22) resolves,
// the store flips phase to "career"; a safety net at AGE 23 forces the flip
// even if no directional flag was set, so the player can't stall in foundation.
export const FOUNDATION_END_AGE = PHASE_START_AGES.career;
export const FOUNDATION_SAFETY_AGE = 23;

// Directional flags written by the late-foundation "what's next" event. The
// presence of any of these is the signal that foundation is complete.
export const DIRECTIONAL_FLAGS = [
  'leaning_corporate',
  'leaning_founder',
  'leaning_independent',
  'undecided',
] as const;

// Max parked decisions a player can carry at once. Enforced at the source
// (EventCard's "Decide later" affordance + the deferDecision store action),
// not just on display, so a 4th decision can never be silently parked.
export const PENDING_DECISIONS_CAP = 3;
