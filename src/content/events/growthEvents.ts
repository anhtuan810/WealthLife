// Growth-phase events (35–50) — Phase-2 content brief §2.
//
// Tone: mature, consequential, never preachy. The spine is COMPOUNDING
// DECISIONS — invest vs. consume, build vs. coast, hold vs. de-risk.
// Late-life events must move passiveIncome / expenses / assets so the back
// half of the run actually shapes the freedom ratio. Flavor-only beats are
// the exception, not the rule.
//
// Direction-conditioned events gate on the existing leaning_* flag — set
// during foundation by whats_next, and stamped on non-foundation starts by
// createPlayerFromStartPoint via LEANING_FLAG_FOR_DIRECTION — so a 38-start
// founder lives the founder-flavored growth beats just like an 18-start
// founder does.
//
// All effects below are routed through TUNE_GROWTH so Phase 3 can adjust
// magnitudes without touching structure. WHICH stat moves and WHICH way is
// fixed by the brief; the numbers are TODO_TUNE.

import type { GameEvent } from '../../types/events';

// ── TODO_TUNE — Phase 3 ────────────────────────────────────────────────
// All magnitudes for growth-phase events live here. The brief locks the
// direction of each delta; Phase 3 tunes the size. Do not change which
// StatKey is touched without checking the brief.
const TUNE_GROWTH = {
  indexHabit: {
    automate: { cash: -800, passiveIncome: 180, discipline: 5 },
    flex: { cash: 1_400 },
    wait: { stress: 2 },
  },
  lifestyleCreep: {
    upgrade: { expenses: 600, stress: -4 },
    hold: { discipline: 5 },
    rightSize: { expenses: -400, stress: 4 },
  },
  marketCorrection: {
    hold: { discipline: 6, stress: 2 },
    buyDip: { cash: -6_000, assets: 14_000, riskTolerance: 4 },
    sell: { assets: -10_000, passiveIncome: -120, stress: -4 },
  },
  realEstate: {
    buy: { cash: -20_000, debt: 120_000, assets: 160_000, passiveIncome: 600, stress: 6 },
    // Pass is silent vanish — no onLapse, no effects. Missed stream is the cost.
  },
  careerPlateau: {
    grind: { salary: 1_800, stress: 10, health: -5 },
    coast: { stress: -4 },
    pivotUp: { salary: 1_400, network: 5, riskTolerance: 5 },
    pivotDown: { salary: -700, network: 6, riskTolerance: 5 },
  },
  healthReckoning: {
    invest: { cash: -3_500, expenses: 60, health: 18, stress: -8 },
    push: { health: -10, stress: 8 },
    lapse: { health: -16, stress: 10 },
  },
  corpHandcuffs: {
    stayVest: { assets: 60_000, passiveIncome: 180, stress: 6 },
    leave: { assets: -10_000, salary: -800, stress: -6 },
  },
  founderExit: {
    take: { assets: 90_000, passiveIncome: 280, stress: -12 },
    holdSuccess: { assets: 180_000, passiveIncome: 500, stress: 14, riskTolerance: 6 },
    // Hold-fail is a real risk — the offer is gone, the build hits a wall.
    holdFail: { assets: -25_000, passiveIncome: -100, stress: 18, riskTolerance: 6 },
  },
  freelancerProductize: {
    build: { cash: -5_000, passiveIncome: 320, skill: 6 },
    bill: { discipline: 2 },
    halfBuild: { cash: -2_000, passiveIncome: 90 },
  },
} as const;

export const GROWTH_EVENTS: readonly GameEvent[] = [
  // ── SHARED · INVESTING — the quiet automate vs. hesitate beat ────────
  {
    id: 'growth_index_habit',
    title: 'Automate the Surplus',
    category: 'investing',
    phase: 'growth',
    art: 'growth_index_habit',
    conditions: { phase: 'growth' },
    fallbackText:
      'Your income finally outpaces your life. The boring move is to automate the surplus into the market and never look at it.',
    choices: [
      {
        id: 'automate_it',
        label: 'Automate it — pull it before you spend it',
        effects: TUNE_GROWTH.indexHabit.automate,
        setsFlags: ['automated_investing'],
        resultText:
          'You set the standing order. The market quietly does what compounding does.',
      },
      {
        id: 'keep_flexible',
        label: 'Keep it flexible — optionality has value',
        effects: TUNE_GROWTH.indexHabit.flex,
        resultText:
          'You leave the surplus in cash. Spendable, comfortable, idle.',
      },
      {
        id: 'wait_for_entry',
        label: 'Wait for a better entry',
        effects: TUNE_GROWTH.indexHabit.wait,
        setsFlags: ['waiting_to_invest'],
        resultText:
          'You wait. The market doesn\'t check its calendar against yours.',
      },
    ],
    tags: ['timing', 'compounding'],
  },

  // ── SHARED · PRESSURE — the bigger life and what it costs ────────────
  {
    id: 'growth_lifestyle_creep',
    title: 'A Bigger Life',
    category: 'pressure',
    phase: 'growth',
    art: 'growth_lifestyle_creep',
    conditions: { phase: 'growth' },
    fallbackText:
      'The nicer place, the upgraded everything — earned, tempting, and permanent. Comfort now, or coverage later.',
    choices: [
      {
        id: 'upgrade',
        label: 'Upgrade — you earned it',
        effects: TUNE_GROWTH.lifestyleCreep.upgrade,
        // Phase-3 commit: drop the dual-flag set. The two cost_of_comfort
        // ending records (one keyed on crept_lifestyle, one on the legacy
        // inflated_lifestyle) are intended as an OR-fan over distinct
        // player paths — co-setting both flags here made the legacy record
        // unable to ever win its priority tie. Now `upgrade` writes only
        // the new flag; the legacy inflated_lifestyle remains the property
        // of pre-Phase-2 career events that set it on their own paths.
        setsFlags: ['crept_lifestyle'],
        resultText:
          'You upgrade. The new floor feels permanent before the month is out.',
      },
      {
        id: 'hold_line',
        label: 'Hold the line — keep the floor where it is',
        effects: TUNE_GROWTH.lifestyleCreep.hold,
        setsFlags: ['held_lifestyle'],
        resultText:
          'You leave the floor alone. The surplus keeps doing surplus things.',
      },
      {
        id: 'right_size',
        label: 'Right-size down — trim the recurring spend',
        effects: TUNE_GROWTH.lifestyleCreep.rightSize,
        setsFlags: ['trimmed_lifestyle'],
        resultText:
          'You cut a few recurring lines. The freedom ratio nudges your way.',
      },
    ],
    tags: ['lifestyle', 'expenses'],
  },

  // ── SHARED · PRESSURE — a real drawdown mid-build ────────────────────
  {
    id: 'growth_market_correction',
    title: 'The Market Gives It Back',
    category: 'pressure',
    phase: 'growth',
    deferWindow: 0,
    art: 'growth_market_correction',
    conditions: { phase: 'growth' },
    fallbackText:
      'The market gives back two good years in two bad months. Your statements look ugly.',
    choices: [
      {
        id: 'hold_through',
        label: 'Hold — do nothing on purpose',
        effects: TUNE_GROWTH.marketCorrection.hold,
        setsFlags: ['held_through_correction'],
        resultText:
          'You hold. The statement still hurts; the position is intact.',
      },
      {
        id: 'buy_dip',
        label: 'Buy the dip — load up while it\'s cheap',
        effects: TUNE_GROWTH.marketCorrection.buyDip,
        setsFlags: ['bought_the_dip'],
        resultText:
          'You buy. The recovery will look obvious in hindsight; it doesn\'t now.',
      },
      {
        id: 'sell_stop_bleed',
        label: 'Sell — stop the bleeding',
        effects: TUNE_GROWTH.marketCorrection.sell,
        setsFlags: ['sold_at_bottom'],
        resultText:
          'You sell. The pain stops; the loss is now real.',
      },
    ],
    tags: ['market', 'discipline'],
  },

  // ── SHARED · OPPORTUNITY — leverage that cuts both ways ──────────────
  // Pass is silent vanish — the missed stream IS the consequence. No onLapse.
  {
    id: 'growth_real_estate',
    title: 'A Place That Could Pay You',
    category: 'opportunity',
    phase: 'growth',
    deferWindow: 1,
    art: 'growth_real_estate',
    conditions: { phase: 'growth' },
    fallbackText:
      'A place you could rent out. Leverage cuts both ways — it builds an income stream and a liability at once.',
    choices: [
      {
        id: 'buy_property',
        label: 'Buy it — take on the mortgage, get the stream',
        effects: TUNE_GROWTH.realEstate.buy,
        setsFlags: ['owns_rental'],
        resultText:
          'You sign. The liability is real; so is the cheque each month.',
      },
      {
        id: 'pass_property',
        label: 'Pass — leverage isn\'t for you here',
        effects: {},
        resultText:
          'You let it go. The missed stream doesn\'t show up on any statement.',
      },
    ],
    tags: ['real_estate', 'leverage'],
  },

  // ── SHARED · CAREER — the ceiling you can feel ───────────────────────
  {
    id: 'growth_career_plateau',
    title: 'The Ceiling You Can Feel',
    category: 'career',
    phase: 'growth',
    art: 'growth_career_plateau',
    conditions: { phase: 'growth' },
    fallbackText:
      'The easy growth is behind you. The next level costs more than the last one did.',
    choices: [
      {
        id: 'grind_for_it',
        label: 'Grind for it — push to the next rung',
        effects: TUNE_GROWTH.careerPlateau.grind,
        setsFlags: ['grinding_plateau'],
        resultText:
          'You grind. The calendar wins; so does the salary line.',
      },
      {
        id: 'coast_deliberately',
        label: 'Coast deliberately — buy the time back',
        effects: TUNE_GROWTH.careerPlateau.coast,
        setsFlags: ['coasted_plateau'],
        resultText:
          'You coast. The reviews stay neutral; your evenings come back.',
      },
      {
        id: 'pivot_up',
        label: 'Pivot — the gamble lands',
        effects: TUNE_GROWTH.careerPlateau.pivotUp,
        setsFlags: ['pivoted_plateau'],
        resultText:
          'You pivot. The new role compounds the next decade.',
      },
      {
        id: 'pivot_down',
        label: 'Pivot — the gamble misfires',
        effects: TUNE_GROWTH.careerPlateau.pivotDown,
        setsFlags: ['pivoted_plateau'],
        resultText:
          'You pivot. The first year is a step backward; the network is new.',
      },
    ],
    tags: ['career', 'variance'],
  },

  // ── SHARED · PRESSURE — body sends the invoice ───────────────────────
  // Gated on stress so it doesn't fire on calm runs. onLapse models the
  // "ignored" outcome — the body decides for you when you don't.
  {
    id: 'growth_health_reckoning',
    title: 'The Body Sends an Invoice',
    category: 'pressure',
    phase: 'growth',
    deferWindow: 0,
    onLapse: {
      effects: TUNE_GROWTH.healthReckoning.lapse,
      setsFlags: ['ignored_health'],
      resultText:
        'You ignore it. The body files its own decision and bills you later.',
    },
    art: 'growth_health_reckoning',
    conditions: { phase: 'growth', stats: { stress: '>=30' } },
    fallbackText:
      'Years of pushing show up at once. Address it now or pay later with interest.',
    choices: [
      {
        id: 'invest_health',
        label: 'Invest in health — sleep, training, slack',
        effects: TUNE_GROWTH.healthReckoning.invest,
        setsFlags: ['invested_health'],
        resultText:
          'You ease the throttle. The fog lifts; the calendar still fills.',
      },
      {
        id: 'push_through',
        label: 'Push through — there\'s a runway in front of you',
        effects: TUNE_GROWTH.healthReckoning.push,
        setsFlags: ['pushed_through_health'],
        resultText:
          'You push. The work clears; the body keeps the receipt.',
      },
    ],
    tags: ['health', 'stress'],
  },

  // ── DIRECTION · CORPORATE — vesting cliff ────────────────────────────
  {
    id: 'growth_corp_golden_handcuffs',
    title: 'Golden Handcuffs',
    category: 'career',
    phase: 'growth',
    art: 'growth_corp_golden_handcuffs',
    conditions: {
      phase: 'growth',
      requiresFlags: ['leaning_corporate'],
    },
    fallbackText:
      'A vesting cliff. Stay and the equity lands; leave and you walk from real money.',
    choices: [
      {
        id: 'stay_to_vest',
        label: 'Stay to vest — let the equity land',
        effects: TUNE_GROWTH.corpHandcuffs.stayVest,
        setsFlags: ['stayed_to_vest'],
        resultText:
          'You stay. The vest lands; so do the calendar and the constraints.',
      },
      {
        id: 'leave_for_room',
        label: 'Leave for room — walk from the equity',
        effects: TUNE_GROWTH.corpHandcuffs.leave,
        setsFlags: ['left_before_vest'],
        resultText:
          'You leave. The cheque is forfeit; the air is yours.',
      },
    ],
    tags: ['corporate', 'leaning_corporate', 'optionality'],
  },

  // ── DIRECTION · FOUNDER — exit window ────────────────────────────────
  // The hold-for-bigger choice expresses variance via two record-style
  // outcomes: a success path and a fail path, exposed to the player as two
  // distinct options so the structural choice (and its cost surface) is
  // legible. Phase 3 can collapse to a single variance outcome if desired.
  {
    id: 'growth_founder_exit_window',
    title: 'An Acquisition on the Table',
    category: 'opportunity',
    phase: 'growth',
    deferWindow: 1,
    art: 'growth_founder_exit_window',
    conditions: {
      phase: 'growth',
      requiresFlags: ['leaning_founder'],
    },
    fallbackText:
      'An acquisition offer on the table — life-changing but not the moonshot number.',
    choices: [
      {
        id: 'take_exit',
        label: 'Take the exit — life-changing, de-risked',
        effects: TUNE_GROWTH.founderExit.take,
        setsFlags: ['founder_exited'],
        resultText:
          'You sign. The number lands; the years that built it are someone else\'s now.',
      },
      {
        id: 'hold_for_bigger_win',
        label: 'Hold for bigger — and it pays off',
        effects: TUNE_GROWTH.founderExit.holdSuccess,
        setsFlags: ['founder_held'],
        resultText:
          'You hold. The bigger number arrives; the years were worth it.',
      },
      {
        id: 'hold_for_bigger_miss',
        label: 'Hold for bigger — and the offer evaporates',
        effects: TUNE_GROWTH.founderExit.holdFail,
        setsFlags: ['founder_held'],
        resultText:
          'You hold. The offer pulls; the bigger number never comes.',
      },
    ],
    tags: ['founder', 'leaning_founder', 'exit'],
  },

  // ── DIRECTION · FREELANCER — productize ──────────────────────────────
  {
    id: 'growth_freelancer_productize',
    title: 'Productize What You Know',
    category: 'investing',
    phase: 'growth',
    art: 'growth_freelancer_productize',
    conditions: {
      phase: 'growth',
      requiresFlags: ['leaning_independent'],
    },
    fallbackText:
      'You could keep billing hours, or turn what you know into something that sells while you sleep.',
    choices: [
      {
        id: 'build_product',
        label: 'Build the product — eat the cost now, compound later',
        effects: TUNE_GROWTH.freelancerProductize.build,
        setsFlags: ['shipped_product'],
        resultText:
          'You ship. The income stream is thin at first; it doesn\'t care if you\'re asleep.',
      },
      {
        id: 'keep_billing',
        label: 'Keep billing — the hours are reliable',
        effects: TUNE_GROWTH.freelancerProductize.bill,
        resultText:
          'You keep billing. The cheque is on time; the ceiling stays where it is.',
      },
      {
        id: 'half_build',
        label: 'Half-build it — squeeze it in around clients',
        effects: TUNE_GROWTH.freelancerProductize.halfBuild,
        setsFlags: ['half_built'],
        resultText:
          'You launch a half-version. It sells a little; you can feel what it should have been.',
      },
    ],
    tags: ['freelancer', 'leaning_independent', 'compounding'],
  },
];
