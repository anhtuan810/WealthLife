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
];
