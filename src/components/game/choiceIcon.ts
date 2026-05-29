import type { StatKey } from '../../types/events';
import type { StatGlyphName } from '../visual/StatGlyph';

const STAT_TO_GLYPH: Record<StatKey, StatGlyphName> = {
  cash: 'trendingUp',
  debt: 'bolt',
  salary: 'trendingUp',
  expenses: 'bolt',
  investments: 'trendingUp',
  assets: 'star',
  passiveIncome: 'trendingUp',
  skill: 'wrench',
  network: 'network',
  reputation: 'star',
  discipline: 'target',
  riskTolerance: 'bolt',
  ambition: 'bolt',
  stress: 'bolt',
  health: 'star',
};

export function glyphForEffects(
  effects: Partial<Record<StatKey, number>>,
): StatGlyphName | null {
  let bestKey: StatKey | null = null;
  let bestMag = -Infinity;
  for (const k of Object.keys(effects) as StatKey[]) {
    const v = effects[k];
    if (v == null) continue;
    const mag = Math.abs(v);
    if (mag > bestMag) {
      bestMag = mag;
      bestKey = k;
    }
  }
  return bestKey ? STAT_TO_GLYPH[bestKey] : null;
}
