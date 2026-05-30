// Cost-of-living scale — single tunable knob for the run economy.
//
// Phase-4 recalibration: the pre-rescale economy ran at student/youth
// dollar scale (foundation expenses $700–$950/mo, derived early/established
// seeds $580–$750/mo) while late-life events shipped passive grants of
// $180–$600. The result was a single investing event covering 80–100% of
// expenses — every run saturated freedom in two decisions.
//
// Calibration target (per the brief):
//   - real_estate.buy_property ($600 passive) lands at ~15% of expense
//     coverage → expense base must be ≥ $4,000.
//   - implied savings rate (salary − expenses) / salary in the 10–35%
//     band, not the pre-rescale 63–67%.
//   - expenses commensurate across all four starts (no 7× gap).
//
// Scale is applied to FOUNDATION baselines and FOUNDATION-CHAPTER event
// money magnitudes only — those are the values that shape the dollar
// scale of the player at age 22/26 when the start-point seeds are
// derived. Career, growth, and freedom events are designed for adult
// scale already and stay unmodified.
//
// Changing ECONOMY_SCALE rescales the foundation chapter proportionally —
// relative balance (loan amounts vs. cash buffer, expense-cut event vs.
// baseline burn) is preserved by construction. Phase 5 retunes.

export const ECONOMY_SCALE = 7;

// Round to nearest integer after scaling. Used in foundationPaths.ts
// baselines and foundationEvents.ts effect deltas so a single constant
// drives the chapter's dollar scale.
export const $$ = (n: number): number => Math.round(n * ECONOMY_SCALE);
