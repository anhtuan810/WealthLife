// Foundation-phase events (MASTER §8 / §9 / §10 / §25 / §26 / §33).
//
// All events have phase: "foundation" and live in the age 18–22 window.
// Organized in three age brackets so the chapter has an arc:
//   EARLY (18–19) — formative: schooling, debt, first paid work.
//   MID   (19–21) — building the strength profile: internships, gigs,
//                   network, first investing, side-project follow-ons.
//   LATE  (20–22) — direction-setting: relief vs leverage, burnout, drop-out,
//                   and the soft "what's next" event that tags a tendency.
//
// Flag wiring (writes → reads inside this batch):
//   took_big_loan      → loan_repayment_notice
//   has_side_business  → side_project_milestone, acquihire_offer
//   lives_in_hub       → premium_networking
//   has_apprenticeship → vocational_certification, trade_promotion
//   has_first_client   → first_freelance_referral, freelance_retainer
//   interned_bigco     → bigco_full_time_offer (requires), drop_out_decision (forbids)
//   has_mentor         → mentor_warm_intro
//   has_brokerage      → market_dip_buy
//
// Magnitude bands (kept consistent so balancing is one place):
//   strengths ±2–8 (formative ±10), stress ±3–12 (relief −5 to −10),
//   health ±2–8, salary +150–800, cash ±200–3000, debt ±500–8000 for
//   education / smaller otherwise, passiveIncome +20–120, expenses ±50–300.

import type { GameEvent } from '../../types/events';

import { $$ } from '../../data/economyScale';
export const FOUNDATION_EVENTS: readonly GameEvent[] = [
  // ───────────────────────────────────────────────────────────────────────
  // EARLY  (18–19) — formative
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'first_tuition_bill',
    title: 'First Tuition Bill',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 2,
    // Lapse: the unpaid balance the comply choice (take_loan, +6000 debt) would
    // have financed, plus a 15% late fee → +6900 debt.
    onLapse: {
      effects: { debt: $$(6900), stress: 4 },
      setsFlags: ['missed_tuition'],
      resultText:
        'You let the tuition deadline slide — the unpaid balance, plus a late fee, was added to your debt.',
    },
    art: 'event_first_tuition_bill',
    conditions: {
      minAge: 18,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['university'],
    },
    fallbackText:
      'The invoice arrives. You can take the maximum loan and focus on the work, scrape by working night shifts at a campus bar, or transfer to a cheaper local program before the term starts.',
    choices: [
      {
        id: 'take_loan',
        label: 'Take the loan and focus on studies',
        effects: { cash: $$(6000), debt: $$(6000), skill: 5, stress: 6 },
        setsFlags: ['took_big_loan'],
        resultText:
          'You sign for the maximum. The number on the paperwork is real; so is the runway it buys.',
      },
      {
        id: 'work_part',
        label: 'Work nights to keep the debt down',
        effects: { cash: $$(600), debt: $$(1500), stress: 12, skill: -2 },
        setsFlags: ['worked_through_school'],
        resultText:
          'You take the night job. The debt slows; the sleep does too.',
      },
      {
        id: 'cheaper_path',
        label: 'Transfer to a cheaper local program',
        effects: { debt: $$(1500), network: -4, stress: -4 },
        setsFlags: ['took_cheaper_path'],
        resultText:
          'You transfer before the term starts. The lecturers are quieter; so are the contacts.',
      },
    ],
    tags: ['debt', 'education', 'early_choice'],
  },

  {
    id: 'scholarship_offer',
    title: 'Scholarship Letter',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 2,
    art: 'event_scholarship_offer',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['university'],
    },
    fallbackText:
      'A merit scholarship comes through — partial, not full. Accepting means a renewal interview every term. Declining keeps your weekends free.',
    choices: [
      {
        id: 'accept_scholarship',
        label: 'Accept the award and the renewal clause',
        effects: { debt: $$(-4000), stress: 4, discipline: 5 },
        setsFlags: ['on_scholarship'],
        resultText:
          'You sign. The debt eases; the bar moves up every term.',
      },
      {
        id: 'partial_accept_negotiate',
        label: 'Negotiate a smaller no-strings award',
        effects: { debt: $$(-2000), network: 2, reputation: 3 },
        resultText:
          'You talk the office into a smaller cheque without the renewal clause.',
      },
      {
        id: 'decline_keep_freedom',
        label: 'Decline — keep the weekends clean',
        effects: { stress: -3 },
        resultText:
          'You let it go. The pressure stays even; so does the loan.',
      },
    ],
    tags: ['education', 'debt', 'relief'],
  },

  {
    id: 'major_choice',
    title: 'Major Declaration',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 0,
    art: 'event_major_choice',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['university'],
    },
    fallbackText:
      'Registration closes Friday. The serious programs lock you in early, and switching later costs a term.',
    choices: [
      {
        id: 'pick_engineering',
        label: 'Engineering — narrow and demanding',
        effects: { skill: 8, ambition: 3, stress: 5 },
        setsFlags: ['major_engineering'],
        resultText:
          'You pick engineering. The workload triples; the option set widens.',
      },
      {
        id: 'pick_business',
        label: 'Business — loud halls, useful people',
        effects: { network: 8, ambition: 4, skill: 2 },
        setsFlags: ['major_business'],
        resultText:
          'You pick business. The hallways are louder; the relationships compound.',
      },
      {
        id: 'pick_humanities',
        label: 'Humanities — smaller rooms, longer essays',
        effects: { reputation: 5, discipline: 4, skill: 4, stress: -3 },
        setsFlags: ['major_humanities'],
        resultText:
          'You pick humanities. Smaller classes, slower terms, sharper writing.',
      },
    ],
    tags: ['education', 'specialization'],
  },

  {
    id: 'parental_support_offer',
    title: 'Help From Home',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_parental_support_offer',
    conditions: { minAge: 18, maxAge: 19, phase: 'foundation' },
    fallbackText:
      'A parent offers to send a monthly cheque for the next couple of years. Accepting it would close the runway gap; declining keeps the relationship clean.',
    choices: [
      {
        id: 'accept_help',
        label: 'Accept the monthly cheque',
        effects: { cash: $$(1500), expenses: $$(-200), ambition: -4 },
        setsFlags: ['accepted_parental_help'],
        resultText:
          'You accept. The numbers ease; something in you quiets too.',
      },
      {
        id: 'accept_small_amount',
        label: 'Accept a smaller amount with an end date',
        effects: { cash: $$(500), expenses: $$(-80), discipline: 2 },
        setsFlags: ['accepted_parental_help'],
        resultText:
          'You agree to a smaller monthly amount and a clear end date.',
      },
      {
        id: 'decline_independence',
        label: 'Decline — do it on your own',
        effects: { ambition: 6, discipline: 4, stress: 4 },
        resultText:
          'You say no. You\'d rather build it without.',
      },
    ],
    tags: ['family', 'tradeoff', 'lifestyle'],
  },

  {
    id: 'where_you_live',
    title: 'Where You Live',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_where_you_live',
    conditions: { minAge: 18, maxAge: 22, phase: 'foundation' },
    fallbackText:
      'Your lease starts in two weeks. You can take the cheap room in a quiet part of town, split a place near the people you want to be around, or move back in with family and bank the difference.',
    choices: [
      {
        id: 'cheap_room',
        label: 'Cheap room, quiet street',
        effects: { cash: $$(200), expenses: $$(-120), network: -5, stress: -2, discipline: 1 },
        resultText:
          'You take the room. It\'s quiet, far, and easy on the runway.',
      },
      {
        id: 'hub_share',
        label: 'Share a place near the scene',
        effects: { cash: $$(-150), expenses: $$(150), network: 8, reputation: 3, stress: 3 },
        setsFlags: ['lives_in_hub'],
        resultText:
          'You move into the share house. The fridge is chaotic; the people are useful.',
      },
      {
        id: 'move_home',
        label: 'Move back in with family',
        effects: { expenses: $$(-250), ambition: -3, network: -3, discipline: 2, stress: -3 },
        resultText:
          'You move back. The runway lengthens; the ceiling lowers a notch.',
      },
    ],
    tags: ['housing', 'lifestyle', 'early_choice'],
  },

  {
    id: 'first_campus_job',
    title: 'Campus Library Job',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_first_campus_job',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['university'],
    },
    fallbackText:
      'The library is hiring student workers. Quiet shifts, modest pay, the rare chance to actually study while you\'re clocked in.',
    choices: [
      {
        id: 'take_library',
        label: 'Take the library badge',
        effects: { salary: $$(550), stress: 3, discipline: 3 },
        setsFlags: ['worked_through_school'],
        resultText:
          'You take the badge. The numbers move; so do your weekends.',
      },
      {
        id: 'chase_bar_money',
        label: 'Chase higher pay at the campus bar',
        effects: { salary: $$(750), stress: 7, health: -4 },
        setsFlags: ['worked_through_school'],
        resultText:
          'You take the bar job instead. More money, later nights.',
      },
      {
        id: 'pass_on_work',
        label: 'Skip it — keep the term clear',
        effects: { stress: -2, skill: 2 },
        resultText:
          'You skip it. The runway shortens; the term opens up.',
      },
    ],
    tags: ['income_lever', 'early_choice'],
  },

  {
    id: 'apprenticeship_offer',
    title: 'Apprenticeship Offer',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_apprenticeship_offer',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['vocational'],
    },
    fallbackText:
      'A regional contractor offers a two-year apprenticeship. The hourly rate is small, but the tools and certifications come with it.',
    choices: [
      {
        id: 'accept_apprenticeship',
        label: 'Sign the apprenticeship contract',
        effects: { salary: $$(500), skill: 7, discipline: 4, stress: 3 },
        setsFlags: ['has_apprenticeship'],
        resultText:
          'You sign. The cuts on your hands say the skill is real.',
      },
      {
        id: 'chase_solo_gigs',
        label: 'Chase solo jobs from day one',
        effects: { salary: $$(300), riskTolerance: 5, network: -2 },
        resultText:
          'You hunt your own jobs from the start. Some weeks pay; some don\'t.',
      },
      {
        id: 'take_warehouse_instead',
        label: 'Take a steady warehouse role instead',
        effects: { salary: $$(400), skill: -2, stress: 2 },
        resultText:
          'You take the warehouse role. Steady money, nothing to learn.',
      },
    ],
    tags: ['income_lever', 'career', 'early_choice'],
  },

  {
    id: 'first_freelance_client',
    title: 'First Real Client',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_first_freelance_client',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['self_taught'],
    },
    fallbackText:
      'A small agency wants a two-week project at a real rate. Saying yes means delivering on a brief that\'s vaguer than you\'d like.',
    choices: [
      {
        id: 'accept_client',
        label: 'Take the job at their rate',
        effects: { cash: $$(800), salary: $$(300), skill: 5, reputation: 4 },
        setsFlags: ['has_first_client'],
        resultText:
          'You take it. The deposit hits; the doubt fades a little.',
      },
      {
        id: 'counter_higher_rate',
        label: 'Counter at a higher rate',
        effects: { cash: $$(1100), salary: $$(350), network: -3, reputation: 6 },
        setsFlags: ['has_first_client'],
        resultText:
          'You counter. Half the agency walks away; the half that didn\'t, paid more.',
      },
      {
        id: 'pass_keep_learning',
        label: 'Pass — keep studying instead',
        effects: { skill: 5, discipline: 3, network: -3 },
        resultText:
          'You pass to keep studying. The work goes to someone else.',
      },
    ],
    tags: ['income_lever', 'reputation', 'early_choice'],
  },

  {
    id: 'warehouse_role',
    title: 'Warehouse Floor',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_warehouse_role',
    conditions: {
      minAge: 18,
      maxAge: 19,
      phase: 'foundation',
      foundationPath: ['straight_to_work'],
    },
    fallbackText:
      'A regional distribution centre is hiring on for the season. Long shifts, predictable cheques, twelve-hour days that feel like fourteen.',
    choices: [
      {
        id: 'take_overtime_track',
        label: 'Sign up for the overtime track',
        effects: { salary: $$(500), cash: $$(600), stress: 8, health: -5 },
        setsFlags: ['grinding_overtime'],
        resultText:
          'You take the overtime track. The cheques get fatter; so does the fatigue.',
      },
      {
        id: 'standard_rota',
        label: 'Take the standard rota',
        effects: { salary: $$(250), discipline: 2, stress: 3 },
        resultText:
          'You take the standard rota. Stable, slow, sustainable.',
      },
      {
        id: 'aim_at_supervisor',
        label: 'Aim at the supervisor track',
        effects: { salary: $$(350), skill: 4, network: 3, stress: 5 },
        setsFlags: ['supervisor_track'],
        resultText:
          'You aim at the supervisor role. The floor manager notices.',
      },
    ],
    tags: ['income_lever', 'career', 'early_choice'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // MID  (19–21) — strength profile takes shape
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'side_project_window',
    title: 'Side Project Window',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 1,
    art: 'event_side_project_window',
    conditions: { minAge: 18, maxAge: 22, phase: 'foundation' },
    fallbackText:
      'A friend mentions a small problem and a smaller budget. You could spend evenings building something for them, double down on hourly work to bank cash this quarter, or protect your runway and put the hours into learning.',
    choices: [
      {
        id: 'build_it',
        label: 'Build the thing',
        effects: { cash: $$(-200), skill: 6, network: 4, stress: 5 },
        setsFlags: ['has_side_business'],
        resultText:
          'You build it on evenings. The first version is ugly; the friend pays anyway.',
      },
      {
        id: 'grind_hours',
        label: 'Grind hours, bank the cash',
        effects: { cash: $$(500), stress: 6, skill: -1 },
        resultText:
          'You take the extra shifts. The cheque is fatter; the calendar isn\'t yours.',
      },
      {
        id: 'learn_first',
        label: 'Spend the hours learning',
        effects: { cash: $$(-100), skill: 5, discipline: 2, network: -1 },
        resultText:
          'You spend the hours reading and shipping practice work. Nothing earns yet.',
      },
    ],
    tags: ['side_hustle', 'tradeoff', 'early_choice'],
  },

  {
    id: 'bigco_internship',
    title: 'Summer at a Major Firm',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_bigco_internship',
    conditions: {
      minAge: 19,
      maxAge: 21,
      phase: 'foundation',
      foundationPath: ['university'],
      stats: { skill: '>=25' },
    },
    fallbackText:
      'You crack the screen at a name-brand firm and get a summer internship offer. The schedule is brutal; the line on your résumé writes itself.',
    choices: [
      {
        id: 'accept_internship',
        label: 'Take the internship in another city',
        effects: { cash: $$(4000), salary: $$(200), skill: 6, network: 8, reputation: 5, stress: 7 },
        setsFlags: ['interned_bigco'],
        resultText:
          'You move cities for the summer. The badge means more than the pay.',
      },
      {
        id: 'decline_stay_local',
        label: 'Decline — stay local for the summer',
        effects: { skill: 3, stress: -3, ambition: -2 },
        resultText:
          'You stay home and work locally. The summer was easier; the offer is gone.',
      },
      {
        id: 'build_summer_project',
        label: 'Skip it — build your own thing instead',
        effects: { cash: $$(-300), skill: 7, discipline: 4, stress: 4 },
        setsFlags: ['has_side_business'],
        resultText:
          'You build instead. No badge, just a thing that runs.',
      },
    ],
    tags: ['career', 'opportunity', 'income_lever'],
  },

  {
    id: 'vocational_certification',
    title: 'Trade Certification',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_vocational_certification',
    conditions: {
      minAge: 19,
      maxAge: 21,
      phase: 'foundation',
      foundationPath: ['vocational'],
      requiresFlags: ['has_apprenticeship'],
    },
    fallbackText:
      'The certification exam lands at the end of your apprenticeship. Passing bumps your rate; failing means another quarter at the bench.',
    choices: [
      {
        id: 'study_hard',
        label: 'Lock down evenings and study',
        effects: { skill: 8, salary: $$(400), stress: 6, discipline: 4 },
        setsFlags: ['has_certification'],
        resultText:
          'You pass on the first try. Your rate goes up the next pay cycle.',
      },
      {
        id: 'coast_through',
        label: 'Coast through and hope for a pass',
        effects: { skill: 2, salary: $$(100), stress: -2 },
        resultText:
          'You squeak by. Same job, marginally more money.',
      },
      {
        id: 'specialize_advanced',
        label: 'Take the advanced specialization track',
        effects: { skill: 10, salary: $$(600), debt: $$(1500), stress: 8 },
        setsFlags: ['has_certification'],
        resultText:
          'You take the advanced track and a small loan. The ceiling lifts.',
      },
    ],
    tags: ['career', 'income_lever', 'skill'],
  },

  {
    id: 'first_freelance_referral',
    title: 'Word of Mouth',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_first_freelance_referral',
    conditions: {
      minAge: 19,
      maxAge: 21,
      phase: 'foundation',
      foundationPath: ['self_taught'],
      requiresFlags: ['has_first_client'],
    },
    fallbackText:
      'Your first client refers you to a friend. The work is similar; the rate is up for negotiation.',
    choices: [
      {
        id: 'raise_rate_take_job',
        label: 'Raise the rate and take it',
        effects: { cash: $$(1200), salary: $$(350), reputation: 4 },
        resultText:
          'You raise the rate and they pay it. You quietly recalibrate everything.',
      },
      {
        id: 'keep_rate_keep_volume',
        label: 'Hold the rate, earn the loyalty',
        effects: { cash: $$(800), salary: $$(200), network: 5 },
        resultText:
          'You hold the rate and earn the loyalty. Two clients, both happy.',
      },
      {
        id: 'decline_focus',
        label: 'Pass — protect the hours for deep work',
        effects: { skill: 5, discipline: 3 },
        resultText:
          'You pass to keep your hours for deeper work.',
      },
    ],
    tags: ['income_lever', 'reputation', 'opportunity'],
  },

  {
    id: 'networking_event',
    title: 'Industry Mixer',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 0,
    art: 'event_networking_event',
    conditions: { minAge: 19, maxAge: 21, phase: 'foundation' },
    fallbackText:
      'A friend hands you a ticket to a mid-sized industry mixer. Hot rooms, warm drinks, the occasional useful conversation.',
    choices: [
      {
        id: 'work_the_room',
        label: 'Stay late and work the room',
        effects: { cash: $$(-50), network: 6, reputation: 3, stress: 4 },
        resultText:
          'You stay until the lights come on. Three numbers in your phone you didn\'t have before.',
      },
      {
        id: 'two_real_people',
        label: 'Find two real conversations',
        effects: { network: 4, reputation: 4, stress: 2 },
        resultText:
          'You skip the small talk and have two real conversations.',
      },
      {
        id: 'bail_early',
        label: 'Bail early — wrong night',
        effects: { stress: -3 },
        resultText:
          'You leave after twenty minutes. Some nights are not the night.',
      },
    ],
    tags: ['network', 'reputation'],
  },

  {
    id: 'find_mentor',
    title: 'A Senior Operator Takes Interest',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_find_mentor',
    conditions: { minAge: 19, maxAge: 21, phase: 'foundation' },
    fallbackText:
      'A more senior person — a friend of a friend — offers to meet monthly if you keep the questions sharp.',
    choices: [
      {
        id: 'accept_mentor',
        label: 'Accept the monthly hour',
        effects: { reputation: 4, ambition: 5, discipline: 4 },
        setsFlags: ['has_mentor'],
        resultText:
          'You accept. The monthly hour reshapes how you frame decisions.',
      },
      {
        id: 'pay_for_their_time',
        label: 'Insist on paying for their time',
        effects: { cash: $$(-400), reputation: 2, ambition: 3, network: 3 },
        setsFlags: ['has_mentor'],
        resultText:
          'You insist on paying for their time. The relationship is sharper for it.',
      },
      {
        id: 'decline_mentor',
        label: 'Decline politely — figure it out alone',
        effects: { ambition: -2, discipline: 2 },
        resultText:
          'You decline politely. You\'d rather figure it out yourself.',
      },
    ],
    tags: ['network', 'mentor'],
  },

  {
    id: 'first_brokerage',
    title: 'Open a Brokerage Account',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_first_brokerage',
    conditions: { minAge: 19, maxAge: 21, phase: 'foundation' },
    fallbackText:
      'You finally open the account. Two clicks, an automatic transfer, and you\'re an investor — at least technically.',
    choices: [
      {
        id: 'broad_index_monthly',
        label: 'Auto-buy a broad index every month',
        effects: { cash: $$(-500), investments: $$(500), passiveIncome: $$(25), discipline: 4 },
        setsFlags: ['has_brokerage'],
        resultText:
          'You set a monthly auto-buy. Boring, durable.',
      },
      {
        id: 'pick_a_few_stocks',
        label: 'Pick a few names yourself',
        effects: { cash: $$(-500), investments: $$(400), passiveIncome: $$(20), riskTolerance: 6, stress: 3 },
        setsFlags: ['has_brokerage'],
        resultText:
          'You pick a few names yourself. The dopamine hits before the dividends.',
      },
      {
        id: 'not_yet',
        label: 'Not yet — keep it in cash',
        effects: { discipline: -2, ambition: -2 },
        resultText:
          'You don\'t open it. The window stays open; intent decays.',
      },
    ],
    tags: ['investing', 'discipline'],
  },

  {
    id: 'side_project_milestone',
    title: 'First Real Users',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_side_project_milestone',
    conditions: {
      minAge: 19,
      maxAge: 21,
      phase: 'foundation',
      requiresFlags: ['has_side_business'],
    },
    fallbackText:
      'The side project has its first wave of actual users. Some are paying. Some are loud. Some are asking for features you didn\'t plan.',
    choices: [
      {
        id: 'double_down',
        label: 'Cut other commitments and push',
        effects: { cash: $$(-400), skill: 5, network: 4, stress: 6, ambition: 5 },
        setsFlags: ['serious_side_project'],
        resultText:
          'You cut your other commitments and push. The thing starts to look real.',
      },
      {
        id: 'keep_lite_touch',
        label: 'Hold it at evenings and weekends',
        effects: { cash: $$(200), salary: $$(150), discipline: 3 },
        resultText:
          'You hold it at evenings-and-weekends. Slow but solvent.',
      },
      {
        id: 'pivot_to_services',
        label: 'Pivot into a small consulting line',
        effects: { cash: $$(800), salary: $$(300), network: 4, reputation: 3 },
        setsFlags: ['services_side_business'],
        resultText:
          'You turn it into a consulting line. Less leverage, more cash.',
      },
    ],
    tags: ['side_hustle', 'opportunity', 'tradeoff'],
  },

  {
    id: 'loan_repayment_notice',
    title: 'Repayment Schedule',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 2,
    // Lapse: 10% penalty on the scheduled repayment the comply choice
    // (start_paying_now, -1500 cash → -1500 debt) targets → +150 debt.
    onLapse: {
      effects: { debt: $$(150), stress: 4 },
      setsFlags: ['missed_loan_payment'],
      resultText:
        'You skipped the repayment. A penalty was tacked onto what you owe.',
    },
    art: 'event_loan_repayment_notice',
    conditions: {
      minAge: 19,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['university'],
      requiresFlags: ['took_big_loan'],
    },
    fallbackText:
      'The first notice arrives. Interest is accruing. The grace period is shorter than you remembered.',
    choices: [
      {
        id: 'start_paying_now',
        label: 'Start chipping at the balance',
        effects: { cash: $$(-1500), debt: $$(-1500), stress: 4, discipline: 5 },
        resultText:
          'You start chipping at it. The number moves; the weight stays.',
      },
      {
        id: 'pay_minimum',
        label: 'Pay the minimum and move on',
        effects: { cash: $$(-300), debt: $$(-200), stress: 6 },
        resultText:
          'You pay the minimum. Interest keeps doing its work in the dark.',
      },
      {
        id: 'defer_legally',
        label: 'Defer using a hardship clause',
        effects: { stress: 3, debt: $$(800) },
        setsFlags: ['deferred_loan'],
        resultText:
          'You defer using a hardship clause. The debt grows quietly while you focus.',
      },
    ],
    tags: ['debt', 'pressure'],
  },

  {
    id: 'overtime_spiral',
    title: 'Mandatory Overtime',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_overtime_spiral',
    conditions: {
      minAge: 19,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['straight_to_work'],
    },
    fallbackText:
      'Q4 brings a wave of mandatory overtime. The bank account likes it; your sleep schedule does not.',
    choices: [
      {
        id: 'ride_it',
        label: 'Ride it out for the cheque',
        effects: { cash: $$(1500), salary: $$(200), stress: 10, health: -7 },
        resultText:
          'You ride it out for the cheque. By December you don\'t remember December.',
      },
      {
        id: 'push_back_quietly',
        label: 'Push back quietly and trade shifts',
        effects: { salary: $$(100), reputation: -2, stress: 3 },
        resultText:
          'You quietly trade shifts and refuse extras. The supervisor notices.',
      },
      {
        id: 'overtime_to_upskill',
        label: 'Ride part of it; use the cash to upskill',
        effects: { cash: $$(800), salary: $$(150), skill: 5, stress: 6 },
        resultText:
          'You ride some of it and use the cash to enrol in a night course.',
      },
    ],
    tags: ['income_lever', 'pressure', 'health'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // LATE  (20–22) — direction-setting
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'premium_networking',
    title: 'An Invite-Only Dinner',
    category: 'foundation',
    phase: 'foundation',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      requiresFlags: ['lives_in_hub'],
    },
    fallbackText:
      'Your roommate\'s circle is hosting a small dinner — operators, a couple of funders, an older builder you\'ve read about.',
    choices: [
      {
        id: 'attend_listen',
        label: 'Attend and mostly listen',
        effects: { network: 7, reputation: 5, ambition: 4 },
        resultText:
          'You attend and mostly listen. People remember the quiet one in the corner.',
      },
      {
        id: 'attend_pitch_hard',
        label: 'Attend and pitch yourself hard',
        effects: { network: 5, reputation: -2, ambition: 6, stress: 4 },
        resultText:
          'You pitch your project too hard. The room cools.',
      },
      {
        id: 'decline_dinner',
        label: 'Skip it — not the right night',
        effects: { stress: -2, network: -2 },
        resultText:
          'You skip it. Some windows close softly.',
      },
    ],
    tags: ['network', 'opportunity'],
  },

  {
    id: 'acquihire_offer',
    title: 'A Buyer Calls',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_acquihire_offer',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      requiresFlags: ['has_side_business'],
    },
    fallbackText:
      'A mid-sized company offers to buy the side project and the team — namely you. The number is real, with strings.',
    choices: [
      {
        id: 'accept_acquihire',
        label: 'Sign — take the cash and a salary',
        effects: { cash: $$(2500), salary: $$(700), network: 6, ambition: -3, riskTolerance: -3 },
        setsFlags: ['sold_business'],
        resultText:
          'You sign. The runway lengthens; the thing you built isn\'t yours anymore.',
      },
      {
        id: 'counter_higher',
        label: 'Counter for a better number',
        effects: { cash: $$(1500), salary: $$(650), network: 4, reputation: 3, stress: 4 },
        setsFlags: ['sold_business'],
        resultText:
          'You counter. They squeeze, you squeeze; everyone signs annoyed.',
      },
      {
        id: 'walk_away',
        label: 'Walk away — build it bigger',
        effects: { ambition: 6, riskTolerance: 5, stress: 5 },
        resultText:
          'You walk. You think you can build it bigger. Maybe.',
      },
    ],
    tags: ['opportunity', 'tradeoff', 'income_lever'],
  },

  {
    id: 'bigco_full_time_offer',
    title: 'Return Offer',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_bigco_full_time_offer',
    conditions: {
      minAge: 21,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['university'],
      requiresFlags: ['interned_bigco'],
    },
    fallbackText:
      'The firm extends a full-time offer ahead of graduation. The salary is real; the noncompete is broad.',
    choices: [
      {
        id: 'accept_offer',
        label: 'Sign the full-time offer',
        effects: { cash: $$(1500), salary: $$(700), network: 5, reputation: 5, ambition: 4 },
        setsFlags: ['big_company_employee'],
        resultText:
          'You sign. Onboarding starts the week after finals.',
      },
      {
        id: 'negotiate_remote',
        label: 'Negotiate a remote start',
        effects: { cash: $$(1200), salary: $$(600), network: 3, reputation: 4 },
        setsFlags: ['big_company_employee'],
        resultText:
          'You negotiate a remote start and lose some signing money. Worth it.',
      },
      {
        id: 'decline_go_independent',
        label: 'Decline — go independent',
        effects: { ambition: 8, riskTolerance: 6, stress: 5 },
        setsFlags: ['declined_corporate'],
        resultText:
          'You decline. The signing bonus stings on the way out.',
      },
    ],
    tags: ['career', 'income_lever', 'opportunity'],
  },

  {
    id: 'freelance_retainer',
    title: 'Retainer Conversation',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_freelance_retainer',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['self_taught'],
      requiresFlags: ['has_first_client'],
    },
    fallbackText:
      'An existing client wants to lock in a monthly retainer. Predictable income — and predictable obligations.',
    choices: [
      {
        id: 'accept_retainer',
        label: 'Take the retainer',
        effects: { cash: $$(800), salary: $$(500), stress: 3, discipline: 3 },
        setsFlags: ['has_retainer'],
        resultText:
          'You take the retainer. The month-to-month math finally calms down.',
      },
      {
        id: 'counter_terms',
        label: 'Counter for a higher floor',
        effects: { cash: $$(500), salary: $$(600), reputation: 4, riskTolerance: 3 },
        setsFlags: ['has_retainer'],
        resultText:
          'You counter for a higher floor and shorter notice. They blink first.',
      },
      {
        id: 'stay_project_basis',
        label: 'Stay project-to-project',
        effects: { riskTolerance: 5, ambition: 3, network: 2 },
        resultText:
          'You stay project-to-project. Lumpy income, more upside.',
      },
    ],
    tags: ['income_lever', 'career', 'tradeoff'],
  },

  {
    id: 'trade_promotion',
    title: 'Lead Hand Offer',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_trade_promotion',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['vocational'],
      requiresFlags: ['has_apprenticeship'],
    },
    fallbackText:
      'Your foreman offers you a lead-hand role. More responsibility, modest raise, your name on the schedule.',
    choices: [
      {
        id: 'accept_lead',
        label: 'Accept the lead-hand role',
        effects: { salary: $$(450), reputation: 5, ambition: 4, stress: 5 },
        setsFlags: ['crew_lead'],
        resultText:
          'You take it. The crew tests you on day one.',
      },
      {
        id: 'decline_specialize',
        label: 'Decline — stay on the tools and get sharper',
        effects: { skill: 6, salary: $$(250), discipline: 3 },
        resultText:
          'You stay on the tools. The next raise comes from skill, not stripes.',
      },
      {
        id: 'shop_competing_offers',
        label: 'Take a competing offer at another shop',
        effects: { cash: $$(-100), salary: $$(550), network: 4, stress: 4 },
        resultText:
          'You take a competing offer. The new shop pays more and watches less.',
      },
    ],
    tags: ['career', 'income_lever'],
  },

  {
    id: 'emergency_fund_decision',
    title: 'Build a Buffer',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_emergency_fund_decision',
    conditions: { minAge: 21, maxAge: 22, phase: 'foundation' },
    fallbackText:
      'You finally have enough margin to choose: park a real cushion, push it into the index, or upgrade the life around you.',
    choices: [
      {
        id: 'build_cushion',
        label: 'Ringfence three months of expenses',
        effects: { cash: $$(-800), assets: $$(800), stress: -8, discipline: 5 },
        setsFlags: ['has_emergency_fund'],
        resultText:
          'You ringfence three months of expenses. The background hum quiets.',
      },
      {
        id: 'push_into_index',
        label: 'Push it into the index instead',
        effects: { cash: $$(-800), investments: $$(1000), passiveIncome: $$(40), riskTolerance: 4 },
        setsFlags: ['has_brokerage'],
        resultText:
          'You push it into the index. Future-you might thank you. Or not.',
      },
      {
        id: 'upgrade_life',
        label: 'Upgrade the apartment a little',
        effects: { cash: $$(-800), expenses: $$(200), stress: -5, health: 4 },
        setsFlags: ['inflated_lifestyle'],
        resultText:
          'You upgrade the apartment. It feels good in a way you don\'t fully trust.',
      },
    ],
    tags: ['investing', 'lifestyle', 'tradeoff'],
  },

  {
    id: 'lifestyle_temptation',
    title: 'A New Car',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_lifestyle_temptation',
    conditions: {
      minAge: 21,
      maxAge: 22,
      phase: 'foundation',
      stats: { salary: '>=1500' },
    },
    fallbackText:
      'A friend trades up and the dealership math suddenly looks doable. The payment fits; the lifestyle starts to shift.',
    choices: [
      {
        id: 'finance_new',
        label: 'Finance a new one',
        effects: { cash: $$(-1500), debt: $$(3500), expenses: $$(250), stress: 5 },
        setsFlags: ['inflated_lifestyle'],
        resultText:
          'You sign the papers. The interior smells like a different life.',
      },
      {
        id: 'buy_used_cash',
        label: 'Pay cash for a used one',
        effects: { cash: $$(-2500), expenses: $$(80), stress: -2 },
        resultText:
          'You pay cash for a used one. Less drama, more dignity.',
      },
      {
        id: 'skip_it',
        label: 'Skip it — the bus is fine',
        effects: { discipline: 6, ambition: 3 },
        resultText:
          'You skip it entirely. The bus is fine. The math is better.',
      },
    ],
    tags: ['lifestyle', 'debt', 'pressure'],
  },

  {
    id: 'burnout_warning',
    title: 'The Body Sends a Note',
    category: 'foundation',
    phase: 'foundation',
    // Lapse: ignoring the body's note pushes stress further, no money impact.
    onLapse: {
      effects: { stress: 10 },
      setsFlags: ['ignored_burnout_warning'],
      resultText:
        'You ignored the warning signs. The pressure kept building.',
    },
    art: 'event_burnout_warning',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      stats: { stress: '>=60' },
    },
    priority: 5, // jumps the queue — a real warning shouldn't wait its turn
    fallbackText:
      'Your sleep is shot, your jaw is sore, and a routine cold knocks you flat for a week. Something has to give.',
    choices: [
      {
        id: 'take_real_break',
        label: 'Take two real weeks off',
        effects: { cash: $$(-400), salary: $$(-200), stress: -12, health: 7, ambition: -2 },
        setsFlags: ['burnout_warned'],
        resultText:
          'You take two weeks off and tell no one why. The colour comes back.',
      },
      {
        id: 'power_through',
        label: 'Power through — there\'s no time',
        effects: { stress: 5, health: -6, ambition: 4, discipline: 3 },
        setsFlags: ['pushed_through_burnout'],
        resultText:
          'You power through. Something gets shipped. Something else breaks quietly.',
      },
      {
        id: 'restructure_workload',
        label: 'Restructure — drop two commitments',
        effects: { stress: -7, salary: $$(-150), reputation: -2, discipline: 4 },
        setsFlags: ['burnout_warned'],
        resultText:
          'You restructure. You drop two commitments and say it out loud.',
      },
    ],
    tags: ['pressure', 'health', 'priority'],
  },

  {
    id: 'drop_out_decision',
    title: 'Walk Away From the Degree',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 0,
    art: 'event_drop_out_decision',
    conditions: {
      minAge: 20,
      maxAge: 22,
      phase: 'foundation',
      foundationPath: ['university'],
      forbidsFlags: ['interned_bigco'],
    },
    fallbackText:
      'The numbers, the politics, the diminishing returns — you can finish the degree, or you can call it and reclaim two years.',
    choices: [
      {
        id: 'drop_out_build',
        label: 'Drop out and build',
        effects: { debt: $$(-2000), ambition: 8, riskTolerance: 7, network: -5, stress: 4 },
        setsFlags: ['dropped_out'],
        resultText:
          'You file the paperwork. The relief is louder than the doubt.',
      },
      {
        id: 'take_leave',
        label: 'Take a formal leave instead',
        effects: { stress: -5, ambition: 2, discipline: 3 },
        setsFlags: ['on_leave'],
        resultText:
          'You take a formal leave. The door stays propped open.',
      },
      {
        id: 'push_through_finish',
        label: 'Push through and finish',
        effects: { stress: 7, debt: $$(2000), discipline: 6, reputation: 4 },
        setsFlags: ['finished_degree'],
        resultText:
          'You stay and finish on schedule. The credential is bought; the years are spent.',
      },
    ],
    tags: ['education', 'direction', 'tradeoff'],
  },

  {
    id: 'mentor_warm_intro',
    title: 'A Warm Introduction',
    category: 'foundation',
    phase: 'foundation',
    art: 'event_mentor_warm_intro',
    conditions: {
      minAge: 21,
      maxAge: 22,
      phase: 'foundation',
      requiresFlags: ['has_mentor'],
    },
    fallbackText:
      'Your mentor offers to introduce you to one of three people: a founder, a senior recruiter at a global firm, or an independent who runs his own studio.',
    choices: [
      {
        id: 'intro_founder',
        label: 'Take the founder intro',
        effects: { network: 6, ambition: 5, riskTolerance: 3 },
        resultText:
          'The conversation is short and unsettling in the right way.',
      },
      {
        id: 'intro_recruiter',
        label: 'Take the recruiter intro',
        effects: { network: 5, reputation: 4, salary: $$(200) },
        resultText:
          'Doors stay open you didn\'t know were doors.',
      },
      {
        id: 'intro_independent',
        label: 'Take the independent intro',
        effects: { network: 5, riskTolerance: 4, discipline: 3 },
        resultText:
          'The studio life looks both freer and lonelier than expected.',
      },
    ],
    tags: ['network', 'opportunity'],
  },

  {
    id: 'market_dip_buy',
    title: 'A Sharp Dip',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 1,
    art: 'event_market_dip_buy',
    conditions: {
      minAge: 21,
      maxAge: 22,
      phase: 'foundation',
      requiresFlags: ['has_brokerage'],
    },
    fallbackText:
      'Markets drop fifteen percent in a week. The feed is loud. The auto-buy keeps running in the background.',
    choices: [
      {
        id: 'add_aggressively',
        label: 'Add lump-sum at the bottom',
        effects: { cash: $$(-1500), investments: $$(1800), passiveIncome: $$(60), riskTolerance: 5, stress: 4 },
        resultText:
          'You add at the bottom of the move. You don\'t know it\'s the bottom yet.',
      },
      {
        id: 'hold_the_plan',
        label: 'Change nothing — hold the plan',
        effects: { discipline: 5, stress: -2 },
        resultText:
          'You change nothing and close the app. The plan does the work.',
      },
      {
        id: 'sell_to_safety',
        label: 'Sell into the dip',
        effects: { cash: $$(700), investments: $$(-1000), passiveIncome: $$(-30), stress: -4, riskTolerance: -4 },
        resultText:
          'You sell into the dip. The number stops hurting; future-you might.',
      },
    ],
    tags: ['investing', 'pressure', 'discipline'],
  },

  {
    id: 'whats_next',
    title: 'End of the Foundation',
    category: 'foundation',
    phase: 'foundation',
    deferWindow: 0,
    art: 'event_whats_next',
    conditions: { minAge: 22, maxAge: 22, phase: 'foundation' },
    priority: 3, // late-foundation directional event should fire when eligible
    fallbackText:
      'You\'re staring down twenty-two. The shape of the next ten years is being decided in the next few months. Be honest about which one feels right.',
    choices: [
      {
        id: 'aim_corporate_track',
        label: 'Orient toward the ladder',
        effects: { ambition: 5, discipline: 4, riskTolerance: -3 },
        setsFlags: ['leaning_corporate'],
        resultText:
          'You orient toward the ladder. The path is well-lit; the ceiling is too.',
      },
      {
        id: 'aim_founder_track',
        label: 'Orient toward building your own',
        effects: { ambition: 6, riskTolerance: 7, stress: 4 },
        setsFlags: ['leaning_founder'],
        resultText:
          'You orient toward building. The path is dim; the ceiling isn\'t drawn.',
      },
      {
        id: 'aim_independent_track',
        label: 'Orient toward small-shop freelance life',
        effects: { ambition: 4, riskTolerance: 4, discipline: 3 },
        setsFlags: ['leaning_independent'],
        resultText:
          'You orient toward freelance and small-shop life. You trade ceiling for control.',
      },
      {
        id: 'still_undecided',
        label: 'Refuse to decide yet',
        effects: { stress: 3, discipline: -2 },
        setsFlags: ['undecided'],
        resultText:
          'You don\'t decide. The next ten years will decide for you.',
      },
    ],
    tags: ['direction', 'identity'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // PRESSURE-RELIEF (cross-phase, university only) — three sibling records
  // express "negative cashflow OR high debt burden OR rising stress" within
  // the AND-only EventConditions schema. Each variant has a unique id (so
  // firedEventIds tracks them independently), but every choice sets the
  // shared `took_uni_relief` flag, which all variants forbid — so at most
  // one ever fires per run.
  //
  // conditions.phase is intentionally omitted so the event bridges into
  // early career (minAge..maxAge = 19..24). priority = 4 means relief fires
  // before regular decision-beat events but yields to burnout_warning
  // (priority 5).
  //
  // CRITICAL: the first two choices are BOTH low-stress AND cashflow-
  // positive (expenses down, ~0 stress). Without that, a stress-minimizing
  // player can't escape the university floor — the only escape pre-content
  // was the maximize-money branch.
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'university_income_relief_lowsalary',
    title: 'A Note From Financial Aid',
    category: 'pressure',
    phase: 'foundation',
    art: 'event_university_income_relief_lowsalary',
    priority: 4,
    conditions: {
      minAge: 19,
      maxAge: 24,
      foundationPath: ['university'],
      stats: { salary: '<=200' },
      forbidsFlags: ['took_uni_relief'],
    },
    fallbackText:
      'Your account is on a list. The financial-aid office wants to talk options. You can shrink the monthly cheque under an income clause, pause it under hardship and let interest do its thing, or take a paid co-op next term and let the placement pay for itself.',
    choices: [
      {
        // Tuned big on purpose: the salary + expenses move has to push
        // cashflow above the tick.ts `comfortableSurplus` (500) so that
        // reliefAmount activates and stress can actually DECAY. A smaller
        // package leaves debtBurden pressure climbing and minimize_stress
        // play stays pinned at 100 stress regardless of the choice.
        id: 'income_based_repayment',
        label: 'File for an aid package + income-based repayment',
        effects: { expenses: $$(-700), salary: $$(800), stress: -3, discipline: 3 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You file the paperwork. A monthly stipend lands; the loan cheque shrinks. The runway widens by an order of magnitude.',
      },
      {
        id: 'loan_hardship_deferment',
        label: 'Use the hardship deferment',
        effects: { expenses: $$(-400), debt: $$(1500), stress: -1, discipline: 2 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You pause the payments. Interest keeps working in the dark while you reset.',
      },
      {
        // +3 ambition gives maximize_ambition a non-zero argmax here, so
        // that policy reliably picks the income-positive path instead of
        // a random tie among 0-ambition choices.
        id: 'paid_coop',
        label: 'Swap a term for a paid co-op',
        effects: {
          salary: $$(700),
          cash: $$(500),
          skill: 4,
          network: 3,
          ambition: 3,
          stress: 5,
        },
        setsFlags: ['took_uni_relief', 'did_paid_coop'],
        resultText:
          'You take the placement. The cheque is real; the term gets dense in a way you wanted.',
      },
    ],
    tags: ['pressure', 'relief', 'income_lever', 'university'],
  },

  {
    id: 'university_income_relief_debt',
    title: 'A Note From Financial Aid',
    category: 'pressure',
    phase: 'foundation',
    art: 'event_university_income_relief_debt',
    priority: 4,
    conditions: {
      minAge: 19,
      maxAge: 24,
      foundationPath: ['university'],
      stats: { debt: '>=10000' },
      forbidsFlags: ['took_uni_relief'],
    },
    fallbackText:
      'Your account is on a list. The financial-aid office wants to talk options. You can shrink the monthly cheque under an income clause, pause it under hardship and let interest do its thing, or take a paid co-op next term and let the placement pay for itself.',
    choices: [
      {
        // Tuned big on purpose: the salary + expenses move has to push
        // cashflow above the tick.ts `comfortableSurplus` (500) so that
        // reliefAmount activates and stress can actually DECAY. A smaller
        // package leaves debtBurden pressure climbing and minimize_stress
        // play stays pinned at 100 stress regardless of the choice.
        id: 'income_based_repayment',
        label: 'File for an aid package + income-based repayment',
        effects: { expenses: $$(-700), salary: $$(800), stress: -3, discipline: 3 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You file the paperwork. A monthly stipend lands; the loan cheque shrinks. The runway widens by an order of magnitude.',
      },
      {
        id: 'loan_hardship_deferment',
        label: 'Use the hardship deferment',
        effects: { expenses: $$(-400), debt: $$(1500), stress: -1, discipline: 2 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You pause the payments. Interest keeps working in the dark while you reset.',
      },
      {
        // +3 ambition gives maximize_ambition a non-zero argmax here, so
        // that policy reliably picks the income-positive path instead of
        // a random tie among 0-ambition choices.
        id: 'paid_coop',
        label: 'Swap a term for a paid co-op',
        effects: {
          salary: $$(700),
          cash: $$(500),
          skill: 4,
          network: 3,
          ambition: 3,
          stress: 5,
        },
        setsFlags: ['took_uni_relief', 'did_paid_coop'],
        resultText:
          'You take the placement. The cheque is real; the term gets dense in a way you wanted.',
      },
    ],
    tags: ['pressure', 'relief', 'income_lever', 'university'],
  },

  {
    id: 'university_income_relief_stress',
    title: 'A Note From Financial Aid',
    category: 'pressure',
    phase: 'foundation',
    art: 'event_university_income_relief_stress',
    priority: 4,
    conditions: {
      minAge: 19,
      maxAge: 24,
      foundationPath: ['university'],
      stats: { stress: '>=30' },
      forbidsFlags: ['took_uni_relief'],
    },
    fallbackText:
      'Your account is on a list. The financial-aid office wants to talk options. You can shrink the monthly cheque under an income clause, pause it under hardship and let interest do its thing, or take a paid co-op next term and let the placement pay for itself.',
    choices: [
      {
        // Tuned big on purpose: the salary + expenses move has to push
        // cashflow above the tick.ts `comfortableSurplus` (500) so that
        // reliefAmount activates and stress can actually DECAY. A smaller
        // package leaves debtBurden pressure climbing and minimize_stress
        // play stays pinned at 100 stress regardless of the choice.
        id: 'income_based_repayment',
        label: 'File for an aid package + income-based repayment',
        effects: { expenses: $$(-700), salary: $$(800), stress: -3, discipline: 3 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You file the paperwork. A monthly stipend lands; the loan cheque shrinks. The runway widens by an order of magnitude.',
      },
      {
        id: 'loan_hardship_deferment',
        label: 'Use the hardship deferment',
        effects: { expenses: $$(-400), debt: $$(1500), stress: -1, discipline: 2 },
        setsFlags: ['took_uni_relief'],
        resultText:
          'You pause the payments. Interest keeps working in the dark while you reset.',
      },
      {
        // +3 ambition gives maximize_ambition a non-zero argmax here, so
        // that policy reliably picks the income-positive path instead of
        // a random tie among 0-ambition choices.
        id: 'paid_coop',
        label: 'Swap a term for a paid co-op',
        effects: {
          salary: $$(700),
          cash: $$(500),
          skill: 4,
          network: 3,
          ambition: 3,
          stress: 5,
        },
        setsFlags: ['took_uni_relief', 'did_paid_coop'],
        resultText:
          'You take the placement. The cheque is real; the term gets dense in a way you wanted.',
      },
    ],
    tags: ['pressure', 'relief', 'income_lever', 'university'],
  },
];
