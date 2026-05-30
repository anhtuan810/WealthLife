// Endings — MASTER §12 / §26 + Phase-2 brief §4. Endings are pure data; the
// engine returns the highest-priority Ending whose condition passes at
// run-end. The same OR-via-multiple-records pattern from the MVP set is
// extended in the late-life additions below: each new ending may have
// several rows sharing id/title/copy, with conditions tuned so any one of
// them firing surfaces the same closing beat.
//
// Magnitudes inside the conditions are TODO_TUNE — Phase 3 tunes thresholds
// once balance lands. WHICH stats gate each ending (and which way the
// inequality runs) is fixed by the brief.

import type { Ending } from '../types/events';

const BURNOUT_COPY =
  'The financials looked alright on paper. The body and the calendar did not. You traded sleep, health, and clarity for momentum, and the bill came due before the run did.';

const SPIRAL_COPY =
  'Interest moved faster than income. By the time you noticed, the gap had become the shape of the problem. You\'ll get out — but it\'ll take longer than the time you spent getting in.';

const STRONG_COPY =
  'You didn\'t sprint, you positioned. The numbers don\'t shout yet, but the trajectory does — passive income is real, the runway is real, and the strengths you compounded will keep compounding.';

const TREADING_COPY =
  'You survived the chapter. Nothing dramatic broke; nothing meaningful compounded. The runway didn\'t shrink and it didn\'t grow. The next decade is the one that matters now.';

// ── Phase-2 late-life copy (§4) ─────────────────────────────────────────
const FREE_AND_CLEAR_COPY =
  'You reached the finish with the income to ignore it. The pressure that started this is gone.';

const COMFORTABLE_TETHERED_COPY =
  'You built a good life. You just never quite stopped needing the paycheck to keep it.';

const LATE_BLOOMER_COPY =
  'You started with less road and covered more of it than anyone had a right to expect.';

const COST_OF_COMFORT_COPY =
  'You earned plenty. It all had somewhere to go.';

const BURNED_THROUGH_COPY =
  "The numbers worked out. You're not sure you did.";

const TREADING_AT_SIXTY_COPY =
  "The rat race never quite let go. There's always next year.";

export const ALL_ENDINGS: readonly Ending[] = [
  // ── Burned Through (priority 100, late-life variant) ──────────────────
  // §4 brief override of the generic Burnout Warning at run-end. Listed
  // FIRST in the array so it wins ties at priority 100, leaving the
  // mid-life burnout records below as fallbacks for any non-late-life
  // hypothetical (run-end is always age >= targetAge today, so the new
  // records will dominate in practice — which is the intent).
  {
    id: 'end_burned_through_stress',
    priority: 100,
    title: 'Burned Through',
    copy: BURNED_THROUGH_COPY,
    condition: { stats: { stress: '>=70' } },
  },
  {
    id: 'end_burned_through_health',
    priority: 100,
    title: 'Burned Through',
    copy: BURNED_THROUGH_COPY,
    condition: { stats: { health: '<=35' } },
  },

  // ── Burnout Warning (priority 100, retained MVP copy) ─────────────────
  // Two records express "stress >= 70 OR health <= 35" within the AND
  // schema. Kept as a fallback below the late-life Burned Through records.
  {
    id: 'burnout_warning_stress',
    priority: 100,
    title: 'Burnout Warning',
    copy: BURNOUT_COPY,
    condition: { stats: { stress: '>=70' } },
  },
  {
    id: 'burnout_warning_health',
    priority: 100,
    title: 'Burnout Warning',
    copy: BURNOUT_COPY,
    condition: { stats: { health: '<=35' } },
  },

  // ── Free and Clear (priority 90, brief §4) ────────────────────────────
  // Coverage at/above the bar (passiveIncome proxy — Phase 3 may wire this
  // to the actual freedom-ratio target). "Sustain healthy" is expressed
  // via stress, not debt — under the current engine the freedom ratio
  // doesn't care about balance-sheet liabilities, and the mortgage tail
  // from growth_real_estate would otherwise pin the gate shut for the
  // very runs that built a real income stream.
  {
    id: 'end_free_and_clear',
    priority: 90,
    title: 'Free and Clear',
    copy: FREE_AND_CLEAR_COPY,
    condition: {
      stats: {
        passiveIncome: '>=1200',
        stress: '<=60',
        health: '>=60',
      },
    },
  },

  // ── Late Bloomer (priority 95, brief §4) ──────────────────────────────
  // Started later than most AND coverage climbed hard. The Phase-3
  // diagnostic showed 64/72 midlife runs already cleared the passive
  // threshold but the ending lost to end_free_and_clear (90) and
  // end_comfortable_tethered (75). Raising priority above both — to 95,
  // below end_burned_through (100) which still trumps a stress/health
  // collapse — gives the started_midlife gate a clean win for the runs it
  // was written for, without needing per-ending forbidsFlags pollution.
  {
    id: 'end_late_bloomer',
    priority: 95,
    title: 'Late Bloomer',
    copy: LATE_BLOOMER_COPY,
    condition: {
      requiresFlags: ['started_midlife'],
      stats: { passiveIncome: '>=700' },
    },
  },

  // ── Comfortable, Still Tethered (priority 75, brief §4) ──────────────
  // Strong assets floor, coverage below the freedom bar, salary still
  // doing real work. Tunable in Phase 3 — the gate is direction-clear:
  // "you built a good life. You just never quite stopped needing the
  // paycheck to keep it."
  {
    id: 'end_comfortable_tethered',
    priority: 75,
    title: 'Comfortable, Still Tethered',
    copy: COMFORTABLE_TETHERED_COPY,
    condition: {
      stats: {
        assets: '>=30000',
        salary: '>=2000',
        passiveIncome: '<=1199',
      },
    },
  },

  // ── The Cost of Comfort (priority 70, brief §4) ──────────────────────
  // Lifestyle-creep flags ate the freedom ratio. Two records express the
  // OR over the new growth_lifestyle_creep flag and the legacy
  // inflated_lifestyle flag that some career events already write.
  {
    id: 'end_cost_of_comfort_crept',
    priority: 70,
    title: 'The Cost of Comfort',
    copy: COST_OF_COMFORT_COPY,
    condition: {
      requiresFlags: ['crept_lifestyle'],
      stats: { passiveIncome: '<=900' },
    },
  },
  {
    id: 'end_cost_of_comfort_inflated',
    priority: 70,
    title: 'The Cost of Comfort',
    copy: COST_OF_COMFORT_COPY,
    condition: {
      requiresFlags: ['inflated_lifestyle'],
      stats: { passiveIncome: '<=900' },
    },
  },

  // ── Early Debt Spiral (priority 80) ───────────────────────────────────
  // Debt grew faster than the player could cover; cash is thin.
  {
    id: 'early_debt_spiral',
    priority: 80,
    title: 'Early Debt Spiral',
    copy: SPIRAL_COPY,
    condition: { stats: { debt: '>=12000', cash: '<=1500' } },
  },

  // ── Strong Start ──────────────────────────────────────────────────────
  // Strong Start means trajectory toward freedom, NOT a cash pile. Every
  // record below carries a "the player actually began building" gate
  // (passiveIncome > 0 OR investments >= 500 OR freedomRatio > 0). Stress is
  // capped so a burned-out high earner falls through to Burnout Warning at
  // priority 100 instead. Records split to express the OR within the
  // AND-only EventConditions schema.
  //
  // strong_start_freedom already encodes the building requirement implicitly
  // via passiveIncome >= 50 (which implies passiveIncome > 0 AND
  // freedomRatio > 0 whenever expenses > 0), so it stays one record.
  {
    id: 'strong_start_freedom',
    priority: 60,
    title: 'Strong Start',
    copy: STRONG_COPY,
    condition: { stats: { passiveIncome: '>=50', stress: '<=55' } },
  },
  // strong_start_steady requires the OR explicitly. Two records, same
  // priority — array order resolves ties deterministically.
  {
    id: 'strong_start_steady_invested',
    priority: 55,
    title: 'Strong Start',
    copy: STRONG_COPY,
    condition: {
      stats: {
        cash: '>=5000',
        debt: '<=3000',
        stress: '<=55',
        investments: '>=500',
      },
    },
  },
  {
    id: 'strong_start_steady_passive',
    priority: 55,
    title: 'Strong Start',
    copy: STRONG_COPY,
    condition: {
      stats: {
        cash: '>=5000',
        debt: '<=3000',
        stress: '<=55',
        passiveIncome: '>=1',
      },
    },
  },

  // ── Treading Water at Sixty (priority 5, brief §4) ───────────────────
  // Flat coverage at run-end — the late-life-flavored variant of the MVP
  // Treading Water. Priority 5 places it ABOVE the MVP fallback so the
  // late-life copy wins for sixty-year-olds whose freedom never built.
  {
    id: 'end_treading_at_sixty',
    priority: 5,
    title: 'Treading Water at Sixty',
    copy: TREADING_AT_SIXTY_COPY,
    condition: { stats: { passiveIncome: '<=600' } },
  },

  // ── Treading Water (priority 0) ───────────────────────────────────────
  // Catch-all. Empty condition always passes; lowest priority so it only
  // fires when nothing else matched.
  {
    id: 'treading_water',
    priority: 0,
    title: 'Treading Water',
    copy: TREADING_COPY,
    condition: {},
  },
];
