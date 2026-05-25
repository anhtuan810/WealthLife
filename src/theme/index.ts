import { colors } from './colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  hero: 72,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 3.2,
  },
  hero: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 1.4,
  },
} as const;

export const motion = {
  fast: 180,
  base: 280,
  slow: 520,
  ambient: 4200,
} as const;

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  motion,
} as const;

export { colors } from './colors';
export type Theme = typeof theme;
