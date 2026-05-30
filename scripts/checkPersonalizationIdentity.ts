// Personalization identity self-check (spec §2 guarantee).
//
// Two seeded runs:
//   A — with profile = DEV_STUB_PROFILE
//   B — with profile = undefined
// resolveEventText is invoked at every event in BOTH runs, so any leak from
// the rendering layer into engine state would surface in the trace.
//
// Asserts:
//   1. Per-step engine trace is byte-identical (eventId, choiceId, post-flags,
//      post-firedEventIds, computed grade) across A and B.
//   2. Final player state (cash/debt/strengths/stress/health/age/month/phase)
//      is byte-identical across A and B.
//   3. For at least one slotted event encountered in the run, the rendered
//      title under A differs from the rendered title under B — proves the
//      rendering layer is actually wired and doing work.
//
// Run with: npx tsc -p tsconfig.sim.json && node .sim-build/scripts/checkPersonalizationIdentity.js

import { END_AGE, FOUNDATION_END_AGE, FOUNDATION_SAFETY_AGE, PHASE_START_AGES, DIRECTIONAL_FLAGS } from '../src/data/constants';
import { createPlayer, type Phase, type Player } from '../src/game/player';
import { tick } from '../src/game/tick';
import { ALL_EVENTS } from '../src/content';
import {
  applyChoice,
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../src/systems/eventEngine';
import { decideBeat } from '../src/systems/pacingController';
import { computeGrade } from '../src/systems/grade';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import { POLICIES } from '../src/sim/policies';
import {
  DEV_STUB_PROFILE,
  resolveEventText,
  type Profile,
} from '../src/personalization';
import type { Ending, GameEvent } from '../src/types/events';

declare const process: {
  env: Record<string, string | undefined>;
  exit: (code: number) => never;
};

// Same phase-flip helpers as the per-path sim — duplicated minimally so this
// script doesn't drag in the broader perPathReport surface area.

function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}

function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;
  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return { ...p, phase: 'career', flags: addUniqueFlag(p.flags, 'undecided') };
  }
  return p;
}

const LATER_PHASE_ORDER: ReadonlyArray<Exclude<Phase, 'foundation'>> = [
  'career',
  'growth',
  'freedom',
];

function maybeAdvancePhase(p: Player): Player {
  if (p.phase === 'foundation') return p;
  let target: Exclude<Phase, 'foundation'> = 'career';
  for (const phase of LATER_PHASE_ORDER) {
    if (p.age >= PHASE_START_AGES[phase]) target = phase;
  }
  const currentIdx = LATER_PHASE_ORDER.indexOf(p.phase as Exclude<Phase, 'foundation'>);
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;
  return { ...p, phase: target };
}

type StepRecord = {
  month: number;
  age: number;
  eventId: string;
  choiceId: string;
  flagsAfter: readonly string[];
  firedAfter: readonly string[];
  cashAfter: number;
  netWorthAfter: number;
};

type RenderRecord = {
  eventId: string;
  title: string;
  fallbackText?: string;
  choiceLabels: readonly string[];
};

type RunTrace = {
  steps: StepRecord[];
  renders: RenderRecord[];
  ending: Ending;
  finalPlayer: Player;
  gradeLetter: string;
  gradeScore: number;
};

function traceRun(seed: number, profile: Profile | undefined): RunTrace {
  const rng = mulberry32(seed);
  const policy = POLICIES[0]; // any policy — only matters that A and B use the same one
  return withMathRandom(rng, () => {
    let player = createPlayer('university');
    let monthsSinceLastEvent = 0;
    let ending: Ending | null = null;
    const steps: StepRecord[] = [];
    const renders: RenderRecord[] = [];
    const monthCap = (END_AGE - 18) * 12 + 24;

    for (let step = 0; step < monthCap; step++) {
      player = tick(player);
      player = maybeAdvancePhase(maybeTransitionToCareer(player));
      monthsSinceLastEvent += 1;
      if (player.age >= player.targetAge) {
        ending = evaluateEndings(player);
        break;
      }
      const eligible = getEligibleEvents(player, ALL_EVENTS);
      const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
      const beat = decideBeat({
        phase: player.phase,
        monthsSinceLastEvent,
        hasPriorityEligible,
      });
      if (beat === 'quiet') continue;
      const event: GameEvent | null = pickEvent(eligible, beat);
      if (!event) continue;

      // CRITICAL: the rendering layer runs in both A and B. If it ever leaked
      // into engine state (e.g. mutated the event or the player), the engine
      // trace would diverge between profile=stub and profile=undefined.
      const rendered = resolveEventText(event, profile, undefined);
      renders.push({
        eventId: event.id,
        title: rendered.title,
        fallbackText: rendered.fallbackText,
        choiceLabels: rendered.choices.map((c) => c.label),
      });

      const idx = policy.pickIndex(event, rng);
      const choice = event.choices[idx] ?? event.choices[0];
      if (!choice) continue;
      player = applyChoice(player, event, choice);

      const snapshotNet = Math.round(
        player.cash + player.assets + player.investments - player.debt,
      );
      const nextHistory =
        player.netWorthHistory.length > 0
          ? [...player.netWorthHistory.slice(0, -1), snapshotNet]
          : [snapshotNet];
      player = { ...player, netWorthHistory: nextHistory };

      steps.push({
        month: player.month,
        age: player.age,
        eventId: event.id,
        choiceId: choice.id,
        flagsAfter: [...player.flags],
        firedAfter: [...player.firedEventIds],
        cashAfter: player.cash,
        netWorthAfter: snapshotNet,
      });
      monthsSinceLastEvent = 0;
    }

    if (!ending) ending = evaluateEndings(player);
    const grade = computeGrade(player);
    return {
      steps,
      renders,
      ending,
      finalPlayer: player,
      gradeLetter: grade.letter,
      gradeScore: grade.score,
    };
  });
}

function stepKey(s: StepRecord): string {
  return [
    s.month,
    s.age,
    s.eventId,
    s.choiceId,
    s.cashAfter,
    s.netWorthAfter,
    s.flagsAfter.join('|'),
    s.firedAfter.join('|'),
  ].join('::');
}

function finalKey(p: Player): string {
  return [
    p.age,
    p.month,
    p.phase,
    p.cash,
    p.debt,
    p.salary,
    p.expenses,
    p.investments,
    p.assets,
    p.passiveIncome,
    p.skill,
    p.network,
    p.reputation,
    p.discipline,
    p.riskTolerance,
    p.ambition,
    p.stress,
    p.health,
    [...p.flags].sort().join('|'),
    [...p.firedEventIds].sort().join('|'),
  ].join('::');
}

function fail(msg: string): never {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

const SEEDS = [1, 2, 3, 7, 11, 23, 42, 99];
let totalRendersChecked = 0;
let totalRenderDifferences = 0;

for (const seed of SEEDS) {
  const A = traceRun(seed, DEV_STUB_PROFILE);
  const B = traceRun(seed, undefined);

  if (A.steps.length !== B.steps.length) {
    fail(
      `seed=${seed}: step count differs (stub=${A.steps.length}, none=${B.steps.length})`,
    );
  }
  for (let i = 0; i < A.steps.length; i++) {
    const ka = stepKey(A.steps[i]);
    const kb = stepKey(B.steps[i]);
    if (ka !== kb) {
      fail(`seed=${seed}: step ${i} diverges\n  stub: ${ka}\n  none: ${kb}`);
    }
  }
  if (A.gradeLetter !== B.gradeLetter || A.gradeScore !== B.gradeScore) {
    fail(
      `seed=${seed}: grade diverges (stub=${A.gradeLetter}/${A.gradeScore}, none=${B.gradeLetter}/${B.gradeScore})`,
    );
  }
  if (A.ending.id !== B.ending.id) {
    fail(
      `seed=${seed}: ending diverges (stub=${A.ending.id}, none=${B.ending.id})`,
    );
  }
  const finalA = finalKey(A.finalPlayer);
  const finalB = finalKey(B.finalPlayer);
  if (finalA !== finalB) {
    fail(`seed=${seed}: final player diverges\n  stub: ${finalA}\n  none: ${finalB}`);
  }

  for (let i = 0; i < A.renders.length; i++) {
    totalRendersChecked += 1;
    const ra = A.renders[i];
    const rb = B.renders[i];
    if (ra.eventId !== rb.eventId) {
      fail(`seed=${seed}: render event id mismatch at index ${i}`);
    }
    if (
      ra.title !== rb.title ||
      ra.fallbackText !== rb.fallbackText ||
      ra.choiceLabels.join('||') !== rb.choiceLabels.join('||')
    ) {
      totalRenderDifferences += 1;
    }
  }
}

if (totalRenderDifferences === 0) {
  fail(
    'No rendered text differed between stub-profile and no-profile runs across any seed — the personalization layer is not wired (or no slotted events ever fired). Expected at least one slotted event in the run window.',
  );
}

console.log(
  `OK: ${SEEDS.length} seeded runs — engine/effect/flag/grade sequences byte-identical with vs without profile.`,
);
console.log(
  `    ${totalRenderDifferences} of ${totalRendersChecked} rendered events differed between stub and none (slotted templates working).`,
);
