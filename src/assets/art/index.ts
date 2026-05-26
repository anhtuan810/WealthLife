// Maps asset key → static require. Add one line per delivered PNG.
// Metro can't require() a dynamic string path, so each PNG needs an explicit
// entry here. Until a key has an entry, ArtSlot renders its procedural placeholder.
export const ART: Record<string, number> = {
  'start_hero': require('./start_hero.png'),
  'event_first_tuition_bill': require('./event_first_tuition_bill.png'),
  'event_first_brokerage': require('./event_first_brokerage.png'),
  'event_loan_repayment_notice': require('./event_loan_repayment_notice.png'),
};

export const hasArt = (key?: string): boolean => !!key && key in ART;
