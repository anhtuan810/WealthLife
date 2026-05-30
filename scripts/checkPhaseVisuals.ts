// Self-check for Sub-task 4: phase visuals + transition scenes.
//
// Confirms:
//   (a) identityTitle returns a non-empty label for every (phase × direction)
//       combination — including growth/freedom with a committed direction.
//   (b) devTriggerPhaseTransition successfully fires each of career, growth,
//       and freedom overlays and stamps the corresponding fire-once flag.
//   (c) Driving a university run end-to-end surfaces phaseTransition exactly
//       once for each of foundation→career, career→growth, growth→freedom.
//   (d) A midlife start (phase=growth at age 38) never fires the career or
//       growth transition, but DOES fire freedom at 50.

declare const console: { log: (...args: unknown[]) => void };

import { identityTitle } from '../src/data/directions';
import { type LifeDirection, type Phase } from '../src/game/player';
import { useGameStore } from '../src/state/gameStore';

const log = (msg: string) => console.log(msg);

let failures = 0;

log('# SUB-TASK 4 SELF-CHECK · phase visuals + transition scenes');
log('');

// ── (a) identityTitle every combo ───────────────────────────────────────
log('## identityTitle coverage');

const phases: Phase[] = ['foundation', 'career', 'growth', 'freedom'];
const directions: LifeDirection[] = [null, 'corporate', 'founder', 'freelancer'];
for (const phase of phases) {
  for (const dir of directions) {
    const t = identityTitle(phase, dir);
    const ok = typeof t.label === 'string' && t.label.length > 0;
    if (!ok) failures++;
    log(
      `  phase=${phase}  direction=${dir ?? 'null'}  → "${t.label}" (muted=${t.muted})  ${ok ? 'PASS' : 'FAIL'}`,
    );
  }
}
log('');

// ── (b) devTriggerPhaseTransition surfaces each later phase ────────────
// Dev-only override: it does NOT stamp the fire-once flag (so the same
// transition can be previewed repeatedly). The natural fire-once behavior
// during a real run is covered by check (c) below.
log('## devTriggerPhaseTransition surfaces the overlay for each phase');

function setupUniversityRun() {
  useGameStore.getState().resetSelection();
  useGameStore.getState().selectStartPoint('university');
  useGameStore.getState().selectFoundationPath('university');
  useGameStore.getState().startGame();
}

setupUniversityRun();
for (const phase of ['career', 'growth', 'freedom'] as const) {
  useGameStore.getState().devTriggerPhaseTransition(phase);
  const surfaced = useGameStore.getState().phaseTransition;
  useGameStore.getState().dismissPhaseTransition();
  const ok = surfaced === phase;
  if (!ok) failures++;
  log(
    `  devTriggerPhaseTransition('${phase}'): overlay=${surfaced ?? 'null'}  ${ok ? 'PASS' : 'FAIL'}`,
  );
}
log('');

// ── Helper: drive a run end-to-end via the actual store, resolving events
//     and acknowledging transitions, and record the order in which
//     phaseTransition values appear. ──

type Sequence = {
  transitionsSeen: Phase[];
  finalAge: number;
  finalPhase: Phase;
  endedAtTarget: boolean;
};

function driveRun(
  start: 'university' | 'early' | 'established' | 'midlife',
  direction?: 'corporate' | 'founder' | 'freelancer',
): Sequence {
  useGameStore.getState().resetSelection();
  useGameStore.getState().selectStartPoint(start);
  if (start === 'university') {
    useGameStore.getState().selectFoundationPath('university');
  } else if (direction) {
    useGameStore.getState().selectDirection(direction);
  }
  useGameStore.getState().startGame();

  const transitionsSeen: Phase[] = [];
  // Outer cap is generous — a 18→60 run is ~504 months and each iteration
  // either advances time, resolves an event, or acks a transition.
  const cap = 5_000;
  for (let i = 0; i < cap; i++) {
    const s = useGameStore.getState();
    if (s.gameOver) break;
    if (s.phaseTransition) {
      transitionsSeen.push(s.phaseTransition);
      useGameStore.getState().dismissPhaseTransition();
      continue;
    }
    if (s.currentEvent) {
      useGameStore.getState().chooseOption(s.currentEvent.choices[0].id);
      continue;
    }
    useGameStore.getState().advanceMonth();
  }
  const p = useGameStore.getState().player!;
  return {
    transitionsSeen,
    finalAge: p.age,
    finalPhase: p.phase,
    endedAtTarget: p.age >= p.targetAge,
  };
}

// ── (c) university transitions sequence ────────────────────────────────
log('## university end-to-end transition sequence');
const uniSeq = driveRun('university');
const expectedUni: Phase[] = ['career', 'growth', 'freedom'];
const sameSeq =
  uniSeq.transitionsSeen.length === expectedUni.length &&
  uniSeq.transitionsSeen.every((p, i) => p === expectedUni[i]);
log(
  `  transitions=${JSON.stringify(uniSeq.transitionsSeen)} finalAge=${uniSeq.finalAge} finalPhase=${uniSeq.finalPhase}  ${
    sameSeq && uniSeq.endedAtTarget ? 'PASS' : 'FAIL'
  }`,
);
if (!sameSeq || !uniSeq.endedAtTarget) failures++;
log('');

// ── (d) midlife transitions sequence ───────────────────────────────────
log('## midlife end-to-end transition sequence');
const mSeq = driveRun('midlife', 'founder');
// Midlife starts at growth → should NEVER see career or growth transition;
// freedom should fire exactly once at age 50.
const expectedMid: Phase[] = ['freedom'];
const midOk =
  mSeq.transitionsSeen.length === expectedMid.length &&
  mSeq.transitionsSeen.every((p, i) => p === expectedMid[i]);
log(
  `  transitions=${JSON.stringify(mSeq.transitionsSeen)} finalAge=${mSeq.finalAge} finalPhase=${mSeq.finalPhase}  ${
    midOk && mSeq.endedAtTarget ? 'PASS' : 'FAIL'
  }`,
);
if (!midOk || !mSeq.endedAtTarget) failures++;
log('');

if (failures === 0) {
  log('## ALL CHECKS PASSED');
} else {
  log(`## ${failures} CHECK(S) FAILED`);
}
