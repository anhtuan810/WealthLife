import { create } from 'zustand';
import type { FoundationPathId } from '../data/foundationPaths';
import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PENDING_DECISIONS_CAP,
  PHASE_START_AGES,
} from '../data/constants';
import type {
  StartPointDirection,
  StartPointId,
} from '../data/startPoints';
import {
  createPlayer,
  createPlayerFromStartPoint,
  type Phase,
  type Player,
} from '../game/player';
import { tick } from '../game/tick';
import { ALL_EVENTS } from '../content';
import type { Ending, GameEvent } from '../types/events';
import { decideBeat } from '../systems/pacingController';
import {
  applyChoice,
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../systems/eventEngine';
import { effectiveDeferWindow } from '../types/events';
import { computeGrade, type GradeResult } from '../systems/grade';

// Compression loop bounds.
//   SKIP_SAFETY_CAP: maximum months a single fast-forward can advance.
//                    The compressed loop will normally exit far sooner on an
//                    event, phase boundary, or run-end; this is purely the
//                    "no infinite loop on a bug" net.
//   NUDGE_WINDOW:    months from expiry at which a parked decision is
//                    considered urgent. Mirrors the dashboard's urgent pill
//                    (`expiryMonth - month <= 1`) — fast-forward halts the
//                    moment any surviving parked decision lands in this
//                    window, so the user always gets a chance to resolve it
//                    before it lapses.
const SKIP_SAFETY_CAP = 24;
const NUDGE_WINDOW = 1;

// Flags set the first (and only) time each phase-transition overlay fires.
// Live on Player.flags so they survive the same way directional flags do.
// The growth/freedom variants gate the new transition scenes added in the
// structural-life-arc pass.
export const SEEN_CAREER_TRANSITION_FLAG = 'seen_career_transition';
export const SEEN_GROWTH_TRANSITION_FLAG = 'seen_growth_transition';
export const SEEN_FREEDOM_TRANSITION_FLAG = 'seen_freedom_transition';

// Resolved record of a parked decision that expired this step. The store
// stashes these on `lapsedThisStep` so a future acknowledgment surface can
// read them; this task renders nothing yet.
type LapsedEntry = { eventId: string; resultText?: string };

type AdvanceResult = {
  player: Player;
  monthsSinceLastEvent: number;
  currentEvent: GameEvent | null;
  gameOver: boolean;
  endingResult: Ending | null;
  grade: GradeResult | null;
  // Non-null when this tick crossed a phase boundary the player hasn't
  // acknowledged yet. The store halts the loop on this just like currentEvent.
  phaseTransition: Phase | null;
  // Decisions that lapsed during this step (empty when nothing expired).
  lapsedThisStep: LapsedEntry[];
};

const RUN_QUIET_RESULT = (
  player: Player,
  monthsSinceLastEvent: number,
  lapsedThisStep: LapsedEntry[],
): AdvanceResult => ({
  player,
  monthsSinceLastEvent,
  currentEvent: null,
  gameOver: false,
  endingResult: null,
  grade: null,
  phaseTransition: null,
  lapsedThisStep,
});

function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}

// Expire parked decisions whose window has elapsed. A parked entry survives
// while expiryMonth > player.month; once the new month reaches expiryMonth,
// the decision lapses: the eventId leaves pendingDecisions and joins
// firedEventIds so the engine treats it as already-resolved. Events with an
// `onLapse` block also get those effects/flags applied via the SAME path
// choices use (a synthetic Choice through applyChoice) so the math stays in
// one place. Events without onLapse vanish silently. Handles multiple
// expirations in one month via a single pass.
function expirePendingDecisions(player: Player): {
  player: Player;
  lapsed: LapsedEntry[];
} {
  if (player.pendingDecisions.length === 0) {
    return { player, lapsed: [] };
  }
  const surviving: Player['pendingDecisions'] = [];
  const expiredIds: string[] = [];
  for (const p of player.pendingDecisions) {
    if (p.expiryMonth <= player.month) expiredIds.push(p.eventId);
    else surviving.push(p);
  }
  if (expiredIds.length === 0) {
    return { player, lapsed: [] };
  }
  const firedSet = new Set(player.firedEventIds);
  for (const id of expiredIds) firedSet.add(id);
  let next: Player = {
    ...player,
    pendingDecisions: surviving,
    firedEventIds: Array.from(firedSet),
  };
  const lapsed: LapsedEntry[] = [];
  for (const id of expiredIds) {
    const event = ALL_EVENTS.find((e) => e.id === id);
    if (!event) continue;
    if (event.onLapse) {
      // Reuse applyChoice's effect/flag math. The event is already in
      // firedEventIds so applyChoice's fire-mark is a no-op. label is unused
      // by the engine but required by the Choice type.
      next = applyChoice(next, event, {
        id: `${event.id}__lapse`,
        label: '',
        effects: event.onLapse.effects ?? {},
        setsFlags: event.onLapse.setsFlags,
      });
    }
    lapsed.push({ eventId: id, resultText: event.onLapse?.resultText });
  }
  return { player: next, lapsed };
}

// Foundation → career transition. Runs AFTER tick so we react to the new age
// (whats_next, priority 3, fires at age 22 and writes a directional flag; we
// only transition once that flag is present, or once the safety age forces it).
function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;

  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };

  // Safety: never let the player stall in foundation past 23.
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return {
      ...p,
      phase: 'career',
      flags: addUniqueFlag(p.flags, 'undecided'),
    };
  }
  return p;
}

// Phase ordering used by maybeAdvancePhase. Foundation is omitted on purpose:
// maybeTransitionToCareer keeps sole ownership of foundation→career (it's the
// only flip that's flag-gated rather than pure-age), and this function refuses
// to touch a player still in foundation.
const LATER_PHASE_ORDER: ReadonlyArray<Exclude<Phase, 'foundation'>> = [
  'career',
  'growth',
  'freedom',
];

// Pure-age phase progression for the later life-arc flips (career→growth at
// 35, growth→freedom at 50). Resolves by AGE, not by month delta, so a
// multi-month jump still lands on the right phase. Never moves backward.
// Foundation is the exclusive domain of maybeTransitionToCareer.
function maybeAdvancePhase(p: Player): Player {
  if (p.phase === 'foundation') return p;

  // Highest table entry among {career, growth, freedom} with startAge <= age.
  let target: Exclude<Phase, 'foundation'> = 'career';
  for (const phase of LATER_PHASE_ORDER) {
    if (p.age >= PHASE_START_AGES[phase]) target = phase;
  }

  // Never move backward — if dev tools or some future code put the player on
  // a higher phase than the table would say, leave them there.
  const currentIdx = LATER_PHASE_ORDER.indexOf(
    p.phase as Exclude<Phase, 'foundation'>,
  );
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;

  return { ...p, phase: target };
}

// Pure single-month step. The store wraps it so skipToNextDecision can loop
// without going through React state per iteration. Order:
//   1) tick economy (month++, possibly age++)
//   2) expire any parked decisions whose window elapsed this month
//   3) maybe transition foundation → career
//   4) if that crossed a phase boundary, halt for the transition overlay
//   5) maybe end the run
//   6) otherwise: decide beat, maybe pick an event
function advanceMonthStep(
  player: Player,
  monthsSinceLastEvent: number,
): AdvanceResult {
  const { player: ticked, lapsed: lapsedThisStep } = expirePendingDecisions(
    tick(player),
  );
  // Foundation→career first (flag-gated, fire-once UI overlay). Then the
  // later age-based flips (career→growth at 35, growth→freedom at 50).
  const phased = maybeAdvancePhase(maybeTransitionToCareer(ticked));
  const nextMonths = monthsSinceLastEvent + 1;

  // Foundation → career, fire-once. Stamp the flag at detection so a force-
  // dismiss can't re-trigger; the store surfaces phaseTransition and the
  // UI overlay calls dismissPhaseTransition to resume.
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
      grade: null,
      phaseTransition: 'career',
      lapsedThisStep,
    };
  }

  // Career → growth and growth → freedom: same fire-once pattern as the
  // foundation→career transition, just keyed off the later age boundaries.
  // For start points that begin past these flips (e.g. midlife starts in
  // growth) ticked.phase already matches the destination, so the entry
  // guards never trigger and the overlay never fires for transitions the
  // player has already lived through.
  if (
    ticked.phase === 'career' &&
    phased.phase === 'growth' &&
    !phased.flags.includes(SEEN_GROWTH_TRANSITION_FLAG)
  ) {
    return {
      player: {
        ...phased,
        flags: addUniqueFlag(phased.flags, SEEN_GROWTH_TRANSITION_FLAG),
      },
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: false,
      endingResult: null,
      grade: null,
      phaseTransition: 'growth',
      lapsedThisStep,
    };
  }

  if (
    ticked.phase === 'growth' &&
    phased.phase === 'freedom' &&
    !phased.flags.includes(SEEN_FREEDOM_TRANSITION_FLAG)
  ) {
    return {
      player: {
        ...phased,
        flags: addUniqueFlag(phased.flags, SEEN_FREEDOM_TRANSITION_FLAG),
      },
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: false,
      endingResult: null,
      grade: null,
      phaseTransition: 'freedom',
      lapsedThisStep,
    };
  }

  if (phased.age >= phased.targetAge) {
    return {
      player: phased,
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: true,
      endingResult: evaluateEndings(phased),
      grade: computeGrade(phased),
      phaseTransition: null,
      lapsedThisStep,
    };
  }

  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMonths,
    hasPriorityEligible,
  });

  if (beat === 'quiet') return RUN_QUIET_RESULT(phased, nextMonths, lapsedThisStep);

  const event = pickEvent(eligible, beat);
  return {
    player: phased,
    monthsSinceLastEvent: nextMonths,
    currentEvent: event,
    gameOver: false,
    endingResult: null,
    grade: null,
    phaseTransition: null,
    lapsedThisStep,
  };
}

type GameState = {
  // Start-point selection — the new entry into a run. University defers
  // foundation-path selection to selectedPath; the three later starts defer
  // direction selection to selectedDirection. startGame consumes whatever
  // matching pair is present and routes through createPlayerFromStartPoint.
  selectedStartPoint: StartPointId | null;
  selectedPath: FoundationPathId | null;
  selectedDirection: StartPointDirection | null;
  player: Player | null;
  freedomPulse: number;

  // §10 beat-system state
  currentEvent: GameEvent | null;
  monthsSinceLastEvent: number;
  // True when currentEvent was opened via the pending-decisions tray rather
  // than the beat system. Resolving such a card is out-of-band: effects apply
  // and the event is marked fired, but the month is NOT advanced and
  // monthsSinceLastEvent is NOT reset.
  currentEventFromPending: boolean;

  // §12 run-end state
  gameOver: boolean;
  endingResult: Ending | null;
  grade: GradeResult | null;

  // Set when a phase boundary was crossed this tick. The UI overlays a
  // full-screen ack; user dismissal clears it and the loop resumes.
  phaseTransition: Phase | null;

  // Decisions that lapsed during the most recent advance. Accumulates across
  // months inside skipToNextDecision so nothing gets swallowed when the user
  // fast-forwards through several lapses at once. Transient: a future
  // acknowledgment surface will consume + clear this. Nothing renders yet.
  lapsedThisStep: LapsedEntry[];

  selectStartPoint: (id: StartPointId) => void;
  selectFoundationPath: (id: FoundationPathId) => void;
  selectDirection: (direction: StartPointDirection) => void;
  startGame: () => void;
  resetSelection: () => void;

  advanceMonth: () => void;
  chooseOption: (choiceId: string) => void;
  deferDecision: (eventId: string) => void;
  openPendingDecision: (eventId: string) => void;
  skipToNextDecision: () => void;
  dismissPhaseTransition: () => void;
  dismissLapses: () => void;

  // __DEV__-only: hand levers for the floating dev menu. These mutate
  // gameStore directly and bypass the engine — never invoked in release.
  devSetFreedomPct: (pct: number) => void;
  devSetPhase: (phase: Phase) => void;
  devSetAge: (age: number) => void;
  devSeedRunSummary: () => void;
  // Fires the transition overlay for the supplied phase without advancing
  // time. Used to preview phase_* scenes end-to-end in the dev menu.
  devTriggerPhaseTransition: (phase: Phase) => void;
};

const INITIAL_RUN_STATE = {
  player: null,
  currentEvent: null,
  currentEventFromPending: false,
  monthsSinceLastEvent: 0,
  freedomPulse: 0,
  gameOver: false,
  endingResult: null,
  grade: null,
  phaseTransition: null,
  lapsedThisStep: [] as LapsedEntry[],
} as const;

export const useGameStore = create<GameState>((set, get) => ({
  selectedStartPoint: null,
  selectedPath: null,
  selectedDirection: null,
  ...INITIAL_RUN_STATE,

  selectStartPoint: (id) => set({ selectedStartPoint: id }),
  selectFoundationPath: (id) => set({ selectedPath: id }),
  selectDirection: (direction) => set({ selectedDirection: direction }),

  // Spawn a player from the selected start-point + matching sub-pick.
  // university requires a foundation-path pick; the three later starts
  // require a direction. Either is a no-op if the prerequisite picker
  // hasn't been touched.
  startGame: () => {
    const startPointId = get().selectedStartPoint;
    if (!startPointId) return;
    if (startPointId === 'university') {
      const pathId = get().selectedPath;
      if (!pathId) return;
      // The university entry is byte-identical to the legacy default new run
      // — createPlayerFromStartPoint('university') routes to createPlayer
      // under the hood, and we pass the picked foundation path through.
      set({
        ...INITIAL_RUN_STATE,
        player: { ...createPlayer(pathId), startPointId: 'university' },
      });
      return;
    }
    const direction = get().selectedDirection;
    if (!direction) return;
    set({
      ...INITIAL_RUN_STATE,
      player: createPlayerFromStartPoint(startPointId, direction),
    });
  },

  // Full reset — clears every pick AND all run state. Used by the cold-boot
  // reset and "Play Again" from the run summary.
  resetSelection: () =>
    set({
      selectedStartPoint: null,
      selectedPath: null,
      selectedDirection: null,
      ...INITIAL_RUN_STATE,
    }),

  // Advance one month. If the beat system surfaces an event, stop and present
  // it; if the run ends, mark gameOver and compute the ending + grade; else
  // it's a quiet month and we just tick forward.
  advanceMonth: () =>
    set((s) => {
      if (
        !s.player ||
        s.currentEvent ||
        s.gameOver ||
        s.phaseTransition
      )
        return s;
      const step = advanceMonthStep(s.player, s.monthsSinceLastEvent);
      return {
        player: step.player,
        monthsSinceLastEvent: step.monthsSinceLastEvent,
        currentEvent: step.currentEvent,
        currentEventFromPending: false,
        gameOver: step.gameOver,
        endingResult: step.endingResult,
        grade: step.grade,
        phaseTransition: step.phaseTransition,
        // Replace, don't accumulate: a single advanceMonth IS one step.
        lapsedThisStep: step.lapsedThisStep,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  // Apply a chosen option, log the snapshot, clear the event, reset cooldown.
  // Always drops the event id from pendingDecisions (harmless no-op if it
  // wasn't parked). When the card was opened from the pending tray we apply
  // effects + mark fired but DON'T tick a new "decision month": the player's
  // beat cadence shouldn't reset just because they resolved an old decision.
  chooseOption: (choiceId) =>
    set((s) => {
      if (!s.player || !s.currentEvent || s.gameOver) return s;
      const choice = s.currentEvent.choices.find((c) => c.id === choiceId);
      if (!choice) return s;

      const after = applyChoice(s.player, s.currentEvent, choice);
      const snapshotNetWorth = Math.round(
        after.cash + after.assets + after.investments - after.debt,
      );
      const pendingDecisions = after.pendingDecisions.filter(
        (p) => p.eventId !== s.currentEvent!.id,
      );
      const fromPending = s.currentEventFromPending;

      return {
        player: {
          ...after,
          pendingDecisions,
          netWorthHistory: [...after.netWorthHistory, snapshotNetWorth],
        },
        currentEvent: null,
        currentEventFromPending: false,
        // Out-of-band resolution: preserve cadence. A normal decision still
        // resets it as before.
        monthsSinceLastEvent: fromPending ? s.monthsSinceLastEvent : 0,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  // Park the active decision: record it in pendingDecisions with a parked
  // month + expiry month, then close the card without applying any effects.
  // If the event is ALREADY parked (i.e. this card was just reopened from the
  // tray), "Decide later" just closes the card — no duplicate push, and the
  // original expiryMonth is left UNCHANGED so the player can't defer forever.
  // The card has to be closed either way; otherwise a reopened parked
  // decision would stay stuck open.
  deferDecision: (eventId) =>
    set((s) => {
      if (!s.player || !s.currentEvent || s.gameOver) return s;
      if (s.currentEvent.id !== eventId) return s;
      const window = effectiveDeferWindow(s.currentEvent);
      if (window <= 0) return s;
      const already = s.player.pendingDecisions.some(
        (p) => p.eventId === eventId,
      );
      // Belt-and-suspenders cap check. EventCard hides "Decide later" at the
      // cap so this should be unreachable from the UI; if some other caller
      // tries to park a fresh decision past 3, no-op rather than silently
      // dropping the card (which would lose the decision entirely).
      if (
        !already &&
        s.player.pendingDecisions.length >= PENDING_DECISIONS_CAP
      ) {
        return s;
      }
      const fromPending = s.currentEventFromPending;
      // Skip the push when the event is already parked (reopened from the
      // tray) — preserve the original expiryMonth, no infinite-defer loophole.
      // The card still closes either way.
      const pendingDecisions = already
        ? s.player.pendingDecisions
        : [
            ...s.player.pendingDecisions,
            {
              eventId,
              parkedMonth: s.player.month,
              expiryMonth: s.player.month + window,
            },
          ];
      return {
        player: { ...s.player, pendingDecisions },
        currentEvent: null,
        currentEventFromPending: false,
        // Same out-of-band rule as chooseOption: a reopened card already had
        // its decision-month spent when it first fired.
        monthsSinceLastEvent: fromPending ? s.monthsSinceLastEvent : 0,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  // Open a parked decision from the tray. Looks the event up in content, sets
  // it as currentEvent, and flags this presentation as out-of-band so the
  // resolve path preserves beat cadence. No-ops if there's already an active
  // event (don't trample a fresh beat) or the id isn't in pendingDecisions.
  openPendingDecision: (eventId) =>
    set((s) => {
      if (!s.player || s.currentEvent || s.gameOver) return s;
      const parked = s.player.pendingDecisions.find(
        (p) => p.eventId === eventId,
      );
      if (!parked) return s;
      const event = ALL_EVENTS.find((e) => e.id === eventId);
      if (!event) return s;
      return {
        currentEvent: event,
        currentEventFromPending: true,
      };
    }),

  // Fast-forward quiet months until the next decision, the safety cap, or
  // run-end — whichever comes first. Single state commit at the end.
  skipToNextDecision: () =>
    set((s) => {
      if (
        !s.player ||
        s.currentEvent ||
        s.gameOver ||
        s.phaseTransition
      )
        return s;
      let player = s.player;
      let monthsSinceLastEvent = s.monthsSinceLastEvent;
      let event: GameEvent | null = null;
      let gameOver = false;
      let endingResult: Ending | null = null;
      let grade: GradeResult | null = null;
      let phaseTransition: Phase | null = null;
      // Accumulate across the skipped months so a fast-forward that crosses
      // multiple lapse months doesn't lose any of them.
      const lapsedThisStep: LapsedEntry[] = [];

      for (let i = 0; i < SKIP_SAFETY_CAP; i++) {
        const step = advanceMonthStep(player, monthsSinceLastEvent);
        player = step.player;
        monthsSinceLastEvent = step.monthsSinceLastEvent;
        if (step.lapsedThisStep.length > 0) {
          lapsedThisStep.push(...step.lapsedThisStep);
        }
        if (step.gameOver) {
          gameOver = true;
          endingResult = step.endingResult;
          grade = step.grade;
          break;
        }
        if (step.phaseTransition) {
          phaseTransition = step.phaseTransition;
          break;
        }
        if (step.currentEvent) {
          event = step.currentEvent;
          break;
        }
        // Halt the fast-forward when any surviving parked decision is within
        // its nudge window, so the user can act on it before it lapses. The
        // dashboard's urgent pill uses the same predicate — keeping these in
        // lockstep means the moment Skip surfaces the dashboard, the urgent
        // signal is already visible.
        const urgent = player.pendingDecisions.some(
          (d) => d.expiryMonth - player.month <= NUDGE_WINDOW,
        );
        if (urgent) break;
      }

      return {
        player,
        monthsSinceLastEvent,
        currentEvent: event,
        currentEventFromPending: false,
        gameOver,
        endingResult,
        grade,
        phaseTransition,
        lapsedThisStep,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  dismissPhaseTransition: () => set({ phaseTransition: null }),

  // Clears the lapse acknowledgment after the player dismisses it. The
  // overlay reads lapsedThisStep; once the player closes it, the array
  // empties so it can't replay on the next render pass.
  dismissLapses: () => set({ lapsedThisStep: [] }),

  // Set freedom% by adjusting passiveIncome relative to current expenses.
  // Falls back to expenses=1 when expenses<=0 so the math still works.
  devSetFreedomPct: (pct) =>
    set((s) => {
      if (!s.player) return s;
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      const exp = s.player.expenses > 0 ? s.player.expenses : 1;
      return {
        player: {
          ...s.player,
          expenses: exp,
          passiveIncome: Math.round((clamped / 100) * exp),
        },
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  devSetPhase: (phase) =>
    set((s) => (s.player ? { player: { ...s.player, phase } } : s)),

  devSetAge: (age) =>
    set((s) => {
      if (!s.player) return s;
      const a = Math.max(18, Math.min(99, Math.round(age)));
      return { player: { ...s.player, age: a } };
    }),

  // Drop the player straight into the phase-transition overlay for the
  // supplied phase. The fire-once flag is intentionally cleared first so a
  // dev can preview the same transition repeatedly without resetting the run.
  devTriggerPhaseTransition: (phase) =>
    set((s) => {
      if (!s.player) return s;
      const flag =
        phase === 'career'
          ? SEEN_CAREER_TRANSITION_FLAG
          : phase === 'growth'
            ? SEEN_GROWTH_TRANSITION_FLAG
            : phase === 'freedom'
              ? SEEN_FREEDOM_TRANSITION_FLAG
              : null;
      const flags = flag
        ? s.player.flags.filter((f) => f !== flag)
        : s.player.flags;
      return {
        player: { ...s.player, flags },
        phaseTransition: phase,
      };
    }),

  // Seed a fully-formed run-end state so RunSummaryScreen can render even
  // when no real run has been played. Uses the current player if present;
  // otherwise spins up a default university player.
  devSeedRunSummary: () =>
    set((s) => {
      const base = s.player ?? createPlayer('university');
      const seeded: Player = {
        ...base,
        // Land the dev preview on the player's chosen target so the summary
        // labels (AGE 18 → targetAge) read coherently.
        age: base.targetAge,
        // give the summary something to look at if the player is fresh
        passiveIncome: base.passiveIncome > 0 ? base.passiveIncome : 1_400,
        expenses: base.expenses > 0 ? base.expenses : 2_400,
        cash: Math.max(base.cash, 8_000),
        investments: Math.max(base.investments, 25_000),
        skill: Math.max(base.skill, 55),
        network: Math.max(base.network, 45),
        reputation: Math.max(base.reputation, 40),
        discipline: Math.max(base.discipline, 50),
      };
      return {
        player: seeded,
        currentEvent: null,
        gameOver: true,
        endingResult: evaluateEndings(seeded),
        grade: computeGrade(seeded),
      };
    }),
}));
