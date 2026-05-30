// Self-check for Sub-task 2: start-point picker + summary labels.
//
// Drives the gameStore through the new flow for each start point, then
// reproduces the eyebrow / chart-x-axis label the RunSummaryScreen would
// render. Confirms entry age/phase/direction and that the summary reads
// "AGE {startAge} → 60".

declare const console: { log: (...args: unknown[]) => void };

import { useGameStore } from '../src/state/gameStore';
import { START_POINTS, START_POINT_BY_ID } from '../src/data/startPoints';
import { RUN_TARGET_AGE_DEFAULT } from '../src/data/constants';

const log = (msg: string) => console.log(msg);

let failures = 0;

log('# SUB-TASK 2 SELF-CHECK · picker flow + summary labels');
log('');

const cases: Array<
  | { startPoint: 'university'; foundationPath: 'university' | 'vocational' | 'self_taught' | 'straight_to_work' }
  | { startPoint: 'early' | 'established' | 'midlife'; direction: 'corporate' | 'founder' | 'freelancer' }
> = [
  { startPoint: 'university', foundationPath: 'university' },
  { startPoint: 'early', direction: 'corporate' },
  { startPoint: 'established', direction: 'founder' },
  { startPoint: 'midlife', direction: 'freelancer' },
];

for (const c of cases) {
  // Fresh selection state for each case.
  useGameStore.getState().resetSelection();
  useGameStore.getState().selectStartPoint(c.startPoint);

  if (c.startPoint === 'university') {
    useGameStore.getState().selectFoundationPath(c.foundationPath);
  } else {
    useGameStore.getState().selectDirection(c.direction);
  }
  useGameStore.getState().startGame();

  const p = useGameStore.getState().player;
  if (!p) {
    failures++;
    log(`  FAIL [${c.startPoint}] startGame produced no player`);
    continue;
  }

  const sp = START_POINT_BY_ID[c.startPoint];
  const expectedAge = sp.startAge;
  const expectedPhase = sp.startPhase;
  const expectedDirection =
    c.startPoint === 'university' ? null : c.direction;

  let ok = true;
  const note: string[] = [];
  if (p.startPointId !== c.startPoint) {
    ok = false; note.push(`startPointId expected ${c.startPoint}, got ${p.startPointId}`);
  }
  if (p.age !== expectedAge) {
    ok = false; note.push(`age expected ${expectedAge}, got ${p.age}`);
  }
  if (p.phase !== expectedPhase) {
    ok = false; note.push(`phase expected ${expectedPhase}, got ${p.phase}`);
  }
  if (p.direction !== expectedDirection) {
    ok = false; note.push(`direction expected ${expectedDirection}, got ${p.direction}`);
  }
  if (p.targetAge !== RUN_TARGET_AGE_DEFAULT) {
    ok = false; note.push(`targetAge expected ${RUN_TARGET_AGE_DEFAULT}, got ${p.targetAge}`);
  }

  // Reproduce the RunSummaryScreen labels (header eyebrow + chart x-axis):
  //   eyebrow = "AGE {startAge} → {endAge}"
  //   chart   = "AGE {startAge} → {endAge}"
  // Both should read with the run's actual start age, not a hardcoded 18.
  const startAge = START_POINT_BY_ID[p.startPointId ?? 'university'].startAge;
  const endAge = p.targetAge;
  const summaryEyebrow = `AGE ${startAge} → ${endAge}`;
  const expectedEyebrow = `AGE ${expectedAge} → ${RUN_TARGET_AGE_DEFAULT}`;
  if (summaryEyebrow !== expectedEyebrow) {
    ok = false; note.push(`summary eyebrow expected "${expectedEyebrow}", got "${summaryEyebrow}"`);
  }

  if (!ok) failures++;
  log(`  [${c.startPoint}] age=${p.age} phase=${p.phase} direction=${p.direction ?? 'null'} summary='${summaryEyebrow}' — ${ok ? 'PASS' : 'FAIL'}${note.length ? ` (${note.join('; ')})` : ''}`);
}

log('');
if (failures === 0) {
  log('## ALL CHECKS PASSED');
} else {
  log(`## ${failures} CHECK(S) FAILED`);
}

// Verify that every start point is exercised — guard against future
// additions that don't get a case row.
const exercised = new Set(cases.map((c) => c.startPoint));
const missing = START_POINTS.filter((sp) => !exercised.has(sp.id));
if (missing.length > 0) {
  log(`WARNING: start points not exercised in self-check: ${missing.map((m) => m.id).join(', ')}`);
}
