// Self-check for Sub-task 1: START_POINTS + createPlayerFromStartPoint.
//
// Instantiates all four start points and drives a full run through the same
// engine path the store uses (tick → expire-lapses → transition checks →
// event pick), policy-driven choices. Confirms:
//   (a) age / phase / direction at t=0 match the start-point spec
//   (b) university start is byte-identical to the legacy createPlayer
//   (c) choose_direction is pre-fired for non-foundation starts and never
//       refires through the eligible pool
//   (d) whats_next / foundation events are NEVER seen as eligible for
//       non-foundation starts (phase gate keeps them silent)
//   (e) state stays consistent (no NaN, freedom ratio in [0,100], finite
//       netWorth) and the run grades at 60.

import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
  RUN_TARGET_AGE_DEFAULT,
} from '../src/data/constants';
import { ALL_EVENTS } from '../src/content';
import {
  createPlayer,
  createPlayerFromStartPoint,
  freedomPct,
  netWorth,
  type Phase,
  type Player,
} from '../src/game/player';
import { tick } from '../src/game/tick';
import {
  applyChoice,
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../src/systems/eventEngine';
import { decideBeat } from '../src/systems/pacingController';
import { computeGrade } from '../src/systems/grade';
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import { START_POINTS, type StartPointId } from '../src/data/startPoints';

declare const console: { log: (...args: unknown[]) => void };

type Phase4 = Phase;

const log = (msg: string) => console.log(msg);

function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}

function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;
  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return {
      ...p,
      phase: 'career',
      flags: addUniqueFlag(p.flags, 'undecided'),
    };
  }
  return p;
}

const LATER_PHASE_ORDER: ReadonlyArray<Exclude<Phase4, 'foundation'>> = [
  'career',
  'growth',
  'freedom',
];

function maybeAdvancePhase(p: Player): Player {
  if (p.phase === 'foundation') return p;
  let target: Exclude<Phase4, 'foundation'> = 'career';
  for (const phase of LATER_PHASE_ORDER) {
    if (p.age >= PHASE_START_AGES[phase]) target = phase;
  }
  const currentIdx = LATER_PHASE_ORDER.indexOf(
    p.phase as Exclude<Phase4, 'foundation'>,
  );
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;
  return { ...p, phase: target };
}

type DriveResult = {
  finalPlayer: Player;
  monthsPlayed: number;
  sawForbiddenEvent: string | null; // foundation event slipping into eligible
  sawDirectionRefire: boolean;
  sawNaN: boolean;
  endedAtTarget: boolean;
};

function driveRun(
  startId: StartPointId,
  direction: 'corporate' | 'founder' | 'freelancer' | undefined,
  seed: number,
): DriveResult {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player =
      startId === 'university'
        ? createPlayerFromStartPoint(startId)
        : createPlayerFromStartPoint(startId, direction);
    let monthsSinceLastEvent = 0;
    let sawForbidden: string | null = null;
    let sawDirectionRefire = false;
    let sawNaN = false;
    const monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 24;
    const policy = POLICIES[seed % POLICIES.length];

    for (let step = 0; step < monthCap; step++) {
      player = tick(player);
      player = maybeAdvancePhase(maybeTransitionToCareer(player));
      monthsSinceLastEvent += 1;

      const ratio = player.expenses > 0 ? player.passiveIncome / player.expenses : 0;
      if (
        !Number.isFinite(player.cash) ||
        !Number.isFinite(player.debt) ||
        !Number.isFinite(ratio) ||
        Number.isNaN(player.stress)
      ) {
        sawNaN = true;
      }

      if (player.age >= player.targetAge) break;

      const eligible = getEligibleEvents(player, ALL_EVENTS);

      // For non-foundation starts: any foundation-phase event sneaking in is
      // a failure. choose_direction popping back in is also a failure.
      if (startId !== 'university') {
        for (const e of eligible) {
          if (e.phase === 'foundation') {
            sawForbidden = sawForbidden ?? e.id;
          }
          if (e.id === 'choose_direction') {
            sawDirectionRefire = true;
          }
        }
      }

      const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
      const beat = decideBeat({
        phase: player.phase,
        monthsSinceLastEvent,
        hasPriorityEligible,
      });
      if (beat === 'quiet') continue;

      const event = pickEvent(eligible, beat);
      if (!event) continue;
      const idx = policy.pickIndex(event, rng);
      const choice = event.choices[idx] ?? event.choices[0];
      if (!choice) continue;
      player = applyChoice(player, event, choice);
      // Mirror gameStore.chooseOption: overwrite the current month's entry
      // in place rather than append. Keeps the §13 invariant
      // length === month + 1 so this harness measures the same array shape
      // the real game produces.
      const snapshotNet = Math.round(
        player.cash + player.assets + player.investments - player.debt,
      );
      const nextHistory =
        player.netWorthHistory.length > 0
          ? [...player.netWorthHistory.slice(0, -1), snapshotNet]
          : [snapshotNet];
      player = {
        ...player,
        netWorthHistory: nextHistory,
      };
      monthsSinceLastEvent = 0;
    }

    return {
      finalPlayer: player,
      monthsPlayed: player.month,
      sawForbiddenEvent: sawForbidden,
      sawDirectionRefire,
      sawNaN,
      endedAtTarget: player.age >= player.targetAge,
    };
  });
}

function describeStartState(p: Player, label: string): void {
  log(`  [${label}] age=${p.age} phase=${p.phase} direction=${p.direction ?? 'null'} flags=${JSON.stringify(p.flags)} firedEventIds=${JSON.stringify(p.firedEventIds)}`);
  log(`           cash=${p.cash} salary=${p.salary} expenses=${p.expenses} debt=${p.debt} assets=${p.assets} passive=${p.passiveIncome}`);
  log(`           skill=${p.skill} network=${p.network} rep=${p.reputation} disc=${p.discipline} risk=${p.riskTolerance} amb=${p.ambition} stress=${p.stress} health=${p.health}`);
  log(`           startingNW=${p.netWorthHistory[0]}`);
}

function comparePlayers(a: Player, b: Player): string[] {
  const diffs: string[] = [];
  const keys = Object.keys({ ...a, ...b }) as (keyof Player)[];
  for (const k of keys) {
    const av = a[k] as unknown;
    const bv = b[k] as unknown;
    const same =
      Array.isArray(av) && Array.isArray(bv)
        ? JSON.stringify(av) === JSON.stringify(bv)
        : av === bv;
    if (!same) diffs.push(`${String(k)}: ${JSON.stringify(av)} vs ${JSON.stringify(bv)}`);
  }
  return diffs;
}

// ── INSTANTIATE & VERIFY START STATES ─────────────────────────────────────

log('# SUB-TASK 1 SELF-CHECK · createPlayerFromStartPoint');
log('');

const expected: Record<StartPointId, { age: number; phase: Phase4; reqDir: boolean; flag?: string }> = {
  university: { age: 18, phase: 'foundation', reqDir: false },
  early: { age: 22, phase: 'career', reqDir: true, flag: 'started_early' },
  established: { age: 26, phase: 'career', reqDir: true, flag: 'started_established' },
  midlife: { age: 38, phase: 'growth', reqDir: true, flag: 'started_midlife' },
};

let failures = 0;

for (const sp of START_POINTS) {
  const dir =
    sp.id === 'university'
      ? undefined
      : sp.id === 'early'
        ? ('corporate' as const)
        : sp.id === 'established'
          ? ('founder' as const)
          : ('freelancer' as const);
  const p = createPlayerFromStartPoint(sp.id, dir);
  describeStartState(p, sp.id);
  const exp = expected[sp.id];

  if (p.age !== exp.age) {
    failures++;
    log(`  FAIL [${sp.id}] age expected ${exp.age}, got ${p.age}`);
  }
  if (p.phase !== exp.phase) {
    failures++;
    log(`  FAIL [${sp.id}] phase expected ${exp.phase}, got ${p.phase}`);
  }
  if (p.targetAge !== RUN_TARGET_AGE_DEFAULT) {
    failures++;
    log(`  FAIL [${sp.id}] targetAge expected ${RUN_TARGET_AGE_DEFAULT}, got ${p.targetAge}`);
  }
  if (exp.reqDir) {
    if (p.direction !== dir) {
      failures++;
      log(`  FAIL [${sp.id}] direction expected ${dir}, got ${p.direction}`);
    }
    if (!p.firedEventIds.includes('choose_direction')) {
      failures++;
      log(`  FAIL [${sp.id}] choose_direction missing from firedEventIds`);
    }
    if (exp.flag && !p.flags.includes(exp.flag)) {
      failures++;
      log(`  FAIL [${sp.id}] expected flag '${exp.flag}'`);
    }
  } else {
    if (p.direction !== null) {
      failures++;
      log(`  FAIL [${sp.id}] direction should be null for foundation start, got ${p.direction}`);
    }
    if (p.firedEventIds.length !== 0) {
      failures++;
      log(`  FAIL [${sp.id}] firedEventIds should be empty for foundation start, got ${JSON.stringify(p.firedEventIds)}`);
    }
  }
  log('');
}

// ── UNIVERSITY BYTE-IDENTITY VS LEGACY createPlayer('university') ────────
log('## university byte-identity vs legacy createPlayer(\'university\')');
const legacyUni = createPlayer('university');
const spUni = createPlayerFromStartPoint('university');
// startPointId is the only intentional additive — strip it for the strict diff.
const stripStartId = (x: Player): Player => {
  const { startPointId: _ignored, ...rest } = x;
  void _ignored;
  return rest as Player;
};
const uniDiffs = comparePlayers(stripStartId(legacyUni), stripStartId(spUni));
if (uniDiffs.length === 0) {
  log('  PASS  university start is byte-identical to legacy createPlayer (modulo new startPointId)');
} else {
  failures++;
  log('  FAIL  university start diverges from legacy createPlayer:');
  for (const d of uniDiffs) log(`        ${d}`);
}
log('');

// ── DRIVE A FULL RUN PER START AND VERIFY INVARIANTS ────────────────────
log('## full-run invariants per start point (seed=42)');
for (const sp of START_POINTS) {
  const dir =
    sp.id === 'university'
      ? undefined
      : sp.id === 'early'
        ? ('corporate' as const)
        : sp.id === 'established'
          ? ('founder' as const)
          : ('freelancer' as const);
  const result = driveRun(sp.id, dir, 42);
  const grade = computeGrade(result.finalPlayer);
  const ending = evaluateEndings(result.finalPlayer);
  const fpct = freedomPct(result.finalPlayer);
  const nw = netWorth(result.finalPlayer);

  let ok = true;
  const note: string[] = [];
  if (!result.endedAtTarget) {
    ok = false; failures++; note.push('did not reach targetAge');
  }
  if (sp.id !== 'university' && result.sawForbiddenEvent) {
    ok = false; failures++; note.push(`foundation event leaked into eligible: ${result.sawForbiddenEvent}`);
  }
  if (sp.id !== 'university' && result.sawDirectionRefire) {
    ok = false; failures++; note.push('choose_direction re-fired');
  }
  if (result.sawNaN) {
    ok = false; failures++; note.push('NaN observed mid-run');
  }
  if (!Number.isFinite(nw)) {
    ok = false; failures++; note.push('non-finite final netWorth');
  }
  if (fpct < 0 || fpct > 100) {
    ok = false; failures++; note.push(`freedomPct out of bounds: ${fpct}`);
  }
  // §13 history invariant: ONE entry per recorded month (length === month + 1).
  // Choice resolutions overwrite the trailing entry in place; only tick pushes
  // new ones. A length drift here means a code path is appending where it
  // shouldn't (regression of the chooseOption bug).
  if (result.finalPlayer.netWorthHistory.length !== result.finalPlayer.month + 1) {
    ok = false; failures++; note.push(
      `netWorthHistory.length=${result.finalPlayer.netWorthHistory.length} != month+1=${result.finalPlayer.month + 1}`,
    );
  }
  log(`  [${sp.id}] months=${result.monthsPlayed} finalAge=${result.finalPlayer.age} finalPhase=${result.finalPlayer.phase} freedom=${fpct}% NW=${nw} grade=${grade.letter} ending="${ending.title}" — ${ok ? 'PASS' : 'FAIL'}${note.length ? ` (${note.join('; ')})` : ''}`);
}

log('');
if (failures === 0) {
  log('## ALL CHECKS PASSED');
} else {
  log(`## ${failures} CHECK(S) FAILED`);
}
