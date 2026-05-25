/**
 * WealthLife color palette — premium dark.
 * Near-black foundation, layered with warm accent and cool capital tones.
 */
export const colors = {
  bg: '#08090B',
  bgElev: '#0E1014',
  surface: '#14171C',
  surfaceElev: '#1B1F26',
  border: '#23272F',
  borderSoft: '#1A1D23',

  textPrimary: '#F5F2EA',
  textSecondary: 'rgba(245, 242, 234, 0.66)',
  textMuted: 'rgba(245, 242, 234, 0.38)',
  textFaint: 'rgba(245, 242, 234, 0.18)',

  accent: '#D9B26A',
  accentBright: '#F1CC83',
  accentSoft: 'rgba(217, 178, 106, 0.18)',
  accentGlow: 'rgba(217, 178, 106, 0.35)',

  capital: '#7CB8FF',
  capitalSoft: 'rgba(124, 184, 255, 0.18)',

  positive: '#7BD389',
  negative: '#E27272',
  pressure: '#E2A572',
} as const;

export type ColorToken = keyof typeof colors;
