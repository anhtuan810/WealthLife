// Freedom-coverage sweep. Reporting tool — no engine changes.
//
// For each target age in {40, 45, 50, 55, 60}, run 4 paths × 3 seeds and
// print the terminal freedom coverage distribution (min/median/max,
// 3-decimal raw passiveIncome/expenses ratio) plus the grade-letter
// histogram (scored under the current shipped grade.ts defaults, i.e. the
// fixed 0.65 freedom bar).
//
// Run: npm run sim:freedom-coverage

import { FOUNDATION_PATHS } from '../src/data/foundationPaths';
import { POLICIES } from '../src/sim/policies';
import { driveRun, type RunRow } from '../src/sim/perPathReport';
import type { GradeLetter } from '../src/systems/grade';

declare const console: { log: (...args: unknown[]) => void };

const TARGET_AGES = [40, 45, 50, 55, 60] as const;
const SEEDS = [101, 202, 303] as const;

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const frac = pos - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

function emptyHist(): Record<GradeLetter, number> {
  return { S: 0, A: 0, B: 0, C: 0, D: 0 };
}

function pad(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : str + ' '.repeat(w - str.length);
}
function padL(s: string | number, w: number): string {
  const str = String(s);
  return str.length >= w ? str : ' '.repeat(w - str.length) + str;
}

// --- run the sweep -------------------------------------------------------

type PerTargetBucket = {
  target: number;
  rows: RunRow[];
};

const buckets: PerTargetBucket[] = [];
for (const target of TARGET_AGES) {
  const rows: RunRow[] = [];
  for (const path of FOUNDATION_PATHS) {
    for (let i = 0; i < SEEDS.length; i++) {
      // Round-robin policy across seeds to mirror runReport's playstyle mix,
      // and reuse the same seed↔policy pairing across paths so paths are
      // compared on equal terms.
      const policy = POLICIES[i % POLICIES.length];
      const row = driveRun(path.id, SEEDS[i], policy, undefined, target);
      rows.push(row);
    }
  }
  buckets.push({ target, rows });
}

// --- print ---------------------------------------------------------------

const lines: string[] = [];
lines.push('## FREEDOM-COVERAGE SWEEP');
lines.push('# coverage = passiveIncome / expenses at terminal (UNCLAMPED, 3dp)');
lines.push('# grade scored under shipped grade.ts defaults (fixed 0.65 bar)');
lines.push(`# 4 paths × ${SEEDS.length} seeds per target = ${FOUNDATION_PATHS.length * SEEDS.length} runs/target`);
lines.push('');

// Per-target summary table.
lines.push(
  `  ${pad('target', 7)} ${padL('n', 4)}   ${padL('min', 7)} ${padL('median', 8)} ${padL('max', 7)}    ${padL('S', 4)} ${padL('A', 4)} ${padL('B', 4)} ${padL('C', 4)} ${padL('D', 4)}`,
);
for (const b of buckets) {
  const covs = b.rows.map((r) => r.freedomCoverage).sort((a, c) => a - c);
  const hist = emptyHist();
  for (const r of b.rows) hist[r.gradeLetter] += 1;
  const min = covs[0] ?? 0;
  const max = covs[covs.length - 1] ?? 0;
  const med = quantile(covs, 0.5);
  lines.push(
    `  ${pad(b.target, 7)} ${padL(b.rows.length, 4)}   ${padL(min.toFixed(3), 7)} ${padL(med.toFixed(3), 8)} ${padL(max.toFixed(3), 7)}    ${padL(hist.S, 4)} ${padL(hist.A, 4)} ${padL(hist.B, 4)} ${padL(hist.C, 4)} ${padL(hist.D, 4)}`,
  );
}
lines.push('');

// Per-target per-row detail — useful for spotting which (path, seed)
// combinations sit above vs. below the 0.65 bar.
for (const b of buckets) {
  lines.push(`### target=${b.target}`);
  lines.push(
    `  ${pad('path', 18)} ${padL('seed', 5)} ${pad('policy', 22)} ${padL('months', 7)} ${padL('coverage', 9)} ${padL('grade', 6)} ${padL('score', 6)}`,
  );
  for (const r of b.rows) {
    lines.push(
      `  ${pad(r.path, 18)} ${padL(r.seed, 5)} ${pad(r.policy, 22)} ${padL(r.monthsPlayed, 7)} ${padL(r.freedomCoverage.toFixed(3), 9)} ${padL(r.gradeLetter, 6)} ${padL(r.gradeScore, 6)}`,
    );
  }
  lines.push('');
}

// eslint-disable-next-line no-console
console.log(lines.join('\n'));
