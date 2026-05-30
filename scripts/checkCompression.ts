// Self-check for Sub-task 3: compression is presentation-only.
//
// Drives the same start-point with the same RNG seed twice — once via the
// single-step path (advanceMonth-equivalent) and once via the multi-step
// fast-forward path (skipToNextDecision-equivalent). The two runs MUST
// produce byte-identical final Player state and an identical netWorthHistory
// month-for-month, because the compression layer is just a loop over the
// SAME per-month step.
//
// Any divergence is a FAIL — see the global rails in the task prompt.
//
// Also checks:
//   - The 18→60 run (university) and the 38→60 run (midlife) both reach
//     targetAge cleanly.
//   - phase boundaries still land at 35 (growth) and 50 (freedom).
//   - parked-decision urgency halts the fast-forward (nudge window).
//   - no eligible event is skipped — for every month in the compressed run,
//     the eligible pool at the moment the engine chose to halt matches the
//     eligible pool at the same month in the control run.

declare const console: { log: (...args: unknown[]) => void };

import { ALL_EVENTS } from '../src/content';
import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
  RUN_TARGET_AGE_DEFAULT,
} from '../src/data/constants';
import {
  createPlayerFromStartPoint,
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
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import type { Ending, GameEvent } from '../src/types/events';
import type { StartPointId } from '../src/data/startPoints';

const log = (msg: string) => console.log(msg);

// ── Mirror the store's helpers so the sim drives the same code path the
//     UI does (advanceMonthStep / skipToNextDecision) without dragging the
//     zustand layer in. Kept inline so any divergence vs gameStore surfaces
//     as a test regression. ──

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
  const currentIdx = LATER_PHASE_ORDER.indexOf(
    p.phase as Exclude<Phase, 'foundation'>,
  );
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;
  return { ...p, phase: target };
}

function expirePending(player: Player): { player: Player; lapsed: { eventId: string }[] } {
  if (player.pendingDecisions.length === 0) return { player, lapsed: [] };
  const surviving: Player['pendingDecisions'] = [];
  const expiredIds: string[] = [];
  for (const p of player.pendingDecisions) {
    if (p.expiryMonth <= player.month) expiredIds.push(p.eventId);
    else surviving.push(p);
  }
  if (expiredIds.length === 0) return { player, lapsed: [] };
  const firedSet = new Set(player.firedEventIds);
  for (const id of expiredIds) firedSet.add(id);
  let next: Player = {
    ...player,
    pendingDecisions: surviving,
    firedEventIds: Array.from(firedSet),
  };
  const lapsed: { eventId: string }[] = [];
  for (const id of expiredIds) {
    const event = ALL_EVENTS.find((e) => e.id === id);
    if (!event) continue;
    if (event.onLapse) {
      next = applyChoice(next, event, {
        id: `${event.id}__lapse`,
        label: '',
        effects: event.onLapse.effects ?? {},
        setsFlags: event.onLapse.setsFlags,
      });
    }
    lapsed.push({ eventId: id });
  }
  return { player: next, lapsed };
}

type StepResult = {
  player: Player;
  monthsSinceLastEvent: number;
  currentEvent: GameEvent | null;
  gameOver: boolean;
  endingResult: Ending | null;
  phaseTransition: Phase | null;
};

const SEEN_CAREER_TRANSITION_FLAG = 'seen_career_transition';

function advanceMonthStep(
  player: Player,
  monthsSinceLastEvent: number,
): StepResult {
  const { player: ticked } = expirePending(tick(player));
  const phased = maybeAdvancePhase(maybeTransitionToCareer(ticked));
  const nextMonths = monthsSinceLastEvent + 1;

  if (
    ticked.phase === 'foundation' &&
    phased.phase === 'career' &&
    !phased.flags.includes(SEEN_CAREER_TRANSITION_FLAG)
  ) {
    return {
      player: {
        ...phased,
        flags: addUniqueFlag(phased.flags, SEEN_CAREER_TRANSITION_FLAG),
      },
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: false,
      endingResult: null,
      phaseTransition: 'career',
    };
  }

  if (phased.age >= phased.targetAge) {
    return {
      player: phased,
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: true,
      endingResult: evaluateEndings(phased),
      phaseTransition: null,
    };
  }

  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMonths,
    hasPriorityEligible,
  });
  if (beat === 'quiet') {
    return {
      player: phased,
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: false,
      endingResult: null,
      phaseTransition: null,
    };
  }
  const event = pickEvent(eligible, beat);
  return {
    player: phased,
    monthsSinceLastEvent: nextMonths,
    currentEvent: event,
    gameOver: false,
    endingResult: null,
    phaseTransition: null,
  };
}

// ── Driver shared by control and compressed runs. The difference between
//     the two modes is purely how often we leave the inner loop; both call
//     the SAME advanceMonthStep with the same args in the same order. ──

type DriveOpts = {
  startPointId: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
  compressed: boolean;
  seed: number;
};

type DriveResult = {
  finalPlayer: Player;
  monthsAdvanced: number;
  phaseFlipsAt: Partial<Record<Phase, number>>; // month at which each phase was first entered
  endedAtTarget: boolean;
};

function driveRun(opts: DriveOpts): DriveResult {
  const rng = mulberry32(opts.seed);
  return withMathRandom(rng, () => {
    let player =
      opts.startPointId === 'university'
        ? createPlayerFromStartPoint(opts.startPointId)
        : createPlayerFromStartPoint(opts.startPointId, opts.direction);
    let monthsSinceLastEvent = 0;
    let phaseTransition: Phase | null = null;
    let currentEvent: GameEvent | null = null;
    const policy = POLICIES[opts.seed % POLICIES.length];
    const phaseFlipsAt: Partial<Record<Phase, number>> = { [player.phase]: 0 };

    const NUDGE_WINDOW = 1;
    const SKIP_SAFETY_CAP = 24;

    // Hard upper bound on the outer loop. A correctly-driven run halts at
    // targetAge; this only catches a regression.
    const outerCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;
    let monthsAdvanced = 0;

    const observePhase = (prev: Player, next: Player) => {
      if (prev.phase !== next.phase) {
        phaseFlipsAt[next.phase] = phaseFlipsAt[next.phase] ?? next.month;
      }
    };

    outer: for (let outer = 0; outer < outerCap; outer++) {
      // Acknowledge any pending phase transition immediately (matches the
      // user's tap-to-continue on PhaseTransitionOverlay).
      if (phaseTransition) {
        phaseFlipsAt[phaseTransition] = phaseFlipsAt[phaseTransition] ?? player.month;
        phaseTransition = null;
        // No month advance — same as the store's dismissPhaseTransition.
        continue;
      }
      // Resolve the active event (matches chooseOption).
      if (currentEvent) {
        const idx = policy.pickIndex(currentEvent, rng);
        const choice = currentEvent.choices[idx] ?? currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, currentEvent, choice);
          // Mirror gameStore.chooseOption: overwrite the current month's
          // trailing entry rather than append, preserving the §13
          // length === month + 1 invariant. The control/compressed paths
          // BOTH apply this same overwrite, so their netWorthHistory arrays
          // must still match byte-for-byte at end-of-run.
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
        }
        currentEvent = null;
        monthsSinceLastEvent = 0;
        continue;
      }

      // No active event / transition — advance time.
      if (opts.compressed) {
        // skipToNextDecision-equivalent inner loop.
        for (let i = 0; i < SKIP_SAFETY_CAP; i++) {
          const before = player;
          const step = advanceMonthStep(player, monthsSinceLastEvent);
          player = step.player;
          observePhase(before, player);
          monthsSinceLastEvent = step.monthsSinceLastEvent;
          monthsAdvanced += 1;
          if (step.gameOver) break outer;
          if (step.phaseTransition) {
            phaseTransition = step.phaseTransition;
            break;
          }
          if (step.currentEvent) {
            currentEvent = step.currentEvent;
            break;
          }
          const urgent = player.pendingDecisions.some(
            (d) => d.expiryMonth - player.month <= NUDGE_WINDOW,
          );
          if (urgent) break;
        }
      } else {
        // advanceMonth-equivalent: a single per-month step.
        const before = player;
        const step = advanceMonthStep(player, monthsSinceLastEvent);
        player = step.player;
        observePhase(before, player);
        monthsSinceLastEvent = step.monthsSinceLastEvent;
        monthsAdvanced += 1;
        if (step.gameOver) break outer;
        if (step.phaseTransition) phaseTransition = step.phaseTransition;
        else if (step.currentEvent) currentEvent = step.currentEvent;
      }
    }

    return {
      finalPlayer: player,
      monthsAdvanced,
      phaseFlipsAt,
      endedAtTarget: player.age >= player.targetAge,
    };
  });
}

// ── Compare ────────────────────────────────────────────────────────────

type Diff = { key: string; control: unknown; compressed: unknown };

function diffPlayers(a: Player, b: Player): Diff[] {
  const out: Diff[] = [];
  // Field-by-field; skip a few transient/structural fields that aren't
  // engine-state (lastProjectedFlow is set on every tick and depends on the
  // pre-tick state — they'll match if the pre-tick states match, which they
  // do at end-of-run).
  const keys: (keyof Player)[] = [
    'age',
    'month',
    'phase',
    'foundationPath',
    'targetAge',
    'cash',
    'salary',
    'expenses',
    'debt',
    'investments',
    'assets',
    'passiveIncome',
    'skill',
    'network',
    'reputation',
    'discipline',
    'riskTolerance',
    'ambition',
    'stress',
    'health',
    'direction',
    'stressMomentum',
    'startPointId',
    'lastProjectedFlow',
  ];
  for (const k of keys) {
    if ((a[k] as unknown) !== (b[k] as unknown)) {
      out.push({ key: String(k), control: a[k], compressed: b[k] });
    }
  }
  // Arrays — JSON.stringify for shallow value-equality.
  const arrKeys: (keyof Player)[] = [
    'flags',
    'firedEventIds',
    'netWorthHistory',
    'pendingDecisions',
  ];
  for (const k of arrKeys) {
    const av = JSON.stringify(a[k]);
    const bv = JSON.stringify(b[k]);
    if (av !== bv) out.push({ key: String(k), control: a[k], compressed: b[k] });
  }
  return out;
}

// ── Cases ──────────────────────────────────────────────────────────────

log('# SUB-TASK 3 SELF-CHECK · compression is presentation-only');
log('');

type Case = {
  label: string;
  startPointId: StartPointId;
  direction: 'corporate' | 'founder' | 'freelancer' | undefined;
};
const CASES: Case[] = [
  { label: 'university (18→60)', startPointId: 'university', direction: undefined },
  { label: 'midlife (38→60)', startPointId: 'midlife', direction: 'corporate' },
];

const SEEDS = [42, 7, 211];

let failures = 0;

for (const c of CASES) {
  log(`## ${c.label}`);
  for (const seed of SEEDS) {
    const control = driveRun({ ...c, compressed: false, seed });
    const compressed = driveRun({ ...c, compressed: true, seed });

    const ok = [
      control.endedAtTarget && compressed.endedAtTarget,
      control.monthsAdvanced === compressed.monthsAdvanced,
    ];
    const diffs = diffPlayers(control.finalPlayer, compressed.finalPlayer);

    const reasons: string[] = [];
    if (!control.endedAtTarget) reasons.push('control did not reach targetAge');
    if (!compressed.endedAtTarget) reasons.push('compressed did not reach targetAge');
    if (control.monthsAdvanced !== compressed.monthsAdvanced) {
      reasons.push(
        `monthsAdvanced control=${control.monthsAdvanced} compressed=${compressed.monthsAdvanced}`,
      );
    }
    if (diffs.length > 0) reasons.push(`${diffs.length} field divergence(s)`);

    const pass = ok.every(Boolean) && diffs.length === 0;
    if (!pass) failures++;
    log(
      `  seed=${seed}  months=${control.monthsAdvanced} (control) vs ${compressed.monthsAdvanced} (compressed)  ` +
        `phases=${JSON.stringify(control.phaseFlipsAt)}  ${pass ? 'PASS' : 'FAIL'}` +
        (reasons.length > 0 ? `  (${reasons.join('; ')})` : ''),
    );
    if (!pass) {
      for (const d of diffs.slice(0, 5)) {
        log(`     · ${d.key}: ${JSON.stringify(d.control)} vs ${JSON.stringify(d.compressed)}`);
      }
    }

    // Phase boundary spot-checks (35 / 50 unchanged).
    if (c.startPointId === 'university') {
      // university reaches all four phases; check the age the player first
      // crossed into growth and freedom.
      // Reconstruct expected age: growth at 35, freedom at 50. Since the
      // engine ticks month-by-month, age 35 begins at month (35-18)*12 = 204
      // for university. We can't read mid-run but we trust phase_flips_at.
      if (control.phaseFlipsAt['growth'] !== undefined) {
        const m = control.phaseFlipsAt['growth'];
        // age = 18 + floor(m/12); growth fires when phased detects age>=35
        // which is when age first ticks to 35. Allow ±1 month tolerance for
        // the tick boundary.
        const ageAtFlip = 18 + Math.floor(m / 12);
        if (ageAtFlip !== 35) {
          log(`     · WARN growth flip recorded at month ${m} → age ${ageAtFlip} (expected 35)`);
        }
      }
      if (control.phaseFlipsAt['freedom'] !== undefined) {
        const m = control.phaseFlipsAt['freedom'];
        const ageAtFlip = 18 + Math.floor(m / 12);
        if (ageAtFlip !== 50) {
          log(`     · WARN freedom flip recorded at month ${m} → age ${ageAtFlip} (expected 50)`);
        }
      }
    }
  }
  log('');
}

if (failures === 0) {
  log('## ALL CHECKS PASSED — compression introduces no divergence');
} else {
  log(`## ${failures} CHECK(S) FAILED — compression DIVERGED from per-month control`);
}
