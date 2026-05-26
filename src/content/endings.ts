// MVP endings — MASTER §12 / §26. Endings are pure data; the engine returns
// the highest-priority Ending whose condition passes at run-end.
//
// The four logical endings (Burnout Warning, Early Debt Spiral, Strong Start,
// Treading Water) sometimes need OR semantics that the AND-only
// EventConditions schema can't express directly — for those, multiple records
// share a title/copy at the same priority and the evaluator returns the first
// match. Tune thresholds here; nothing else hardcodes ending math.

import type { Ending } from '../types/events';

const BURNOUT_COPY =
  'The financials looked alright on paper. The body and the calendar did not. You traded sleep, health, and clarity for momentum, and the bill came due before the run did.';

const SPIRAL_COPY =
  'Interest moved faster than income. By the time you noticed, the gap had become the shape of the problem. You\'ll get out — but it\'ll take longer than the time you spent getting in.';

const STRONG_COPY =
  'You didn\'t sprint, you positioned. The numbers don\'t shout yet, but the trajectory does — passive income is real, the runway is real, and the strengths you compounded will keep compounding.';

const TREADING_COPY =
  'You survived the chapter. Nothing dramatic broke; nothing meaningful compounded. The runway didn\'t shrink and it didn\'t grow. The next decade is the one that matters now.';

export const ALL_ENDINGS: readonly Ending[] = [
  // ── Burnout Warning (priority 100) ────────────────────────────────────
  // Two records express "stress >= 70 OR health <= 35" within the AND schema.
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
