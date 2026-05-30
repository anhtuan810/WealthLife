// Freedom-phase events (50–60) — Phase-2 content brief §3.
//
// The freedom ratio matures. Work becomes optional, or it doesn't. The
// decisions are now about DRAWDOWN, OPTIONALITY, and the cost of having
// waited. Per the brief's one rule, the spine of these beats moves
// passiveIncome / assets / expenses — the very levers the late game was
// previously frozen on.
//
// All effects below are routed through TUNE_FREEDOM so Phase 3 can adjust
// magnitudes without touching structure.

import type { GameEvent } from '../../types/events';

// ── TODO_TUNE — Phase 3 ────────────────────────────────────────────────
const TUNE_FREEDOM = {
  workOptional: {
    stepBack: { salary: -3_000, stress: -12, health: 8 },
    keepBuilding: { passiveIncome: 200, salary: 200 },
    cutHalf: { salary: -1_500, stress: -6 },
  },
  drawdown: {
    begin: { passiveIncome: 350, assets: -8_000, stress: -4 },
    reinvest: { passiveIncome: 220, assets: 6_000 },
  },
  sequenceRisk: {
    hold: { assets: 6_000, stress: -2 },
    deRisk: { assets: -6_000, passiveIncome: -180, stress: -8 },
    aggressiveWin: { assets: 20_000, passiveIncome: 300, riskTolerance: 4 },
    aggressiveLose: { assets: -22_000, passiveIncome: -260, stress: 12 },
  },
  lateBloomerSprint: {
    sprintWin: { passiveIncome: 500, stress: 10, riskTolerance: 6 },
    sprintLose: { passiveIncome: -200, assets: -15_000, stress: 14, riskTolerance: 6 },
    accept: { stress: -8 },
  },
  optionality: {
    giveCash: { cash: -8_000, reputation: 8, stress: -6 },
    giveAssets: { assets: -10_000, reputation: 10, stress: -8 },
    hold: { stress: -2 },
    both: { cash: -3_000, assets: -3_000, reputation: 5, stress: -4 },
  },
} as const;

// ── TODO_TUNE — Phase 3, late-life freedom expansion ───────────────────
// Per docs/WealthLife_latelife_content_expansion.md §2. Same conventions
// as TUNE_FREEDOM. Magnitudes are TODO; directions are locked.
const TUNE_LATELIFE_FREEDOM = {
  // Magnitudes sit in the TUNE_FREEDOM band; see growthEvents.ts header
  // comment on TUNE_LATELIFE_GROWTH for the sweep delta context.
  healthcare: {
    insure: { expenses: 350, stress: -5 },
    selfFund: { cash: -4_000, stress: 6 },
  },
  helpFamily: {
    helpCash: { cash: -6_000, reputation: 6, stress: -4 },
    helpAssets: { assets: -8_000, reputation: 8, stress: -5 },
    setLimit: { stress: 3 },
  },
  encore: {
    pursue: { salary: 400, stress: -6 },
    retire: { salary: -2_000, stress: -14 },
  },
  legacy: {
    give: { assets: -12_000, reputation: 10, stress: -6 },
    hold: { stress: -2 },
  },
  // Variance modeled as two outcomes — same pattern as sequenceRisk.
  lateScare: {
    rideRecover: { assets: 10_000, stress: 8 },
    rideLose: { assets: -14_000, stress: 12 },
    deRisk: { assets: -5_000, passiveIncome: -150, stress: -10 },
  },
  enough: {
    keepBuilding: { passiveIncome: 220 },
    declareEnough: { salary: -1_800, stress: -14 },
  },
  // Ambient beat — both choices zero on money by design. See growth_market_drift comment.
  quietSeason: {
    savor: { stress: -2, health: 1 },
    stayBusy: { stress: 1, discipline: 1 },
  },
} as const;

export const FREEDOM_EVENTS: readonly GameEvent[] = [
  // ── WORK OPTIONAL — first time the math says you could step back ────
  // Soft-gated on passiveIncome so the option is only on the table once
  // there's coverage worth weighing. Tune via TUNE_FREEDOM in Phase 3.
  {
    id: 'freedom_work_optional',
    title: 'Work, Optional',
    category: 'career',
    phase: 'freedom',
    art: 'freedom_work_optional',
    conditions: { phase: 'freedom', stats: { passiveIncome: '>=600' } },
    fallbackText:
      'For the first time, the math says you could step back. The question is whether you believe it.',
    choices: [
      {
        id: 'step_back',
        label: 'Step back — live off the coverage',
        effects: TUNE_FREEDOM.workOptional.stepBack,
        setsFlags: ['stepped_back'],
        resultText:
          'You step back. The mornings widen; the salary line thins.',
      },
      {
        id: 'keep_building',
        label: 'Keep building — momentum has its own value',
        effects: TUNE_FREEDOM.workOptional.keepBuilding,
        setsFlags: ['kept_building_freedom'],
        resultText:
          'You keep building. The number grows; the calendar stays full.',
      },
      {
        id: 'cut_halfway',
        label: 'Cut back halfway — work less, not none',
        effects: TUNE_FREEDOM.workOptional.cutHalf,
        setsFlags: ['cut_back_halfway'],
        resultText:
          'You take a four-day week. The trade-off feels honest.',
      },
    ],
    tags: ['freedom', 'work_choice'],
  },

  // ── DRAWDOWN QUESTION — accumulate or live off it? ──────────────────
  {
    id: 'freedom_drawdown_question',
    title: 'The Drawdown Question',
    category: 'investing',
    phase: 'freedom',
    art: 'freedom_drawdown_question',
    conditions: { phase: 'freedom' },
    fallbackText:
      'The portfolio is meant to be spent eventually. Start drawing, or let it compound one more cycle?',
    choices: [
      {
        id: 'begin_drawdown',
        label: 'Begin drawdown — convert the build into a life',
        effects: TUNE_FREEDOM.drawdown.begin,
        setsFlags: ['drawing_down'],
        resultText:
          'You start the income. The portfolio shrinks slowly; the months feel different.',
      },
      {
        id: 'reinvest_one_more',
        label: 'Reinvest — one more compounding cycle',
        effects: TUNE_FREEDOM.drawdown.reinvest,
        setsFlags: ['deferred_drawdown'],
        resultText:
          'You let it compound. The bigger number is closer; the gratification is later.',
      },
    ],
    tags: ['drawdown', 'compounding'],
  },

  // ── SEQUENCE RISK — a downturn near the finish line ─────────────────
  // Variance choice exposed as two outcomes so the cost surface is legible.
  {
    id: 'freedom_sequence_risk',
    title: 'A Bad Market, Too Late to Fix It',
    category: 'pressure',
    phase: 'freedom',
    deferWindow: 0,
    art: 'freedom_sequence_risk',
    conditions: { phase: 'freedom', stats: { assets: '>=10000' } },
    fallbackText:
      'A bad market arrives with less time to recover than you used to have. Timing, not size, is the threat now.',
    choices: [
      {
        id: 'hold_steady',
        label: 'Hold steady — wait it out',
        effects: TUNE_FREEDOM.sequenceRisk.hold,
        setsFlags: ['held_sequence_risk'],
        resultText:
          'You hold. The recovery is partial; the position survives.',
      },
      {
        id: 'derisk_to_cash',
        label: 'De-risk to cash — lock the safer floor',
        effects: TUNE_FREEDOM.sequenceRisk.deRisk,
        setsFlags: ['derisked_sequence'],
        resultText:
          'You move to cash. The volatility stops; so does the upside.',
      },
      {
        id: 'stay_aggressive_win',
        label: 'Stay aggressive — and the market rewards it',
        effects: TUNE_FREEDOM.sequenceRisk.aggressiveWin,
        setsFlags: ['aggressive_through_sequence'],
        resultText:
          'You hold the allocation. The recovery overshoots; the year ends green.',
      },
      {
        id: 'stay_aggressive_lose',
        label: 'Stay aggressive — and the market takes more',
        effects: TUNE_FREEDOM.sequenceRisk.aggressiveLose,
        setsFlags: ['aggressive_through_sequence'],
        resultText:
          'You hold the allocation. The drop deepens; the runway shortens.',
      },
    ],
    tags: ['market', 'sequence_risk'],
  },

  // ── LATE BLOOMER'S SPRINT — the catch-up beat ───────────────────────
  // Brief: requiresFlags 'started_midlife' OR low coverage in freedom.
  // OR semantics within an AND-only conditions schema is expressed as two
  // records sharing the same id — the engine's firedEventIds filter
  // dedupes after either fires. The two paired success/fail choices live
  // on the canonical record only; the alt-eligibility record points at the
  // same choices via shared id when the eligible-pool picks it.
  {
    id: 'freedom_late_bloomers_sprint',
    title: "Late Bloomer's Sprint",
    category: 'opportunity',
    phase: 'freedom',
    art: 'freedom_late_bloomers_sprint',
    conditions: {
      phase: 'freedom',
      requiresFlags: ['started_midlife'],
    },
    fallbackText:
      "You started this later than most, or fell behind. There's still road — but only if you push.",
    choices: [
      {
        id: 'sprint_win',
        label: 'Sprint — push hard, and the allocation pays',
        effects: TUNE_FREEDOM.lateBloomerSprint.sprintWin,
        setsFlags: ['sprinted_late'],
        resultText:
          'You sprint. The high-risk bets land; the coverage finally climbs.',
      },
      {
        id: 'sprint_lose',
        label: 'Sprint — push hard, and the allocation misses',
        effects: TUNE_FREEDOM.lateBloomerSprint.sprintLose,
        setsFlags: ['sprinted_late'],
        resultText:
          'You sprint. The bets miss; the runway gets shorter still.',
      },
      {
        id: 'accept_where',
        label: 'Accept where you are — keep what you have',
        effects: TUNE_FREEDOM.lateBloomerSprint.accept,
        setsFlags: ['accepted_position'],
        resultText:
          'You stop pushing. The coverage stays flat; you stop bleeding.',
      },
    ],
    tags: ['late_bloomer', 'sprint'],
  },
  // Alt-eligibility record for the same beat — fires when freedom-phase
  // coverage is low regardless of how the player started. Shared id +
  // identical choices: once either record fires, applyChoice marks the id
  // in firedEventIds and both are filtered out of future picks.
  {
    id: 'freedom_late_bloomers_sprint',
    title: "Late Bloomer's Sprint",
    category: 'opportunity',
    phase: 'freedom',
    art: 'freedom_late_bloomers_sprint',
    conditions: {
      phase: 'freedom',
      stats: { passiveIncome: '<=400' },
    },
    fallbackText:
      "You started this later than most, or fell behind. There's still road — but only if you push.",
    choices: [
      {
        id: 'sprint_win',
        label: 'Sprint — push hard, and the allocation pays',
        effects: TUNE_FREEDOM.lateBloomerSprint.sprintWin,
        setsFlags: ['sprinted_late'],
        resultText:
          'You sprint. The high-risk bets land; the coverage finally climbs.',
      },
      {
        id: 'sprint_lose',
        label: 'Sprint — push hard, and the allocation misses',
        effects: TUNE_FREEDOM.lateBloomerSprint.sprintLose,
        setsFlags: ['sprinted_late'],
        resultText:
          'You sprint. The bets miss; the runway gets shorter still.',
      },
      {
        id: 'accept_where',
        label: 'Accept where you are — keep what you have',
        effects: TUNE_FREEDOM.lateBloomerSprint.accept,
        setsFlags: ['accepted_position'],
        resultText:
          'You stop pushing. The coverage stays flat; you stop bleeding.',
      },
    ],
    tags: ['late_bloomer', 'sprint'],
  },

  // ── OPTIONALITY — what freedom is actually for ──────────────────────
  {
    id: 'freedom_optionality',
    title: 'Room to Spare',
    category: 'opportunity',
    phase: 'freedom',
    deferWindow: 3,
    art: 'freedom_optionality',
    conditions: { phase: 'freedom', stats: { passiveIncome: '>=800' } },
    fallbackText:
      'You have room to spare. You could give some away, help someone, or simply hold it as security.',
    choices: [
      {
        id: 'give_help_cash',
        label: 'Give — a meaningful cheque',
        effects: TUNE_FREEDOM.optionality.giveCash,
        setsFlags: ['gave_meaningful'],
        resultText:
          'You write the cheque. The margin thins; the meaning grows.',
      },
      {
        id: 'give_help_assets',
        label: 'Help — assets toward someone\'s start',
        effects: TUNE_FREEDOM.optionality.giveAssets,
        setsFlags: ['helped_with_assets'],
        resultText:
          'You move assets. Your statement shrinks; another\'s gets a beginning.',
      },
      {
        id: 'hold_security',
        label: 'Hold — security is its own use',
        effects: TUNE_FREEDOM.optionality.hold,
        resultText:
          'You hold. The pile sits ready, just in case.',
      },
      {
        id: 'a_bit_of_both',
        label: 'A bit of both — give some, keep more',
        effects: TUNE_FREEDOM.optionality.both,
        setsFlags: ['gave_a_little'],
        resultText:
          'You split it. Enough to matter, not enough to risk.',
      },
    ],
    tags: ['optionality', 'meaning'],
  },

  // ─────────────────────────────────────────────────────────────────────
  // LATE-LIFE EXPANSION — see docs/WealthLife_latelife_content_expansion.md
  // 6 freedom additions + 1 ambient texture beat. Brings freedom-phase
  // density from ~5 → ~11 events so the 50–60 stretch lands a decision
  // every few months. Same conventions as the original 5.
  //
  // Ambient note: freedom_quiet_season is repeatable, low-weight, and
  // writes ZERO money on both choices — the §3 exception. No engine
  // cooldown primitive; low weight + competing pool is the cooldown.
  // ─────────────────────────────────────────────────────────────────────

  // ── SHARED · PRESSURE — health costs start to climb ──────────────────
  {
    id: 'freedom_healthcare',
    title: 'The Cost of Years',
    category: 'pressure',
    phase: 'freedom',
    art: 'event_freedom_healthcare',
    conditions: { phase: 'freedom' },
    fallbackText:
      'Health costs start to climb with the years. The plans on offer trade certainty against monthly drag.',
    choices: [
      {
        id: 'insure_well',
        label: 'Insure well — a higher monthly, a quieter floor',
        effects: TUNE_LATELIFE_FREEDOM.healthcare.insure,
        setsFlags: ['insured_healthcare'],
        resultText:
          'You take the broader plan. The monthly cheque is bigger; the late-night arithmetic stops.',
      },
      {
        id: 'self_fund',
        label: 'Self-fund — keep the buffer, accept the variance',
        effects: TUNE_LATELIFE_FREEDOM.healthcare.selfFund,
        setsFlags: ['self_funded_healthcare'],
        resultText:
          'You hold cash against it. Most years you save; one year you wish you hadn\'t.',
      },
    ],
    tags: ['health', 'expenses'],
  },

  // ── SHARED · OPPORTUNITY — someone you love needs help ───────────────
  {
    id: 'freedom_help_family',
    title: 'Someone You Love Needs Help',
    category: 'opportunity',
    phase: 'freedom',
    art: 'event_freedom_help_family',
    conditions: { phase: 'freedom' },
    fallbackText:
      'Someone you love needs real help — not flavor, not a gesture. The number is real.',
    choices: [
      {
        id: 'help_with_cash',
        label: 'Help generously — write the cheque',
        effects: TUNE_LATELIFE_FREEDOM.helpFamily.helpCash,
        setsFlags: ['helped_family'],
        resultText:
          'You send what they need. The balance is smaller; the call is easier.',
      },
      {
        id: 'help_with_assets',
        label: 'Help generously — move assets toward them',
        effects: TUNE_LATELIFE_FREEDOM.helpFamily.helpAssets,
        setsFlags: ['helped_family'],
        resultText:
          'You move part of the portfolio over. Your statement shrinks; theirs gets a start.',
      },
      {
        id: 'set_a_limit',
        label: 'Set a limit — what you can give, no more',
        effects: TUNE_LATELIFE_FREEDOM.helpFamily.setLimit,
        setsFlags: ['set_help_limit'],
        resultText:
          'You set the number and stick to it. The boundary is honest; the conversation is harder.',
      },
    ],
    tags: ['family', 'meaning'],
  },

  // ── SHARED · CAREER — a gentle encore ────────────────────────────────
  {
    id: 'freedom_encore',
    title: 'An Encore, Quietly',
    category: 'career',
    phase: 'freedom',
    art: 'event_freedom_encore',
    conditions: { phase: 'freedom' },
    fallbackText:
      'A passion project could be a gentle encore — small hours, real work, no boss to speak of.',
    choices: [
      {
        id: 'pursue_encore',
        label: 'Pursue it — a small income, a real reason to get up',
        effects: TUNE_LATELIFE_FREEDOM.encore.pursue,
        setsFlags: ['pursued_encore'],
        resultText:
          'You take the work. The cheque is small; the mornings have a shape again.',
      },
      {
        id: 'fully_retire',
        label: 'Fully retire — the work was the work',
        effects: TUNE_LATELIFE_FREEDOM.encore.retire,
        setsFlags: ['fully_retired'],
        resultText:
          'You stop. The mornings widen completely. It takes a while to stop feeling guilty about it.',
      },
    ],
    tags: ['retirement', 'meaning'],
  },

  // ── SHARED · OPPORTUNITY — legacy ────────────────────────────────────
  {
    id: 'freedom_legacy',
    title: 'What You Leave',
    category: 'opportunity',
    phase: 'freedom',
    deferWindow: 3,
    art: 'event_freedom_legacy',
    conditions: { phase: 'freedom' },
    fallbackText:
      'What you leave, and to whom, becomes the question. The lawyer is patient; the form is not.',
    choices: [
      {
        id: 'structure_legacy',
        label: 'Give / structure it — put the intent in writing',
        effects: TUNE_LATELIFE_FREEDOM.legacy.give,
        setsFlags: ['structured_legacy'],
        resultText:
          'You sign the documents. The estate shrinks now; the intent is unambiguous.',
      },
      {
        id: 'hold_legacy_close',
        label: 'Hold it close — decide later, keep optionality',
        effects: TUNE_LATELIFE_FREEDOM.legacy.hold,
        setsFlags: ['held_legacy'],
        resultText:
          'You hold it close. The pile sits ready, undirected.',
      },
    ],
    tags: ['legacy', 'meaning'],
  },

  // ── SHARED · PRESSURE — a jolt near the finish ───────────────────────
  // deferWindow 0 is the pressure default; stated explicitly per brief.
  // Variance modeled as two outcomes (matches sequenceRisk pattern).
  {
    id: 'freedom_late_scare',
    title: 'A Jolt Near the Finish',
    category: 'pressure',
    phase: 'freedom',
    deferWindow: 0,
    art: 'event_freedom_late_scare',
    conditions: { phase: 'freedom' },
    fallbackText:
      'A jolt near the finish line — a sharp market move, a health scare, the wrong kind of letter.',
    choices: [
      {
        id: 'ride_out_recover',
        label: 'Ride it out — and it passes',
        effects: TUNE_LATELIFE_FREEDOM.lateScare.rideRecover,
        setsFlags: ['rode_late_scare'],
        resultText:
          'You hold. The recovery comes; you stop checking the dashboard hourly.',
      },
      {
        id: 'ride_out_lose',
        label: 'Ride it out — and it takes a piece',
        effects: TUNE_LATELIFE_FREEDOM.lateScare.rideLose,
        setsFlags: ['rode_late_scare'],
        resultText:
          'You hold. The piece is gone for good; the runway shortens.',
      },
      {
        id: 'de_risk_scare',
        label: 'De-risk — lock the floor, accept the lower ceiling',
        effects: TUNE_LATELIFE_FREEDOM.lateScare.deRisk,
        setsFlags: ['derisked_late_scare'],
        resultText:
          'You move to safer ground. The volatility stops; so does part of the income.',
      },
    ],
    tags: ['variance', 'sequence_risk'],
  },

  // ── SHARED · CAREER — the quiet recalibration ────────────────────────
  {
    id: 'freedom_enough',
    title: 'Is This Enough?',
    category: 'career',
    phase: 'freedom',
    art: 'event_freedom_enough',
    conditions: { phase: 'freedom' },
    fallbackText:
      'The quiet recalibration: is this enough? The number could keep growing — or it could stop having to.',
    choices: [
      {
        id: 'keep_building_enough',
        label: 'Keep building — more is more',
        effects: TUNE_LATELIFE_FREEDOM.enough.keepBuilding,
        setsFlags: ['kept_building_enough'],
        resultText:
          'You keep building. The income line keeps climbing on its own.',
      },
      {
        id: 'declare_enough',
        label: 'Declare enough — stop adding to the pile',
        effects: TUNE_LATELIFE_FREEDOM.enough.declareEnough,
        setsFlags: ['declared_enough'],
        resultText:
          'You stop pushing. The number stops growing on purpose. The quiet is striking.',
      },
    ],
    tags: ['meaning', 'enough'],
  },

  // ── AMBIENT · PRESSURE — texture beats, age-tiered ───────────────────
  // §3 exception to the "must move money" rule. Both choices write ZERO
  // money on purpose — stress / health / discipline only. See the long
  // comment on growth_market_drift for the rationale behind the age-tier
  // pattern (engine has no cooldown primitive; a true repeatable beat
  // spammed every decision slot once non-repeatable events exhausted).
  {
    id: 'freedom_quiet_season',
    title: 'A Calm Season',
    category: 'pressure',
    phase: 'freedom',
    weight: 0.5,
    deferWindow: 0,
    art: 'event_freedom_quiet_season',
    conditions: { phase: 'freedom', minAge: 50, maxAge: 54 },
    fallbackText:
      'A calm season — or a restless one. The dashboard is quiet; the days are yours.',
    choices: [
      {
        id: 'savor_quiet',
        label: 'Savor it — let the slow week be slow',
        effects: TUNE_LATELIFE_FREEDOM.quietSeason.savor,
        resultText:
          'You sit in it. The week stretches; the shoulders drop.',
      },
      {
        id: 'stay_busy_quiet',
        label: 'Stay busy — find a project to chew on',
        effects: TUNE_LATELIFE_FREEDOM.quietSeason.stayBusy,
        resultText:
          'You pick up something to keep the hands busy. The week passes faster.',
      },
    ],
    tags: ['ambient', 'texture'],
  },
  {
    id: 'freedom_quiet_season_late',
    title: 'A Calm Season',
    category: 'pressure',
    phase: 'freedom',
    weight: 0.5,
    deferWindow: 0,
    art: 'event_freedom_quiet_season',
    conditions: { phase: 'freedom', minAge: 55, maxAge: 59 },
    fallbackText:
      'Another quiet stretch. The years are doing what years do.',
    choices: [
      {
        id: 'savor_quiet',
        label: 'Savor it — let the slow week be slow',
        effects: TUNE_LATELIFE_FREEDOM.quietSeason.savor,
        resultText:
          'You sit in it. Nothing has to be done before the morning.',
      },
      {
        id: 'stay_busy_quiet',
        label: 'Stay busy — find a project to chew on',
        effects: TUNE_LATELIFE_FREEDOM.quietSeason.stayBusy,
        resultText:
          'You pick something up. The hands prefer it.',
      },
    ],
    tags: ['ambient', 'texture'],
  },
];
