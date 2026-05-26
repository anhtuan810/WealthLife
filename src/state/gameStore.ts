import { create } from 'zustand';
import type { FoundationPathId } from '../data/foundationPaths';
import {
  DIRECTIONAL_FLAGS,
  END_AGE,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
} from '../data/constants';
import { createPlayer, type Player } from '../game/player';
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
import { computeGrade, type GradeResult } from '../systems/grade';

const SKIP_SAFETY_CAP = 24;

type AdvanceResult = {
  player: Player;
  monthsSinceLastEvent: number;
  currentEvent: GameEvent | null;
  gameOver: boolean;
  endingResult: Ending | null;
  grade: GradeResult | null;
};

const RUN_QUIET_RESULT = (
  player: Player,
  monthsSinceLastEvent: number,
): AdvanceResult => ({
  player,
  monthsSinceLastEvent,
  currentEvent: null,
  gameOver: false,
  endingResult: null,
  grade: null,
});

function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
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

// Pure single-month step. The store wraps it so skipToNextDecision can loop
// without going through React state per iteration. Order:
//   1) tick economy (month++, possibly age++)
//   2) maybe transition foundation → career
//   3) maybe end the run
//   4) otherwise: decide beat, maybe pick an event
function advanceMonthStep(
  player: Player,
  monthsSinceLastEvent: number,
): AdvanceResult {
  const ticked = tick(player);
  const phased = maybeTransitionToCareer(ticked);
  const nextMonths = monthsSinceLastEvent + 1;

  if (phased.age >= END_AGE) {
    return {
      player: phased,
      monthsSinceLastEvent: nextMonths,
      currentEvent: null,
      gameOver: true,
      endingResult: evaluateEndings(phased),
      grade: computeGrade(phased),
    };
  }

  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriorityEligible = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMonths,
    hasPriorityEligible,
  });

  if (beat === 'quiet') return RUN_QUIET_RESULT(phased, nextMonths);

  const event = pickEvent(eligible, beat);
  return {
    player: phased,
    monthsSinceLastEvent: nextMonths,
    currentEvent: event,
    gameOver: false,
    endingResult: null,
    grade: null,
  };
}

type GameState = {
  selectedPath: FoundationPathId | null;
  player: Player | null;
  freedomPulse: number;

  // §10 beat-system state
  currentEvent: GameEvent | null;
  monthsSinceLastEvent: number;

  // §12 run-end state
  gameOver: boolean;
  endingResult: Ending | null;
  grade: GradeResult | null;

  selectFoundationPath: (id: FoundationPathId) => void;
  startGame: () => void;
  resetSelection: () => void;

  advanceMonth: () => void;
  chooseOption: (choiceId: string) => void;
  skipToNextDecision: () => void;
};

const INITIAL_RUN_STATE = {
  player: null,
  currentEvent: null,
  monthsSinceLastEvent: 0,
  freedomPulse: 0,
  gameOver: false,
  endingResult: null,
  grade: null,
} as const;

export const useGameStore = create<GameState>((set, get) => ({
  selectedPath: null,
  ...INITIAL_RUN_STATE,

  selectFoundationPath: (id) => set({ selectedPath: id }),

  startGame: () => {
    const id = get().selectedPath;
    if (!id) return;
    set({
      ...INITIAL_RUN_STATE,
      player: createPlayer(id),
    });
  },

  // Full reset — clears the path selection AND all run state. Used by both
  // the cold-boot reset and "Play Again" from the run summary.
  resetSelection: () =>
    set({
      selectedPath: null,
      ...INITIAL_RUN_STATE,
    }),

  // Advance one month. If the beat system surfaces an event, stop and present
  // it; if the run ends, mark gameOver and compute the ending + grade; else
  // it's a quiet month and we just tick forward.
  advanceMonth: () =>
    set((s) => {
      if (!s.player || s.currentEvent || s.gameOver) return s;
      const step = advanceMonthStep(s.player, s.monthsSinceLastEvent);
      return {
        player: step.player,
        monthsSinceLastEvent: step.monthsSinceLastEvent,
        currentEvent: step.currentEvent,
        gameOver: step.gameOver,
        endingResult: step.endingResult,
        grade: step.grade,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  // Apply a chosen option, log the snapshot, clear the event, reset cooldown.
  chooseOption: (choiceId) =>
    set((s) => {
      if (!s.player || !s.currentEvent || s.gameOver) return s;
      const choice = s.currentEvent.choices.find((c) => c.id === choiceId);
      if (!choice) return s;

      const after = applyChoice(s.player, s.currentEvent, choice);
      const snapshotNetWorth = Math.round(
        after.cash + after.assets + after.investments - after.debt,
      );

      return {
        player: {
          ...after,
          netWorthHistory: [...after.netWorthHistory, snapshotNetWorth],
        },
        currentEvent: null,
        monthsSinceLastEvent: 0,
        freedomPulse: s.freedomPulse + 1,
      };
    }),

  // Fast-forward quiet months until the next decision, the safety cap, or
  // run-end — whichever comes first. Single state commit at the end.
  skipToNextDecision: () =>
    set((s) => {
      if (!s.player || s.currentEvent || s.gameOver) return s;
      let player = s.player;
      let monthsSinceLastEvent = s.monthsSinceLastEvent;
      let event: GameEvent | null = null;
      let gameOver = false;
      let endingResult: Ending | null = null;
      let grade: GradeResult | null = null;

      for (let i = 0; i < SKIP_SAFETY_CAP; i++) {
        const step = advanceMonthStep(player, monthsSinceLastEvent);
        player = step.player;
        monthsSinceLastEvent = step.monthsSinceLastEvent;
        if (step.gameOver) {
          gameOver = true;
          endingResult = step.endingResult;
          grade = step.grade;
          break;
        }
        if (step.currentEvent) {
          event = step.currentEvent;
          break;
        }
      }

      return {
        player,
        monthsSinceLastEvent,
        currentEvent: event,
        gameOver,
        endingResult,
        grade,
        freedomPulse: s.freedomPulse + 1,
      };
    }),
}));
