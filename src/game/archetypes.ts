export type ArchetypeId = 'corporate' | 'founder' | 'freelancer';

export type Archetype = {
  id: ArchetypeId;
  name: string;
  vibe: string;
  traits: string[];
};

export const ARCHETYPES: readonly Archetype[] = [
  {
    id: 'corporate',
    name: 'Corporate Climber',
    vibe: 'Steady paycheck, ambitious ladder.',
    traits: ['Stable income', 'Burnout risk', 'Network access'],
  },
  {
    id: 'founder',
    name: 'Startup Founder',
    vibe: 'High variance bets for asymmetric upside.',
    traits: ['Equity heavy', 'Cash poor', 'Volatile stress'],
  },
  {
    id: 'freelancer',
    name: 'Freelancer',
    vibe: 'Own your time, hunt every month.',
    traits: ['Flexible hours', 'Income gaps', 'Skill compounding'],
  },
] as const;
