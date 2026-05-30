// One-shot rewrite: wraps money-field literals in foundation event
// effects/onLapse blocks with $$(...) from economyScale.ts. Run once per
// scale change; idempotent (won't re-wrap already-$$ values).
//
// Only foundationEvents.ts is touched — career, growth, and freedom
// events are designed for adult-scale dollar amounts and stay as-is.
//
// Run via:  npx tsc -p tsconfig.sim.json && node .sim-build/scripts/applyEconomyScale.js

declare const console: { log: (...args: unknown[]) => void };
declare const process: { argv: string[]; exit: (n: number) => never; cwd: () => string };
declare const require: (id: string) => unknown;

const fs = require('fs') as {
  readFileSync: (p: string, enc: string) => string;
  writeFileSync: (p: string, c: string) => void;
};

const TARGETS = [
  'src/content/events/foundationEvents.ts',
];

// MONEY_FIELDS are the only effect keys we rescale — they're what shapes
// the dollar scale at age 22/26 derivation time. Strength deltas and
// stress/health stay absolute. `investments`, `assets`, `liabilities`,
// and `passiveIncome` are dollar-denominated too — leaving them at 1×
// while cash flows scale 7× breaks the freedom ratio (passive / expenses).
const MONEY_FIELDS = [
  'cash',
  'debt',
  'salary',
  'expenses',
  'investments',
  'assets',
  'liabilities',
  'passiveIncome',
];

const IMPORT_LINE = "import { $$ } from '../../data/economyScale';";

let totalRewrites = 0;
const summary: string[] = [];

for (const rel of TARGETS) {
  const path = `${process.cwd()}/${rel}`;
  let src = fs.readFileSync(path, 'utf8');

  // Add import after the existing import block if not present.
  if (!src.includes("from '../../data/economyScale'")) {
    src = src.replace(
      /(^import .+;\s*\n)+/m,
      (block) => block + IMPORT_LINE + '\n',
    );
  }

  let rewrites = 0;
  for (const field of MONEY_FIELDS) {
    // Match `field: <number>` where <number> may be negative and may
    // contain underscores. Skip lines where the value is ALREADY wrapped
    // in $$(...).
    const re = new RegExp(`(${field}:\\s*)(-?\\d[\\d_]*)`, 'g');
    src = src.replace(re, (full, prefix, num) => {
      // Idempotency guard — don't double-wrap.
      // If the char immediately after the match is "(", we already wrapped.
      // (We can't easily check the preceding char, so we re-check below.)
      rewrites++;
      // Negative-number handling: $$(-200) is fine arithmetically.
      return `${prefix}$$(${num})`;
    });
    // Now strip any accidental double-wraps from a previous run.
    const doubleWrap = new RegExp(
      `(${field}:\\s*)\\$\\$\\(\\s*\\$\\$\\((-?\\d[\\d_]*)\\)\\s*\\)`,
      'g',
    );
    src = src.replace(doubleWrap, (_full, prefix, num) => {
      rewrites--; // we counted +1 for the outer wrap; undo it
      return `${prefix}$$(${num})`;
    });
  }

  fs.writeFileSync(path, src);
  totalRewrites += rewrites;
  summary.push(`  ${rel}: ${rewrites} money-literal wrap(s) applied`);
}

console.log('# economy-scale wrapper applied');
for (const line of summary) console.log(line);
console.log(`  total: ${totalRewrites}`);
