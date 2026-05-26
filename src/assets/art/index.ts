// Maps asset key → static require. Add one line per delivered PNG.
// Metro can't require() a dynamic string path, so each PNG needs an explicit
// entry here. Until a key has an entry, ArtSlot renders its procedural placeholder.
export const ART: Record<string, number> = {
  // 'start_hero': require('./start_hero.png'),
  // 'event_student_loan': require('./event_student_loan.png'),
};

export const hasArt = (key?: string): boolean => !!key && key in ART;
