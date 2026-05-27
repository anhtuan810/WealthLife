// Maps asset key → static require. Add one line per delivered PNG.
// Metro can't require() a dynamic string path, so each PNG needs an explicit
// entry here. Until a key has an entry, ArtSlot renders its procedural placeholder.
export const ART: Record<string, number> = {
  'start_hero': require('./start_hero.png'),
  'event_acquihire_offer': require('./event_acquihire_offer.png'),
  'event_burnout_recovery_event': require('./event_burnout_recovery_event.png'),
  'event_corporate_leadership_offer': require('./event_corporate_leadership_offer.png'),
  'event_drop_out_decision': require('./event_drop_out_decision.png'),
  'event_dropped_out_grit_opportunity': require('./event_dropped_out_grit_opportunity.png'),
  'event_etf_recurring_uplift': require('./event_etf_recurring_uplift.png'),
  'event_find_mentor': require('./event_find_mentor.png'),
  'event_finished_degree_consulting_role': require('./event_finished_degree_consulting_role.png'),
  'event_first_brokerage': require('./event_first_brokerage.png'),
  'event_first_tuition_bill': require('./event_first_tuition_bill.png'),
  'event_founder_scaling_decision': require('./event_founder_scaling_decision.png'),
  'event_independent_brand_launch': require('./event_independent_brand_launch.png'),
  'event_loan_consolidation_offer': require('./event_loan_consolidation_offer.png'),
  'event_loan_repayment_notice': require('./event_loan_repayment_notice.png'),
  'event_major_choice': require('./event_major_choice.png'),
  'event_market_dip_buy': require('./event_market_dip_buy.png'),
  'event_mentor_role_intro': require('./event_mentor_role_intro.png'),
  'event_mentor_warm_intro': require('./event_mentor_warm_intro.png'),
  'event_networking_event': require('./event_networking_event.png'),
  'event_promotion_review': require('./event_promotion_review.png'),
  'event_scholarship_offer': require('./event_scholarship_offer.png'),
  'event_side_project_milestone': require('./event_side_project_milestone.png'),
  'event_side_project_window': require('./event_side_project_window.png'),
  'event_startup_offer': require('./event_startup_offer.png'),
  'event_universal_cross_pull': require('./event_universal_cross_pull.png'),
  'event_whats_next': require('./event_whats_next.png'),
  'identity_medallion': require('./identity_medallion.png'),
  'phase_career': require('./phase_career.png'),
};

export const hasArt = (key?: string): boolean => !!key && key in ART;
