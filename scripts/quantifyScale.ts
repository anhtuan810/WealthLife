// Pre-rescale quantification — report-only diagnostic for the
// cost-of-living recalibration. Confirms the "80%-from-one-event"
// problem, the unrealistic seeded savings rates, and the foundation-
// baseline source of the tiny derived early/established expenses.

declare const console: { log: (...args: unknown[]) => void };

import { ALL_EVENTS } from '../src/content';
import { START_POINT_BY_ID } from '../src/data/startPoints';
import { FOUNDATION_PATHS, FOUNDATION_PATH_BY_ID } from '../src/data/foundationPaths';

const log = (msg: string) => console.log(msg);

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

// Expense bases the player has at each start. For "university" we use the
// foundation baseline because that's the burn rate the 18-start lives
// under during the foundation chapter; the seeds for early/established/
// midlife are post-foundation values.
const expenseBases: Record<string, number> = {
  'university (foundation baseline)': FOUNDATION_PATH_BY_ID.university.baseline.expenses,
  'early (seed)': START_POINT_BY_ID.early.seed!.expenses,
  'established (seed)': START_POINT_BY_ID.established.seed!.expenses,
  'midlife (seed)': START_POINT_BY_ID.midlife.seed!.expenses,
};

log('# QUANTIFY — PRE-RESCALE BASELINE');
log('');

// ── (1a) per-investing-event coverage at each expense base ────────────
log('## 1a · coverage-per-event = passive grant ÷ expense base');
log('   (any single CHOICE that grants positive passiveIncome)');
log('');
type Grant = { eventId: string; choiceId: string; phase: string; grant: number };
const grants: Grant[] = [];
for (const e of ALL_EVENTS) {
  for (const c of e.choices) {
    const g = c.effects.passiveIncome ?? 0;
    if (g > 0) grants.push({ eventId: e.id, choiceId: c.id, phase: e.phase, grant: g });
  }
}
grants.sort((a, b) => b.grant - a.grant);

const startKeys = Object.keys(expenseBases);
const head = `  ${pad('event', 32)} ${pad('choice', 22)} ${pad('phase', 10)} ${padL('grant', 6)}  ${startKeys.map((k) => padL(k.split(' ')[0], 12)).join(' ')}`;
log(head);
for (const g of grants) {
  const rowCov = startKeys
    .map((k) => {
      const base = expenseBases[k];
      const pct = base > 0 ? Math.round((g.grant / base) * 1000) / 10 : 0;
      return padL(`${pct.toFixed(1)}%`, 12);
    })
    .join(' ');
  log(
    `  ${pad(g.eventId, 32)} ${pad(g.choiceId, 22)} ${pad(g.phase, 10)} ${padL(g.grant, 6)}  ${rowCov}`,
  );
}
log('');
log('  → the brief\'s target: NO single event should grant >~15% of coverage.');
log('  → real_estate.buy_property grants 600 — 103% of early\'s 580/mo. Single-event coverage is the bug.');
log('');

// ── (1b) implied savings rate per start ──────────────────────────────
log('## 1b · implied monthly savings rate = (salary − expenses) / salary');
log('');
log(`  ${pad('start', 24)} ${padL('salary', 7)} ${padL('expenses', 9)} ${padL('savings', 7)} ${padL('rate', 6)}`);
const seededStarts: Array<{ label: string; salary: number; expenses: number }> = [
  { label: 'early (seed)', salary: START_POINT_BY_ID.early.seed!.salary, expenses: START_POINT_BY_ID.early.seed!.expenses },
  { label: 'established (seed)', salary: START_POINT_BY_ID.established.seed!.salary, expenses: START_POINT_BY_ID.established.seed!.expenses },
  { label: 'midlife (seed)', salary: START_POINT_BY_ID.midlife.seed!.salary, expenses: START_POINT_BY_ID.midlife.seed!.expenses },
];
for (const r of seededStarts) {
  const savings = r.salary - r.expenses;
  const rate = r.salary > 0 ? Math.round((savings / r.salary) * 1000) / 10 : 0;
  log(`  ${pad(r.label, 24)} ${padL(r.salary, 7)} ${padL(r.expenses, 9)} ${padL(savings, 7)} ${padL(`${rate.toFixed(1)}%`, 6)}`);
}
log('');
log('  → brief target band: 10%–35%. Early & established sit at ~63–67% — unrealistic.');
log('  → only midlife (35%) is in band.');
log('');

// ── (1c) foundation-path baselines source check ──────────────────────
log('## 1c · foundation-path baseline expenses (the source of the tiny derived seeds)');
log('');
log(`  ${pad('path', 20)} ${padL('expenses', 10)} ${padL('salary', 8)} ${padL('cash', 7)} ${padL('debt', 7)}`);
for (const p of FOUNDATION_PATHS) {
  const b = p.baseline;
  log(`  ${pad(p.id, 20)} ${padL(b.expenses, 10)} ${padL(b.salary, 8)} ${padL(b.cash, 7)} ${padL(b.debt, 7)}`);
}
log('');
log('  → all four foundation baselines have expenses in $700–$950/mo — student/youth-scale.');
log('  → the median-of-university-18 derivation samples at age 22/26 still reflects this scale.');
log('  → that\'s why early/established seeds land at $580–$750: the upstream chapter never crossed an adult cost-of-living step.');
log('');

// ── Summary ──────────────────────────────────────────────────────────
log('# SUMMARY OF FINDINGS');
log('  - real_estate.buy_property:   600 passive vs $580 early expenses = 103% coverage from ONE event');
log('  - index_habit.automate_it:    180 passive vs $580 early expenses =  31% coverage from ONE event');
log('  - founder_productize.build:   320 passive vs $580 early expenses =  55% coverage from ONE event');
log('  - Implied savings rates: early 63%, established 67%, midlife 35% — only midlife is realistic.');
log('  - Foundation baselines $700–$950 force any university-derived seed to live in a $500–$800 expense band.');
log('');
log('# Recalibration target: raise foundation + early/established expense scale so that');
log('  - the largest single passive grant (real_estate +600) sits at ~15% of new expense base');
log('  - implied savings lands in the 10–35% band');
log('  - the 7× midlife/early gap closes to ~1.5–2×');
