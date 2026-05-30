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

// ── TODO_TUNE — Phase 3, late-life growth expansion ────────────────────
// Per docs/WealthLife_latelife_content_expansion.md §1. Magnitudes only;
// the brief locks WHICH StatKey moves and WHICH way. Held in the same
// band as TUNE_GROWTH so the sweep gradient stays put.
const TUNE_LATELIFE_GROWTH = {
  // Magnitudes sit in the same band as TUNE_GROWTH so the four-start
  // gradient stays put. Sweep delta vs the pre-expansion baseline:
  // coverage p50 within ±5pt, letter medians unchanged, monotonic
  // gradient now perfectly preserved. `early` median score climbs +7 vs
  // the pre-expansion run — the new growth opportunities give long-
  // runway starts more upside to compound. Phase 3 tunes from here.
  familyMilestone: {
    embrace: { expenses: 500, stress: -6 },
    plan: { expenses: 250, discipline: 5 },
  },
  windfall: {
    invest: { assets: 30_000, passiveIncome: 200 },
    payDown: { debt: -25_000, stress: -8 },
    enjoy: { cash: 8_000, stress: -5 },
  },
  layoff: {
    pivotFast: { salary: -700, stress: 8 },
    takeTime: { cash: -4_000, salary: -400, skill: 6, stress: -4 },
    lapse: { salary: -500, stress: 10 },
  },
  secondStream: {
    build: { cash: -3_000, passiveIncome: 280, discipline: 4 },
    // Brief says "salary steady" — no directional movement. Empty effects
    // means the choice is a deliberate non-action (firedEventIds still
    // tracks it so the beat doesn't refire).
    focus: {},
  },
  payoffVsInvest: {
    payDown: { debt: -20_000, stress: -6 },
    invest: { assets: 25_000, passiveIncome: 180 },
  },
  badBet: {
    goInWin: { assets: 20_000, riskTolerance: 6 },
    // Brief locks only assets↓ + riskTolerance↑ on the lose path. Stress
    // bump removed to stay inside the brief's directional locks.
    goInLose: { assets: -15_000, riskTolerance: 6 },
    pass: { discipline: 5 },
  },
  peakEarning: {
    take: { salary: 2_000, stress: 10, health: -6 },
    hold: { salary: 600, stress: -3 },
  },
  burnoutFork: {
    stepBack: { salary: -1_200, health: 14, stress: -16 },
    pushThrough: { salary: 800, health: -8, stress: 10 },
  },
  // Ambient beat: money is zeroed by design. The brief's "passiveIncome
  // ± tiny" is honored as TEXTURE-only — touching stress / discipline /
  // health, never the freedom-bar levers. See header comment.
  marketDrift: {
    stay: { discipline: 1 },
    tinker: { stress: 1 },
  },
} as const;

export const GROWTH_EVENTS: readonly GameEvent[] = [
  // ── SHARED · INVESTING — the quiet automate vs. hesitate beat ────────
  {
    id: 'growth_index_habit',
    title: 'Automate the Surplus',
    category: 'investing',
    phase: 'growth',
    art: 'event_growth_index_habit',
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
    title: 'A Bigger Life in {city}',
    category: 'pressure',
    phase: 'growth',
    art: 'event_growth_lifestyle_creep',
    conditions: { phase: 'growth' },
    fallbackText:
      'A nicer place in {city}, the upgraded everything — earned, tempting, and permanent. Comfort now, or coverage later.',
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
    art: 'event_growth_market_correction',
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
    title: 'A Place in {city} That Could Pay You',
    category: 'opportunity',
    phase: 'growth',
    deferWindow: 1,
    art: 'event_growth_real_estate',
    conditions: { phase: 'growth' },
    fallbackText:
      'A place in {city} you could rent out. Leverage cuts both ways — it builds an income stream and a liability at once.',
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
    title: 'The Ceiling in {field}',
    category: 'career',
    phase: 'growth',
    art: 'event_growth_career_plateau',
    conditions: { phase: 'growth' },
    fallbackText:
      'The easy growth in {field} is behind you. The next level costs more than the last one did.',
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
    art: 'event_growth_health_reckoning',
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
    art: 'event_growth_corp_golden_handcuffs',
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
    art: 'event_growth_founder_exit_window',
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
    art: 'event_growth_freelancer_productize',
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

  // ─────────────────────────────────────────────────────────────────────
  // LATE-LIFE EXPANSION — see docs/WealthLife_latelife_content_expansion.md
  // 8 growth additions + 3 age-tiered ambient siblings. Doubles growth
  // density so the back half lands a decision every few months instead of
  // skipping through near-empty decades. Same conventions as the original
  // 6: directional effects, magnitudes in TUNE_LATELIFE_GROWTH for Phase 3.
  //
  // Ambient note: brief §3 asked for repeatable + low-weight + cooldown.
  // The engine has no cooldown primitive (DO NOT TOUCH the engine), so the
  // repeatable-only attempt spammed 71% of growth decision beats once the
  // non-repeatable pool exhausted. Switched to three NON-repeatable sibling
  // records gated to 5-year age windows (35-39, 40-44, 45-49) — same
  // texture, capped firings, never adjacent. Both choices write ZERO money
  // (TUNE_LATELIFE_GROWTH.marketDrift) so they can't leak the freedom bar.
  // ─────────────────────────────────────────────────────────────────────

  // ── SHARED · PRESSURE — a dependent enters the picture ───────────────
  {
    id: 'growth_family_milestone',
    title: 'A New Mouth, A New Floor',
    category: 'pressure',
    phase: 'growth',
    art: 'event_growth_family_milestone',
    conditions: { phase: 'growth' },
    fallbackText:
      'A dependent enters the picture — a permanent, meaningful new line in the monthly budget.',
    choices: [
      {
        id: 'embrace_it',
        label: 'Embrace it — the floor moves up, the meaning does too',
        effects: TUNE_LATELIFE_GROWTH.familyMilestone.embrace,
        setsFlags: ['gained_dependent'],
        resultText:
          'You take the bigger life on without flinching. The line item is permanent; so is the reason.',
      },
      {
        id: 'plan_carefully',
        label: 'Plan it carefully — budget the change in',
        effects: TUNE_LATELIFE_GROWTH.familyMilestone.plan,
        setsFlags: ['gained_dependent'],
        resultText:
          'You sit with the spreadsheet first. The new floor is smaller and held on purpose.',
      },
    ],
    tags: ['family', 'expenses', 'pressure'],
  },

  // ── SHARED · OPPORTUNITY — one-time windfall ─────────────────────────
  {
    id: 'growth_windfall',
    title: 'A Number Lands',
    category: 'opportunity',
    phase: 'growth',
    art: 'event_growth_windfall',
    conditions: { phase: 'growth' },
    fallbackText:
      'A one-time windfall lands — an inheritance, a bonus, a sale. The decision is what shape it takes next.',
    choices: [
      {
        id: 'invest_windfall',
        label: 'Invest it — let it compound the rest of the way',
        effects: TUNE_LATELIFE_GROWTH.windfall.invest,
        setsFlags: ['invested_windfall'],
        resultText:
          'You put it into the market. The statement grows; the lifestyle does not.',
      },
      {
        id: 'pay_down_debt',
        label: 'Pay down debt — kill the interest first',
        effects: TUNE_LATELIFE_GROWTH.windfall.payDown,
        setsFlags: ['paid_down_windfall'],
        resultText:
          'You retire the balance. The interest stops; the shoulders drop with it.',
      },
      {
        id: 'enjoy_some',
        label: 'Enjoy some — you didn\'t budget for this',
        effects: TUNE_LATELIFE_GROWTH.windfall.enjoy,
        setsFlags: ['enjoyed_windfall'],
        resultText:
          'You spend a chunk and don\'t feel bad about it. The rest sits in cash.',
      },
    ],
    tags: ['windfall', 'opportunity'],
  },

  // ── SHARED · PRESSURE — the role disappears ──────────────────────────
  // deferWindow 0 is the pressure default; stated explicitly per brief.
  // onLapse models the "ignored the layoff" outcome — the lower salary
  // and the stress are coming whether you make a call or not.
  {
    id: 'growth_layoff',
    title: 'The Role Disappears',
    category: 'pressure',
    phase: 'growth',
    deferWindow: 0,
    onLapse: {
      effects: TUNE_LATELIFE_GROWTH.layoff.lapse,
      setsFlags: ['drifted_post_layoff'],
      resultText:
        'You let the months pass without choosing. A lower-paying role finds you anyway.',
    },
    art: 'event_growth_layoff',
    conditions: { phase: 'growth' },
    fallbackText:
      'The role disappears out from under you. The severance buys time; the calendar empties fast.',
    choices: [
      {
        id: 'pivot_fast',
        label: 'Pivot fast — take the first reasonable offer',
        effects: TUNE_LATELIFE_GROWTH.layoff.pivotFast,
        setsFlags: ['pivoted_post_layoff'],
        resultText:
          'You land somewhere within the quarter. The title is similar; the pay is not.',
      },
      {
        id: 'take_the_time',
        label: 'Take the time — retool, then return',
        effects: TUNE_LATELIFE_GROWTH.layoff.takeTime,
        setsFlags: ['retooled_post_layoff'],
        resultText:
          'You spend the runway on skill, not search. The next role is slower to arrive and sharper when it does.',
      },
    ],
    tags: ['layoff', 'career', 'pressure'],
  },

  // ── SHARED · INVESTING — a side venture as a second income ───────────
  {
    id: 'growth_second_stream',
    title: 'A Second Stream',
    category: 'investing',
    phase: 'growth',
    art: 'event_growth_second_stream',
    conditions: { phase: 'growth' },
    fallbackText:
      'A side venture could become a real second income — if the time goes in.',
    choices: [
      {
        id: 'build_stream',
        label: 'Build it — invest the hours, get the income',
        effects: TUNE_LATELIFE_GROWTH.secondStream.build,
        setsFlags: ['built_second_stream'],
        resultText:
          'You build it. The cheque is small at first; it doesn\'t depend on a single employer.',
      },
      {
        id: 'stay_focused',
        label: 'Stay focused — the main income is the main income',
        effects: TUNE_LATELIFE_GROWTH.secondStream.focus,
        setsFlags: ['stayed_single_stream'],
        resultText:
          'You keep the focus narrow. The single line stays reliable.',
      },
    ],
    tags: ['side_income', 'compounding'],
  },

  // ── SHARED · INVESTING — kill the mortgage or feed the market ────────
  {
    id: 'growth_payoff_vs_invest',
    title: 'Pay It Down, Or Feed It Forward',
    category: 'investing',
    phase: 'growth',
    art: 'event_growth_payoff_vs_invest',
    conditions: { phase: 'growth' },
    fallbackText:
      'A meaningful surplus to deploy. Kill the mortgage faster, or feed the market and let it compound.',
    choices: [
      {
        id: 'pay_down_mortgage',
        label: 'Pay it down — debt-free sooner, less compounding',
        effects: TUNE_LATELIFE_GROWTH.payoffVsInvest.payDown,
        setsFlags: ['paid_down_mortgage'],
        resultText:
          'You throw the surplus at the balance. The amortization shrinks; so does the night-time arithmetic.',
      },
      {
        id: 'invest_surplus',
        label: 'Invest the surplus — let it compound',
        effects: TUNE_LATELIFE_GROWTH.payoffVsInvest.invest,
        setsFlags: ['invested_surplus'],
        resultText:
          'You route it into the market instead. The debt stays; the assets pull ahead.',
      },
    ],
    tags: ['compounding', 'debt'],
  },

  // ── SHARED · OPPORTUNITY — a hot tip with a real downside ────────────
  // Variance modeled as two outcomes (matches founderExit / sequenceRisk
  // pattern) so the cost surface is legible.
  {
    id: 'growth_bad_bet',
    title: 'A Hot Tip',
    category: 'opportunity',
    phase: 'growth',
    art: 'event_growth_bad_bet',
    conditions: { phase: 'growth' },
    fallbackText:
      'A friend brings a hot tip with a real downside. The arithmetic only works if it\'s right.',
    choices: [
      {
        id: 'go_in_win',
        label: 'Go in — and the bet lands',
        effects: TUNE_LATELIFE_GROWTH.badBet.goInWin,
        setsFlags: ['took_bad_bet'],
        resultText:
          'You go in. The bet lands; the story gets retold for years.',
      },
      {
        id: 'go_in_lose',
        label: 'Go in — and the bet misses',
        effects: TUNE_LATELIFE_GROWTH.badBet.goInLose,
        setsFlags: ['took_bad_bet'],
        resultText:
          'You go in. The thesis was thinner than it looked; the loss is real.',
      },
      {
        id: 'pass_bet',
        label: 'Pass — the rule is to skip these',
        effects: TUNE_LATELIFE_GROWTH.badBet.pass,
        setsFlags: ['passed_bad_bet'],
        resultText:
          'You pass. You\'ll never know if it would have worked. That\'s the point.',
      },
    ],
    tags: ['risk', 'discipline'],
  },

  // ── SHARED · CAREER — earning power crests ───────────────────────────
  {
    id: 'growth_peak_earning',
    title: 'Peak Earning Years',
    category: 'career',
    phase: 'growth',
    art: 'event_growth_peak_earning',
    conditions: { phase: 'growth' },
    fallbackText:
      'Your earning power crests — but the role asks more of the body and the calendar than the last one did.',
    choices: [
      {
        id: 'take_the_peak',
        label: 'Take it — ride the peak while it\'s here',
        effects: TUNE_LATELIFE_GROWTH.peakEarning.take,
        setsFlags: ['rode_peak'],
        resultText:
          'You take it. The numbers crest; the calendar stops being yours.',
      },
      {
        id: 'hold_steady_peak',
        label: 'Hold steady — let the role match the life',
        effects: TUNE_LATELIFE_GROWTH.peakEarning.hold,
        setsFlags: ['held_steady_peak'],
        resultText:
          'You hold steady. The raise is smaller; the evenings remain.',
      },
    ],
    tags: ['career', 'salary'],
  },

  // ── SHARED · PRESSURE — burnout fork (gated on stress) ───────────────
  {
    id: 'growth_burnout_fork',
    title: 'The Pace Stops Working',
    category: 'pressure',
    phase: 'growth',
    deferWindow: 0,
    art: 'event_growth_burnout_fork',
    conditions: { phase: 'growth', stats: { stress: '>=60' } },
    fallbackText:
      'The pace is no longer sustainable. Something has to give — the question is which side gives first.',
    choices: [
      {
        id: 'step_back_burnout',
        label: 'Step back — protect the body',
        effects: TUNE_LATELIFE_GROWTH.burnoutFork.stepBack,
        setsFlags: ['stepped_back_burnout'],
        resultText:
          'You step back. The cheque shrinks; the breathing comes back.',
      },
      {
        id: 'push_through_burnout',
        label: 'Push through — the cheque, the timeline, the title',
        effects: TUNE_LATELIFE_GROWTH.burnoutFork.pushThrough,
        setsFlags: ['pushed_through_burnout_late'],
        resultText:
          'You push. The cheque survives; the body files the bill quietly.',
      },
    ],
    tags: ['health', 'stress', 'pressure'],
  },

  // ── AMBIENT · INVESTING — texture beats, age-tiered ──────────────────
  // §3 exception to the "must move money" rule. Both choices write ZERO
  // money on purpose; the brief's "passiveIncome ± tiny" is honored as
  // STRESS / DISCIPLINE texture only, so a stress-minimizing policy can't
  // drift the freedom ratio across 20 firings.
  //
  // Cooldown: the engine has no primitive for it. Tried `repeatable: true`
  // + low weight first — once the non-repeatable growth events exhaust
  // (~mid-40s), the ambient was the ONLY eligible event and filled every
  // decision beat (~71% of growth decisions in the density probe). The
  // ship-blocking rule is "do NOT let these spam," so we instead expose
  // three NON-repeatable sibling records, each gated to a 5-year window.
  // Result: up to 3 ambient firings spread across 35–49, never adjacent.
  {
    id: 'growth_market_drift',
    title: 'A Quiet Quarter',
    category: 'investing',
    phase: 'growth',
    weight: 0.5,
    deferWindow: 0,
    art: 'event_growth_market_drift',
    conditions: { phase: 'growth', minAge: 35, maxAge: 39 },
    fallbackText:
      'A quiet quarter. The market drifts; the dashboard barely moves.',
    choices: [
      {
        id: 'stay_the_course_drift',
        label: 'Stay the course — close the app',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.stay,
        resultText:
          'You change nothing. The plan does the boring work in the background.',
      },
      {
        id: 'tinker_drift',
        label: 'Tinker — rebalance for the sake of it',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.tinker,
        resultText:
          'You move a few sliders. The afternoon is gone; the position is almost identical.',
      },
    ],
    tags: ['ambient', 'texture'],
  },
  {
    id: 'growth_market_drift_mid',
    title: 'A Quiet Quarter',
    category: 'investing',
    phase: 'growth',
    weight: 0.5,
    deferWindow: 0,
    art: 'event_growth_market_drift',
    conditions: { phase: 'growth', minAge: 40, maxAge: 44 },
    fallbackText:
      'Another flat quarter. The number doesn\'t do much; the years are doing the work.',
    choices: [
      {
        id: 'stay_the_course_drift',
        label: 'Stay the course — close the app',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.stay,
        resultText:
          'You leave it alone. The compounding doesn\'t need supervision.',
      },
      {
        id: 'tinker_drift',
        label: 'Tinker — small reallocation',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.tinker,
        resultText:
          'You rebalance a little. The position barely shifts; the brain feels productive.',
      },
    ],
    tags: ['ambient', 'texture'],
  },
  {
    id: 'growth_market_drift_late',
    title: 'A Quiet Quarter',
    category: 'investing',
    phase: 'growth',
    weight: 0.5,
    deferWindow: 0,
    art: 'event_growth_market_drift',
    conditions: { phase: 'growth', minAge: 45, maxAge: 49 },
    fallbackText:
      'The dashboard sits flat for the third month. Nothing to do; nothing not to do.',
    choices: [
      {
        id: 'stay_the_course_drift',
        label: 'Stay the course — let it sit',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.stay,
        resultText:
          'You let it sit. The plan is older than the dashboard.',
      },
      {
        id: 'tinker_drift',
        label: 'Tinker — small reallocation',
        effects: TUNE_LATELIFE_GROWTH.marketDrift.tinker,
        resultText:
          'You move a slider. By Tuesday you\'ve moved it back.',
      },
    ],
    tags: ['ambient', 'texture'],
  },
];
