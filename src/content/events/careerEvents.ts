// Career-phase events (MASTER §8 / §9 / §10 / §11.4 / §11.6 / §25 / §26 / §33).
//
// All events phase: "career". minAge/maxAge spread across 22–25; career
// cooldown is 3 months → ~12 decision slots over the slice, so variety and
// replay matter more than volume.
//
// This batch finally CONSUMES the foundation flags that were write-only at the
// end of the foundation chapter (the payoff of the §26 flag system):
//   took_big_loan       → loan_consolidation_offer
//   has_brokerage       → etf_recurring_uplift
//   has_emergency_fund  → sabbatical_window
//   has_mentor          → mentor_role_intro
//   has_first_client    → agency_expansion
//   has_retainer        → studio_launch
//   has_side_business   → founder_scaling_decision (chained with leaning_founder)
//   dropped_out         → dropped_out_grit_opportunity
//   finished_degree     → finished_degree_consulting_role
//   interned_bigco      → bigco_alumni_referral
//   inflated_lifestyle  → inflated_lifestyle_trap
//   burnout_warned      → burnout_relapse_warning
//   leaning_corporate   → corporate_leadership_offer
//   leaning_founder     → founder_scaling_decision
//   leaning_independent → independent_brand_launch
//
// Bias (not lock) per §9: leaning_* flags either gate deep chain events
// (with weight 2 so they dominate the eligible pool when present) OR add a
// stronger directional flavor on top of the universal core. Universal
// opportunities (startup_offer, property_deal, mentor_role_intro, etc.) stay
// reachable for any leaning so cross-direction moves remain a real cost-of-
// momentum choice — never gated out.
//
// Magnitude bands (career-scaled, single source of tuning):
//   salary +500–3000, cash ±500–8000, investments +1000–10000,
//   passiveIncome +50–400, expenses ±100–800, stress ±5–15,
//   strengths ±2–10.

import type { GameEvent } from '../../types/events';

export const CAREER_EVENTS: readonly GameEvent[] = [
  // ───────────────────────────────────────────────────────────────────────
  // UNIVERSAL CORE — reachable for any leaning; the spine of the chapter.
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'promotion_review',
    title: 'Performance Review',
    category: 'career',
    phase: 'career',
    art: 'event_promotion_review',
    conditions: {
      minAge: 22,
      maxAge: 25,
      phase: 'career',
      stats: { skill: '>=30' },
    },
    fallbackText:
      'The annual review lands and your manager floats a promotion. The title is real; the workload moves with it.',
    choices: [
      {
        id: 'take_promotion',
        label: 'Accept the promotion',
        effects: { salary: 1200, stress: 8, ambition: 4, reputation: 4 },
        setsFlags: ['took_promotion'],
        resultText:
          'You take the title. The calendar fills before the raise lands.',
      },
      {
        id: 'decline_focus_on_skill',
        label: 'Decline — deepen the craft instead',
        effects: { skill: 8, salary: 300, discipline: 4 },
        setsFlags: ['declined_promotion'],
        resultText:
          'You stay where you are and get sharper. The next opportunity has more leverage.',
      },
      {
        id: 'leverage_outside_offer',
        label: 'Bring an outside offer to negotiate',
        effects: { cash: -200, salary: 1800, network: 4, reputation: -2, stress: 10 },
        setsFlags: ['leveraged_offer'],
        resultText:
          'You bring an offer to the table. The number jumps; trust takes a hit.',
      },
    ],
    tags: ['career', 'promotion', 'income_lever'],
  },

  {
    id: 'manager_conflict',
    title: 'A Conflict Hits the Open',
    category: 'career',
    phase: 'career',
    art: 'event_manager_conflict',
    conditions: { minAge: 22, maxAge: 25, phase: 'career' },
    fallbackText:
      'A disagreement with your manager spills into the open. Reading the room would have been smarter; saying nothing now would be smarter still.',
    choices: [
      {
        id: 'stand_ground',
        label: 'Stand your ground in writing',
        effects: { reputation: 5, stress: 10, ambition: 3 },
        resultText:
          'You document the disagreement. Half the room respects you for it.',
      },
      {
        id: 'work_around_quietly',
        label: 'Route around them quietly',
        effects: { discipline: 4, network: 3, stress: 4 },
        resultText:
          'You build allies elsewhere. The conflict goes underground.',
      },
      {
        id: 'quiet_quit',
        label: 'Stop trying — coast for a quarter',
        effects: { stress: -5, reputation: -5, ambition: -3, discipline: -2 },
        setsFlags: ['quiet_quitter'],
        resultText:
          'You stop trying. The numbers don\'t notice; you do.',
      },
    ],
    tags: ['career', 'pressure', 'reputation'],
  },

  {
    id: 'skill_upgrade_certificate',
    title: 'A Real Course or a Cheap One',
    category: 'career',
    phase: 'career',
    art: 'event_skill_upgrade_certificate',
    conditions: { minAge: 22, maxAge: 24, phase: 'career' },
    fallbackText:
      'A new specialization is suddenly the floor for the next promotion. The certification path costs money; the self-taught path costs sleep.',
    choices: [
      {
        id: 'pay_for_program',
        label: 'Pay for the formal program',
        effects: { cash: -1500, skill: 8, discipline: 4, stress: 5 },
        setsFlags: ['formal_certification'],
        resultText:
          'You sign up. Six weekends gone; one credential gained.',
      },
      {
        id: 'employer_funded',
        label: 'Push your employer to pay',
        effects: { cash: -200, skill: 6, network: 3, reputation: 3 },
        setsFlags: ['employer_funded_cert'],
        resultText:
          'You convince L&D to cover it. The training is real; the obligation is too.',
      },
      {
        id: 'self_directed',
        label: 'Self-study and ship a project',
        effects: { cash: -300, skill: 7, discipline: 6 },
        setsFlags: ['self_taught_specialty'],
        resultText:
          'You learn it by building something with it. No certificate, but you can do the thing.',
      },
    ],
    tags: ['skill', 'career'],
  },

  {
    id: 'lifestyle_inflation_apartment',
    title: 'The Apartment Upgrade',
    category: 'career',
    phase: 'career',
    art: 'event_lifestyle_inflation_apartment',
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      stats: { salary: '>=2200' },
    },
    fallbackText:
      'The salary jump means a different building, a different neighbourhood, a different rent. The math fits; the lifestyle would expand to fill it.',
    choices: [
      {
        id: 'upgrade_lease',
        label: 'Sign the better lease',
        effects: { cash: -2000, expenses: 400, stress: -3, health: 3 },
        setsFlags: ['upgraded_lease', 'inflated_lifestyle'],
        resultText:
          'You upgrade. The space feels good; the burn rate moves quietly.',
      },
      {
        id: 'mid_upgrade',
        label: 'Move to a marginally nicer place',
        effects: { cash: -1000, expenses: 200, stress: -2 },
        resultText:
          'You move up one tier. Better neighbourhood, same math.',
      },
      {
        id: 'stay_put',
        label: 'Renew — bank the difference',
        effects: { discipline: 6, ambition: 3 },
        setsFlags: ['anti_inflation'],
        resultText:
          'You renew the existing lease. The cheque goes somewhere with leverage.',
      },
    ],
    tags: ['lifestyle', 'pressure', 'tradeoff'],
  },

  {
    id: 'property_deal',
    title: 'A Listing You Can Afford',
    category: 'career',
    phase: 'career',
    art: 'event_property_deal',
    conditions: {
      minAge: 24,
      maxAge: 25,
      phase: 'career',
      stats: { cash: '>=6000' },
    },
    fallbackText:
      'A small unit in a transitioning neighbourhood comes onto the market. The deposit is reachable; the lifestyle penalty is real.',
    choices: [
      {
        id: 'buy_to_let',
        label: 'Buy as a rental investment',
        effects: {
          cash: -4500,
          debt: 8000,
          assets: 14000,
          passiveIncome: 220,
          expenses: 250,
          stress: 8,
          riskTolerance: 4,
        },
        setsFlags: ['has_property', 'has_rental_income'],
        resultText:
          'You close on it. The first tenant moves in by the next quarter.',
      },
      {
        id: 'reit_index_instead',
        label: 'Skip the property — put it in a REIT',
        effects: {
          cash: -3000,
          investments: 3500,
          passiveIncome: 120,
          discipline: 4,
        },
        setsFlags: ['has_reit'],
        resultText:
          'You take the dividend without the mortgage. Less upside, no plumbing.',
      },
      {
        id: 'pass_too_risky',
        label: 'Pass — keep optionality',
        effects: { discipline: 3, ambition: -2 },
        resultText:
          'You pass. The listing sells in a week to someone with more conviction.',
      },
    ],
    tags: ['investing', 'leverage', 'capital'],
  },

  {
    id: 'startup_offer',
    title: 'An Early Startup Offer',
    category: 'career',
    phase: 'career',
    art: 'event_startup_offer',
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      stats: { network: '>=40' },
    },
    fallbackText:
      'A small team three offices over wants you as employee five. Sub-market cash, real equity, no safety net.',
    choices: [
      {
        id: 'join_employee_five',
        label: 'Join — take the equity',
        effects: {
          cash: 2000,
          salary: 1200,
          ambition: 5,
          riskTolerance: 5,
          stress: 8,
        },
        setsFlags: ['joined_startup', 'has_startup_equity'],
        resultText:
          'You sign. The vest schedule says four years; the runway says eighteen months.',
      },
      {
        id: 'cofounder_terms',
        label: 'Negotiate cofounder terms',
        effects: {
          cash: -2000,
          salary: -500,
          ambition: 8,
          riskTolerance: 7,
          reputation: 3,
          stress: 12,
        },
        setsFlags: ['is_cofounder', 'has_startup_equity'],
        resultText:
          'You push for cofounder. They blink; you both sign something heavier than expected.',
      },
      {
        id: 'pass_keep_momentum',
        label: 'Pass — keep career momentum',
        effects: { discipline: 3, ambition: -2, reputation: 2 },
        resultText:
          'You pass. The team raises a round six months later; the offer doesn\'t come back.',
      },
    ],
    tags: ['opportunity', 'career_switch', 'risk'],
  },

  {
    id: 'burnout_recovery_event',
    title: 'The Wheels Come Off',
    category: 'career',
    phase: 'career',
    art: 'event_burnout_recovery_event',
    priority: 5,
    conditions: {
      minAge: 22,
      maxAge: 25,
      phase: 'career',
      stats: { stress: '>=60' },
    },
    fallbackText:
      'You miss a deadline you would normally hit in your sleep. The reflection in the bathroom mirror at 11pm answers the question for you.',
    choices: [
      {
        id: 'real_sabbatical',
        label: 'Take a real, paid break',
        effects: {
          cash: -2000,
          salary: -500,
          stress: -15,
          health: 10,
          discipline: 4,
        },
        setsFlags: ['took_career_break'],
        resultText:
          'You take the time. The colour comes back; so does the perspective.',
      },
      {
        id: 'cut_obligations',
        label: 'Cut commitments and triage',
        effects: { salary: -200, stress: -10, reputation: -3, discipline: 5 },
        resultText:
          'You quietly drop two responsibilities. Your team adjusts; your sleep returns.',
      },
      {
        id: 'power_through_again',
        label: 'Power through — there\'s no time',
        effects: { stress: 8, health: -10, ambition: 3, reputation: 2 },
        setsFlags: ['chronic_burnout'],
        resultText:
          'You push. Something ships; something else breaks behind the scenes.',
      },
    ],
    tags: ['health', 'pressure', 'priority'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // FLAG-GATED CONSUMERS — close the loops on the banked foundation flags.
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'etf_recurring_uplift',
    title: 'Increase the Auto-Buy',
    category: 'investing',
    phase: 'career',
    art: 'event_etf_recurring_uplift',
    conditions: {
      minAge: 22,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_brokerage'],
    },
    fallbackText:
      'The portfolio is two years in and the auto-buy is still set at the student amount. Raising the contribution would be quietly transformative.',
    choices: [
      {
        id: 'max_out_contribution',
        label: 'Max the monthly contribution',
        effects: {
          cash: -3000,
          investments: 3200,
          passiveIncome: 110,
          discipline: 5,
        },
        setsFlags: ['serious_investor'],
        resultText:
          'You raise the auto-buy to a real number. The position starts to compound visibly.',
      },
      {
        id: 'moderate_increase',
        label: 'Bump it modestly',
        effects: { cash: -1500, investments: 1600, passiveIncome: 55 },
        resultText:
          'You increase it by half. Quiet, durable, repeatable.',
      },
      {
        id: 'pause_for_cash',
        label: 'Pause it — keep more cash',
        effects: { cash: 600, discipline: -3 },
        setsFlags: ['paused_investing'],
        resultText:
          'You pause the buy. Future-you will negotiate with present-you about this.',
      },
    ],
    tags: ['investing', 'wealth_lever', 'discipline'],
  },

  {
    id: 'loan_consolidation_offer',
    title: 'A Refinancing Window',
    category: 'career',
    phase: 'career',
    art: 'event_loan_consolidation_offer',
    conditions: {
      minAge: 22,
      maxAge: 24,
      phase: 'career',
      requiresFlags: ['took_big_loan'],
    },
    fallbackText:
      'A new salary opens a refinance window on the student loan. Rates moved; the original schedule didn\'t.',
    choices: [
      {
        id: 'accelerated_payoff',
        label: 'Aggressively pay it down',
        effects: { cash: -3000, debt: -3500, stress: 4, discipline: 5 },
        setsFlags: ['debt_warrior'],
        resultText:
          'You throw cash at it. The balance drops; the shoulder weight does too.',
      },
      {
        id: 'consolidate_lower_rate',
        label: 'Consolidate at a lower rate',
        effects: { debt: -800, expenses: -80, stress: -3, discipline: 3 },
        setsFlags: ['consolidated_debt'],
        resultText:
          'You consolidate. The monthly cheque shrinks; the term stays.',
      },
      {
        id: 'minimum_payments',
        label: 'Minimums — divert cash elsewhere',
        effects: { cash: 400, stress: 4, debt: 300 },
        resultText:
          'You stick with minimums. The interest keeps compounding quietly.',
      },
    ],
    tags: ['debt', 'relief', 'pressure'],
  },

  {
    id: 'sabbatical_window',
    title: 'A Quiet Sabbatical',
    category: 'career',
    phase: 'career',
    art: 'event_sabbatical_window',
    conditions: {
      minAge: 24,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_emergency_fund'],
    },
    fallbackText:
      'The buffer you ringfenced last year means you could actually disappear for three months. The question is what you\'d do with the time.',
    choices: [
      {
        id: 'take_real_sabbatical',
        label: 'Take the time and reset',
        effects: {
          cash: -1500,
          assets: -2000,
          salary: -400,
          stress: -12,
          health: 8,
          discipline: 3,
        },
        setsFlags: ['took_sabbatical'],
        resultText:
          'You take the time. You come back lighter, slower in a good way.',
      },
      {
        id: 'self_funded_upskill',
        label: 'Use the months to upskill',
        effects: {
          cash: -1500,
          assets: -1500,
          skill: 10,
          discipline: 5,
          stress: -5,
        },
        setsFlags: ['self_funded_upskill'],
        resultText:
          'You spend the months learning something dense. The skill compounds for years.',
      },
      {
        id: 'bank_it_keep_grinding',
        label: 'Stay — the buffer is for emergencies',
        effects: { discipline: 4, ambition: 3, stress: 4 },
        resultText:
          'You stay. The buffer stays. The ambition does its work.',
      },
    ],
    tags: ['relief', 'health', 'opportunity'],
  },

  {
    id: 'mentor_role_intro',
    title: 'Your Mentor Opens a Door',
    category: 'opportunity',
    phase: 'career',
    art: 'event_mentor_role_intro',
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_mentor'],
    },
    fallbackText:
      'Your mentor floats two roles by you over the same coffee — one inside a stable company, one inside a small founder team they\'re backing.',
    choices: [
      {
        id: 'intro_to_corporate_role',
        label: 'Take the corporate intro',
        effects: { cash: 2000, salary: 1500, network: 5, reputation: 5, ambition: 3 },
        setsFlags: ['mentor_corp_role'],
        resultText:
          'You take the corporate role. The first quarter is faster than expected.',
      },
      {
        id: 'intro_to_founder_role',
        label: 'Take the founder intro',
        effects: {
          cash: 1000,
          salary: 600,
          network: 6,
          ambition: 6,
          riskTolerance: 5,
          stress: 6,
        },
        setsFlags: ['mentor_founder_role'],
        resultText:
          'You join the small team. The work is sharper; the pay is leaner.',
      },
      {
        id: 'decline_keep_path',
        label: 'Decline — keep your own trajectory',
        effects: { discipline: 5, reputation: 3 },
        resultText:
          'You thank your mentor and stay the course. Some doors close gently.',
      },
    ],
    tags: ['network', 'opportunity', 'career_switch'],
  },

  {
    id: 'agency_expansion',
    title: 'First Subcontractor',
    category: 'career',
    phase: 'career',
    art: 'event_agency_expansion',
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_first_client'],
    },
    fallbackText:
      'Demand is outpacing what you can deliver solo. Bringing in help would scale the business; staying solo would keep all of it yours.',
    choices: [
      {
        id: 'hire_subcontractor',
        label: 'Hire a subcontractor',
        effects: {
          cash: -2000,
          salary: 900,
          network: 4,
          reputation: 3,
          stress: 5,
        },
        setsFlags: ['hired_subcontractor'],
        resultText:
          'You bring in a contractor. Your throughput doubles; so does the management overhead.',
      },
      {
        id: 'raise_rates_quietly',
        label: 'Raise rates and protect bandwidth',
        effects: { salary: 700, reputation: 5, riskTolerance: 3 },
        setsFlags: ['premium_pricing'],
        resultText:
          'You raise rates and lose two clients. The remaining ones pay more, ask less.',
      },
      {
        id: 'niche_specialize',
        label: 'Specialize into a niche',
        effects: { skill: 6, salary: 500, reputation: 6 },
        setsFlags: ['niche_specialist'],
        resultText:
          'You drop everything that doesn\'t fit the niche. Pipeline shrinks; quality jumps.',
      },
    ],
    tags: ['career', 'income_lever', 'tradeoff'],
  },

  {
    id: 'studio_launch',
    title: 'From Retainer to Studio',
    category: 'career',
    phase: 'career',
    art: 'event_studio_launch',
    conditions: {
      minAge: 24,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_retainer'],
    },
    fallbackText:
      'The retainer is steady enough that a real studio name on the door starts to feel possible. Once it has a name, it has expectations.',
    choices: [
      {
        id: 'launch_studio',
        label: 'Launch the studio',
        effects: {
          cash: -3000,
          salary: 1500,
          network: 6,
          reputation: 6,
          ambition: 5,
          stress: 10,
        },
        setsFlags: ['has_studio'],
        resultText:
          'You launch under a brand. The first month feels both more legitimate and lonelier.',
      },
      {
        id: 'keep_solo',
        label: 'Stay solo — keep it light',
        effects: { discipline: 5, salary: 500, stress: -2 },
        resultText:
          'You keep the operation light. The retainer keeps paying; you keep your weekends.',
      },
      {
        id: 'take_inhouse_role',
        label: 'Take a senior in-house role',
        effects: {
          salary: 1800,
          network: 5,
          ambition: 4,
          riskTolerance: -3,
        },
        setsFlags: ['went_inhouse'],
        resultText:
          'You join a company at senior. The retainer wraps up; the badge replaces the brand.',
      },
    ],
    tags: ['career_switch', 'opportunity', 'tradeoff'],
  },

  {
    id: 'dropped_out_grit_opportunity',
    title: 'A Door That Likes Your Story',
    category: 'opportunity',
    phase: 'career',
    art: 'event_dropped_out_grit_opportunity',
    weight: 2,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['dropped_out'],
    },
    fallbackText:
      'A founder you met casually knows the story and wants people who chose the unconventional path on purpose. The offer is rough; the equity is real.',
    choices: [
      {
        id: 'join_scrappy_team',
        label: 'Join the scrappy team',
        effects: {
          cash: 1500,
          salary: 1300,
          riskTolerance: 5,
          ambition: 5,
          network: 4,
          stress: 8,
        },
        setsFlags: ['scrappy_team_role', 'has_startup_equity'],
        resultText:
          'You join. The first week breaks one of your assumptions and refines another.',
      },
      {
        id: 'bootstrap_solo',
        label: 'Bootstrap your own thing',
        effects: {
          cash: -1500,
          skill: 8,
          ambition: 7,
          riskTolerance: 6,
          stress: 6,
        },
        setsFlags: ['bootstrap_solo'],
        resultText:
          'You decline and build your own. No salary; full conviction.',
      },
      {
        id: 'take_safer_role',
        label: 'Take the safer offer at a known company',
        effects: { salary: 1200, discipline: 4, reputation: 3 },
        setsFlags: ['safe_corporate_role'],
        resultText:
          'You take the known company instead. The path lights up; the ceiling lowers a notch.',
      },
    ],
    tags: ['career_switch', 'risk', 'identity'],
  },

  {
    id: 'finished_degree_consulting_role',
    title: 'A Consulting Pipeline Opens',
    category: 'opportunity',
    phase: 'career',
    art: 'event_finished_degree_consulting_role',
    weight: 2,
    conditions: {
      minAge: 22,
      maxAge: 23,
      phase: 'career',
      requiresFlags: ['finished_degree'],
    },
    fallbackText:
      'The credential turns out to matter more than expected — three consulting firms reach out about the same role within a month.',
    choices: [
      {
        id: 'top_tier_offer',
        label: 'Accept the top-tier firm',
        effects: {
          cash: 3000,
          salary: 2200,
          network: 6,
          reputation: 5,
          stress: 12,
          ambition: 4,
        },
        setsFlags: ['top_consulting_role'],
        resultText:
          'You sign at the brand-name firm. The hours are real; the network is irreplaceable.',
      },
      {
        id: 'boutique_firm',
        label: 'Join the boutique with better culture',
        effects: {
          cash: 1500,
          salary: 1700,
          network: 5,
          reputation: 4,
          stress: 6,
        },
        setsFlags: ['boutique_consulting_role'],
        resultText:
          'You take the boutique. Less prestige; more interesting work.',
      },
      {
        id: 'decline_for_independence',
        label: 'Decline — go independent',
        effects: { ambition: 6, riskTolerance: 5, salary: 400 },
        setsFlags: ['independent_consultant'],
        resultText:
          'You decline all three. The first invoice you cut to a client lands six weeks later.',
      },
    ],
    tags: ['career_switch', 'opportunity', 'income_lever'],
  },

  {
    id: 'inflated_lifestyle_trap',
    title: 'The Lifestyle Catches Up',
    category: 'pressure',
    phase: 'career',
    art: 'event_inflated_lifestyle_trap',
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['inflated_lifestyle'],
    },
    fallbackText:
      'The newer apartment, the routine subscriptions, the cheaper-than-it-feels habit of upgrading — the income arrives and gets absorbed before it lands.',
    choices: [
      {
        id: 'cut_back_hard',
        label: 'Cut the burn hard',
        effects: { expenses: -300, stress: 6, discipline: 6, ambition: 3 },
        setsFlags: ['lifestyle_reset'],
        resultText:
          'You cut three subscriptions and the gym. The runway lengthens; the social life shortens.',
      },
      {
        id: 'earn_through_the_gap',
        label: 'Earn through the gap instead',
        effects: { salary: 700, stress: 10, health: -5, ambition: 3 },
        resultText:
          'You take more on. The number grows; so does the cortisol.',
      },
      {
        id: 'accept_golden_handcuffs',
        label: 'Accept it — that\'s the cost of living',
        effects: { expenses: 100, ambition: -3, stress: 3 },
        setsFlags: ['golden_handcuffs'],
        resultText:
          'You stop fighting it. The lifestyle becomes the floor.',
      },
    ],
    tags: ['lifestyle', 'pressure', 'discipline'],
  },

  {
    id: 'burnout_relapse_warning',
    title: 'Same Pattern, Different Year',
    category: 'pressure',
    phase: 'career',
    art: 'event_burnout_relapse_warning',
    priority: 4,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['burnout_warned'],
      stats: { stress: '>=40' },
    },
    fallbackText:
      'The early-warning signs you got two years ago are back. Different stage, different stakes — same pattern in the body.',
    choices: [
      {
        id: 'real_break_this_time',
        label: 'Take a real break this time',
        effects: {
          cash: -1500,
          salary: -300,
          stress: -12,
          health: 8,
          discipline: 5,
        },
        setsFlags: ['took_career_break'],
        resultText:
          'You take the time and tell people why. The shame lifts faster than expected.',
      },
      {
        id: 'therapy_and_systems',
        label: 'Therapy and a better system',
        effects: {
          cash: -2000,
          expenses: 80,
          stress: -8,
          health: 5,
          discipline: 6,
        },
        setsFlags: ['has_therapist'],
        resultText:
          'You start seeing someone. You don\'t solve it; you start understanding it.',
      },
      {
        id: 'ignore_again',
        label: 'Ignore it again — there\'s no time',
        effects: { stress: 10, health: -10, ambition: 3 },
        setsFlags: ['chronic_burnout'],
        resultText:
          'You push past it. Something quiet erodes that you\'ll feel later.',
      },
    ],
    tags: ['health', 'pressure', 'priority'],
  },

  {
    id: 'bigco_alumni_referral',
    title: 'Alumni Referral',
    category: 'opportunity',
    phase: 'career',
    art: 'event_bigco_alumni_referral',
    weight: 2,
    conditions: {
      minAge: 22,
      maxAge: 24,
      phase: 'career',
      requiresFlags: ['interned_bigco'],
    },
    fallbackText:
      'Someone from your internship reaches out about a senior IC opening at a peer firm. They\'ve already put your name in.',
    choices: [
      {
        id: 'accept_senior_ic',
        label: 'Accept the senior role',
        effects: {
          cash: 4000,
          salary: 2000,
          network: 5,
          reputation: 5,
          ambition: 4,
          stress: 6,
        },
        setsFlags: ['senior_ic_role'],
        resultText:
          'You sign. The offer arrives, gets countered, gets signed.',
      },
      {
        id: 'counter_for_lead',
        label: 'Counter for the lead role',
        effects: {
          cash: 5000,
          salary: 2500,
          network: 6,
          reputation: 6,
          stress: 10,
          ambition: 5,
        },
        setsFlags: ['lead_role'],
        resultText:
          'You push for the lead title. They blink; you sign at a number you didn\'t expect.',
      },
      {
        id: 'decline_keep_current',
        label: 'Decline — stay where you are',
        effects: { discipline: 4, reputation: 3 },
        resultText:
          'You decline politely. The relationship stays warm; the leverage stays in your pocket.',
      },
    ],
    tags: ['career', 'income_lever', 'opportunity'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // LEANING CHAINS — gated on leaning_* flags, weight 2 so the directional
  // event dominates the pool when present. Cross-direction is still reachable
  // through the universal core (startup_offer, mentor_role_intro, etc.).
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'corporate_leadership_offer',
    title: 'Director Track',
    category: 'career',
    phase: 'career',
    art: 'event_corporate_leadership_offer',
    weight: 2,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['leaning_corporate'],
    },
    fallbackText:
      'A director-level position opens above you. Taking it means leading people; passing it means staying technical for another two years.',
    choices: [
      {
        id: 'accept_director',
        label: 'Step up to director',
        effects: {
          salary: 2500,
          stress: 12,
          ambition: 5,
          reputation: 6,
          network: 4,
        },
        setsFlags: ['director_track'],
        resultText:
          'You take the role. Your calendar refills with people-work; the work you used to do moves to others.',
      },
      {
        id: 'take_lateral_easier',
        label: 'Take a lateral move to a better team',
        effects: { salary: 800, stress: -3, network: 4, discipline: 3 },
        setsFlags: ['lateral_moved'],
        resultText:
          'You move sideways. New manager, calmer pace, better leverage.',
      },
      {
        id: 'stay_specialist',
        label: 'Stay deep on the craft',
        effects: { skill: 10, salary: 400, discipline: 5 },
        setsFlags: ['deep_ic'],
        resultText:
          'You stay technical. The promotion lane stays open; the specialization gets sharper.',
      },
    ],
    tags: ['career', 'leaning_corporate', 'income_lever'],
  },

  {
    id: 'founder_scaling_decision',
    title: 'Scale the Side Business',
    category: 'career',
    phase: 'career',
    art: 'event_founder_scaling_decision',
    weight: 2,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['has_side_business', 'leaning_founder'],
    },
    fallbackText:
      'The side business is past the side-business size. Going full-time means leaving the salary; staying part-time means capping the thing.',
    choices: [
      {
        id: 'go_full_time_founder',
        label: 'Quit and go full-time',
        effects: {
          cash: -3000,
          salary: -1800,
          ambition: 8,
          riskTolerance: 7,
          stress: 12,
        },
        setsFlags: ['full_time_founder'],
        resultText:
          'You hand in notice. The runway counter starts.',
      },
      {
        id: 'hire_first_employee',
        label: 'Hire your first employee',
        effects: {
          cash: -4000,
          salary: 600,
          network: 5,
          reputation: 5,
          stress: 8,
        },
        setsFlags: ['has_employee'],
        resultText:
          'You hire your first person. Your time gets bought back; your overhead grows.',
      },
      {
        id: 'keep_lifestyle_business',
        label: 'Keep it as a lifestyle business',
        effects: { cash: 1500, salary: 700, discipline: 4, ambition: -3 },
        setsFlags: ['lifestyle_business'],
        resultText:
          'You decide it\'s good enough as it is. The growth ceiling is the lid you wanted.',
      },
    ],
    tags: ['career_switch', 'leaning_founder', 'tradeoff'],
  },

  {
    id: 'independent_brand_launch',
    title: 'Launch a Personal Brand',
    category: 'career',
    phase: 'career',
    art: 'event_independent_brand_launch',
    weight: 2,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      requiresFlags: ['leaning_independent'],
    },
    fallbackText:
      'The independent work compounds when there\'s a name attached to it. Putting yourself out there in public would compound it faster — and expose you in public, too.',
    choices: [
      {
        id: 'go_public',
        label: 'Build a real audience in public',
        effects: {
          cash: -500,
          salary: 900,
          network: 7,
          reputation: 6,
          stress: 8,
        },
        setsFlags: ['public_brand'],
        resultText:
          'You start publishing seriously. The first wave of inbound takes six months; then it doesn\'t stop.',
      },
      {
        id: 'quiet_brand',
        label: 'Build a quiet, referral-only brand',
        effects: { salary: 500, reputation: 5, discipline: 4, network: 3 },
        setsFlags: ['referral_brand'],
        resultText:
          'You stay quiet and let referrals do the work. Slower, calmer, sustainable.',
      },
      {
        id: 'pass_stay_anonymous',
        label: 'Pass — keep the work anonymous',
        effects: { discipline: 3, stress: -2 },
        resultText:
          'You stay invisible. The work stays good; the leverage stays small.',
      },
    ],
    tags: ['career', 'leaning_independent', 'reputation'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CROSS-PULL (stat-gated, no leaning required) — flag-poor paths like
  // straight_to_work can reach a founder/independent opportunity once they
  // build network, without ever needing a foundation flag chain.
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'universal_cross_pull',
    title: 'A Builder Wants a Partner',
    category: 'opportunity',
    phase: 'career',
    art: 'event_universal_cross_pull',
    conditions: {
      // network 22 is reachable for every path (incl. straight_to_work) by
      // mid-career through normal events — keeps the gate real without
      // locking out the flag-poor origins.
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      stats: { network: '>=22' },
    },
    fallbackText:
      'Someone you barely know — friend of a friend, the kind of room you wandered into — pitches you a small thing they\'re building. They want a partner, not an employee. You can step in equity-light, go all-in for a real stake, or pass and stay where you are.',
    choices: [
      {
        id: 'partner_light',
        label: 'Take a part-time partner role',
        effects: {
          cash: -500,
          salary: 400,
          skill: 5,
          network: 5,
          ambition: 4,
          stress: 5,
        },
        setsFlags: ['cross_pull_partner_light', 'has_startup_equity'],
        resultText:
          'You take the part-time stake. The work is sharper than your day job; the calendar gets full.',
      },
      {
        id: 'partner_full',
        label: 'Quit and go all-in on it',
        effects: {
          cash: -2000,
          salary: -1200,
          ambition: 8,
          riskTolerance: 8,
          network: 6,
          stress: 10,
        },
        setsFlags: ['cross_pull_full', 'full_time_founder', 'has_startup_equity'],
        resultText:
          'You quit and sign. The runway clock starts the day you do.',
      },
      {
        id: 'pass_keep_track',
        label: 'Pass — stay on the current track',
        effects: { discipline: 4, reputation: 3 },
        resultText:
          'You decline politely. The relationship stays warm; the leverage stays in your pocket.',
      },
    ],
    tags: ['opportunity', 'cross_pull', 'career_switch'],
  },

  // ───────────────────────────────────────────────────────────────────────
  // CAREER LAYOFF — income shock for the genuinely employed. Two sibling
  // records: one for players with the emergency fund (soft-landing branch
  // consumes assets), one without (hustle branch costs stress and debt).
  // forbidsFlags include chronic_burnout / full_time_founder so this never
  // piles onto an already-fragile state.
  // ───────────────────────────────────────────────────────────────────────

  {
    id: 'career_layoff_with_fund',
    title: 'Reorg',
    category: 'pressure',
    phase: 'career',
    art: 'event_career_layoff_with_fund',
    priority: 4,
    conditions: {
      // Salary/cash floor is high enough that the shock can't fall on a
      // freshly-transitioned player still finding their footing in career.
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      stats: { salary: '>=2200', cash: '>=3500' },
      requiresFlags: ['has_emergency_fund'],
      forbidsFlags: [
        'had_layoff',
        'chronic_burnout',
        'full_time_founder',
      ],
    },
    fallbackText:
      'The all-hands ends with three names. Yours is one of them. The severance is generous; the calendar is suddenly your own.',
    choices: [
      {
        id: 'severance_runway',
        label: 'Take the severance, find a similar role',
        effects: { cash: 4000, salary: -500, stress: 3, discipline: 3 },
        setsFlags: ['had_layoff', 'laid_off_severance'],
        resultText:
          'You take the cheque and don\'t rush. The right offer finds you within a quarter; the new title is similar, the pay slightly off.',
      },
      {
        id: 'pivot_freelance',
        label: 'Use the moment to go freelance',
        effects: {
          cash: 2000,
          salary: -200,
          ambition: 5,
          riskTolerance: 5,
          reputation: 3,
          stress: 4,
        },
        setsFlags: ['had_layoff', 'went_freelance_after_layoff'],
        resultText:
          'You take the smaller severance and open for contract work. Within weeks you bill close to your old number — on your terms.',
      },
      {
        id: 'lean_on_fund',
        label: 'Lean on the emergency fund and rebuild quietly',
        effects: {
          cash: 1500,
          salary: -600,
          assets: -2500,
          stress: -2,
          health: 4,
          discipline: 4,
        },
        setsFlags: ['had_layoff', 'used_emergency_fund'],
        resultText:
          'You tap the buffer you set aside last year. The cushion bends; nothing breaks. You take a smaller role and your evenings back.',
      },
    ],
    tags: ['pressure', 'income_shock', 'priority'],
  },

  {
    id: 'career_layoff_no_fund',
    title: 'Reorg',
    category: 'pressure',
    phase: 'career',
    art: 'event_career_layoff_no_fund',
    priority: 4,
    conditions: {
      minAge: 23,
      maxAge: 25,
      phase: 'career',
      stats: { salary: '>=2200', cash: '>=3500' },
      forbidsFlags: [
        'had_layoff',
        'has_emergency_fund',
        'chronic_burnout',
        'full_time_founder',
      ],
    },
    fallbackText:
      'The all-hands ends with three names. Yours is one of them. The severance is decent; nothing on the side to catch you.',
    choices: [
      {
        id: 'severance_runway',
        label: 'Take the severance and find a similar role',
        effects: { cash: 4000, salary: -500, stress: 4, discipline: 3 },
        setsFlags: ['had_layoff', 'laid_off_severance'],
        resultText:
          'You take the cheque and try not to rush. The new role lands within a quarter, slightly off the old number.',
      },
      {
        id: 'pivot_freelance',
        label: 'Use the moment to go freelance',
        effects: {
          cash: 2000,
          salary: -200,
          ambition: 5,
          riskTolerance: 5,
          reputation: 3,
          stress: 5,
        },
        setsFlags: ['had_layoff', 'went_freelance_after_layoff'],
        resultText:
          'You take the smaller severance and open for contract work. The first invoice clears six weeks later.',
      },
      {
        id: 'hustle_cover_gap',
        label: 'Hustle through the gap',
        effects: {
          cash: 1500,
          salary: -300,
          debt: 800,
          stress: 6,
          discipline: 4,
        },
        setsFlags: ['had_layoff', 'hustled_through_layoff'],
        resultText:
          'You take the cheque, take side work, take it on the chin. The runway holds — barely.',
      },
    ],
    tags: ['pressure', 'income_shock', 'priority'],
  },
];
