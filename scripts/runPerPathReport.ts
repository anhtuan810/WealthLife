// CLI entry for the per-path sim. Runs the sim twice (with the new content
// excluded for the baseline, then with it included) so the content-effect
// section can show a clean before/after diff. Then prints the existing
// summary tables, the combined-grade preview, and a widened reference run.
//
// Run with: npm run sim:per-path
// Optional: SEEDS=40 npm run sim:per-path
// Optional: SEED_BASE=100 npm run sim:per-path

import { FOUNDATION_PATHS } from '../src/data/foundationPaths';
import {
  NEW_CONTENT_EVENT_IDS,
  printCombinedGradePreview,
  printContentEffect,
  printReferenceRunAllPaths,
  printReport,
  printRescoreGrid,
  runReport,
} from '../src/sim/perPathReport';

// Minimal node `process` shim — keeps tsconfig.sim.json free of @types/node.
declare const process: { env: Record<string, string | undefined> };

const seedsEnv = process.env.SEEDS ? Number(process.env.SEEDS) : undefined;
const seedBaseEnv = process.env.SEED_BASE ? Number(process.env.SEED_BASE) : undefined;

// Before: same seeds + same policies, but with the prompt-7.3 events
// excluded from the eligible pool. Lets us read the content delta clean.
const before = runReport({
  seeds: seedsEnv,
  seedBase: seedBaseEnv,
  excludeEventIds: NEW_CONTENT_EVENT_IDS,
});

// After: full event set, including the new relief / cross-pull / layoff
// events.
const after = runReport({
  seeds: seedsEnv,
  seedBase: seedBaseEnv,
});

// 1. Existing per-path summary tables (after content), so the long-form
//    breakdown stays present.
printReport(after);

// 2. Content effect at shipped grade defaults — before vs after.
printContentEffect(before, after);

// 3. Combined grade preview under control + F1/F2/F3 (params via harness).
printCombinedGradePreview(after);

// 4. Reference run picker widened to all paths.
printReferenceRunAllPaths(after);

// 5. Rescore grid (cool the S band via growth ceiling). Returns the chosen
//    cell so the script can later show the live-vs-cell match check.
const picked = printRescoreGrid(after);

// 6. Match confirmation: compare the LIVE per-path histogram (which uses
//    grade.ts defaults) to the chosen cell's harness histogram. After
//    grade.ts is edited to match the cell, the two MUST match cell-for-
//    cell. Before the edit, they won't — which is the whole point of the
//    confirmation step.
if (picked) {
  // eslint-disable-next-line no-console
  console.log('## LIVE vs CELL MATCH CHECK');
  // eslint-disable-next-line no-console
  console.log(
    `# After editing grade.ts defaults to match ${picked.cell.config.name}, the live histogram should equal the cell histogram for every path.`,
  );
  let allMatch = true;
  // eslint-disable-next-line no-console
  console.log(
    '  path                LIVE (S/A/B/C/D)       CELL (S/A/B/C/D)       match?',
  );
  for (const p of FOUNDATION_PATHS) {
    const live = after.perPath[p.id].gradeHistogram;
    const cell = picked.cell.perPath[p.id].gradeHistogram;
    const match =
      live.S === cell.S &&
      live.A === cell.A &&
      live.B === cell.B &&
      live.C === cell.C &&
      live.D === cell.D;
    if (!match) allMatch = false;
    const liveStr = `${live.S}/${live.A}/${live.B}/${live.C}/${live.D}`;
    const cellStr = `${cell.S}/${cell.A}/${cell.B}/${cell.C}/${cell.D}`;
    // eslint-disable-next-line no-console
    console.log(
      `  ${p.id.padEnd(18)}  ${liveStr.padEnd(22)}  ${cellStr.padEnd(22)}  ${match ? 'YES' : 'NO'}`,
    );
  }
  // eslint-disable-next-line no-console
  console.log(
    `  → ${allMatch ? 'MATCH CONFIRMED: grade.ts defaults align with chosen cell.' : 'MISMATCH: grade.ts defaults differ from chosen cell. Edit grade.ts then re-run.'}`,
  );
  // eslint-disable-next-line no-console
  console.log('');
}

// eslint-disable-next-line no-console
console.log('## Raw per-run rows (JSON, AFTER content)');
// eslint-disable-next-line no-console
console.log(JSON.stringify(after.rows, null, 2));
