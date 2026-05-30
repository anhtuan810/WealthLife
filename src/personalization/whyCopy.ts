// Why-copy framework data tables (docs/WealthLife_why_copy_framework.md §2 + §3).
// All authored — no AI, no network, fully local.
//
// PURE TEXT. None of this is read by the engine; the rendering layer pulls
// the right strings at the right beat (opening intro after onboarding,
// run-end reflection appended to the existing grade-keyed ending narrative).

import type { Ending } from '../types/events';
import type { GradeLetter } from '../systems/grade';
import type { StartPointId } from '../data/startPoints';
import { START_POINT_BY_ID } from '../data/startPoints';
import { fillSlots } from './resolveEventText';
import type { Profile, WhyTag } from './profile';

export type Band = 'free' | 'partial' | 'short';

// Distress endings (burnout / burned through) override the grade-derived
// band straight to `short` — the framework's "honest dignity, never shame"
// rule lives here, not in the grade. Burned-through and burnout-warning
// rows in content/endings.ts use these id prefixes.
function isDistressEnding(endingId: string): boolean {
  return (
    endingId.startsWith('end_burned_through') ||
    endingId.startsWith('burnout_warning')
  );
}

// Read the result, derive the band. PURE READ — must NEVER alter grade or
// ending. Identity-check (checkPersonalizationIdentity) guarantees this by
// re-running the engine with vs without a profile and comparing traces.
export function bandForResult(grade: GradeLetter, ending: Ending): Band {
  if (isDistressEnding(ending.id)) return 'short';
  if (grade === 'S' || grade === 'A') return 'free';
  if (grade === 'B' || grade === 'C') return 'partial';
  return 'short'; // D
}

// PLACE — shared, start-aware. Verbatim from framework §2.
// Early (22) and Established (26) share the same generic template that
// reads the start age via the {age} slot; the 18- and 38-year-old variants
// hard-code their ages because the framework wrote them that way.
export const OPENING_PLACE: Record<StartPointId, string> = {
  university:
    "Eighteen, in {city}. Everything's ahead of you, and none of it is decided yet.",
  early:
    "You're {age}, in {city}, with the shape of your life still up to you.",
  established:
    "You're {age}, in {city}, with the shape of your life still up to you.",
  midlife:
    "Thirty-eight, in {city}. Half the game is behind you — the half still ahead is the half that counts.",
};

// DESIRE — per `why`, the heart of the opening. Verbatim from framework §2.
export const WHY_OPENINGS: Record<WhyTag, string> = {
  people:
    "If you let yourself say it plainly: you don't want a bigger number, you want to stop missing things. The dinners, the ordinary Tuesdays, the people who won't always be a phone call away. To you, freedom means being *there*.",
  build:
    "You've always half-suspected you're meant to make something — not just earn, but build a thing that's yours and outlasts the paycheck. To you, freedom is the room to bet on that.",
  security:
    "You're not chasing yachts. You want the knot in your chest to loosen — to open a bill without flinching, to sleep without doing the math. To you, freedom is the quiet after the worry.",
  world:
    "There's a map in your head with too many empty places on it. You don't want to be rich, you want to be *able to go* — to say yes before the moment passes. To you, freedom is an open door.",
  breathe:
    "You're tired in a way money is supposed to fix and never quite does. What you want is space — to slow down, to stop running, to feel your own life instead of chasing it. To you, freedom is room to breathe.",
  unset:
    "You're not sure yet exactly what you're building toward — only that you want a life that feels like *yours*, with room to choose. That's enough to begin with.",
};

// QUESTION — shared, used as the third beat of the opening. Verbatim from §2.
export const QUESTION_LINE =
  'The years between here and sixty answer one question — whether you get there. They start now.';

// ENDING — `why` × outcome band. Verbatim from framework §3.
export const WHY_ENDINGS: Record<WhyTag, Record<Band, string>> = {
  people: {
    free:
      "And the thing you actually wanted is yours. The mornings aren't borrowed anymore. You're *there* — for the ordinary, unremarkable hours that turned out to be the whole point.",
    partial:
      "You didn't buy back all of it. But you bought back more than most people ever do — and somewhere in here you learned which hours to guard with both hands.",
    short:
      'The time stayed expensive, and you know it. But you spent these years clear about what you were trying to buy — and that clarity is worth carrying into the ones still ahead.',
  },
  build: {
    free:
      "And you got the room to build it. Whatever you made of these years, it's *yours* — it carries your fingerprints, not someone else's logo.",
    partial:
      "You didn't get all the way to your own thing — but you stopped being only someone else's. You proved you could make something. That proof doesn't expire.",
    short:
      'What you meant to build is still mostly an idea. But you spent these years refusing to forget it existed, and ideas that survive that long have a way of finding their moment.',
  },
  security: {
    free:
      'And the knot is gone. You open the bills without flinching now. The quiet you were chasing was real, and you live inside it.',
    partial:
      'The worry is quieter than it was — not silent, but it no longer runs the room. You built enough floor under yourself to stand without bracing.',
    short:
      "The quiet didn't fully come. But you understand the math now in a way eighteen-year-old you never did — and understanding is where worry finally starts to lose.",
  },
  world: {
    free:
      'And the door is open. The map has fewer empty places on it now, and you can still say yes before the moment passes.',
    partial:
      "You didn't reach everywhere. But you *went* — further than the version of you at the start dared believe — and you kept the door from closing.",
    short:
      "Most of the map stayed empty. But you never stopped believing you'd be *able to go* — and that belief is the part that eventually books the ticket.",
  },
  breathe: {
    free:
      "And you can breathe. You stopped running somewhere back there, and the life you were chasing turned out to be the one you're simply living now.",
    partial:
      'Not fully unclenched, but not sprinting either. You found some of the room you needed — enough to feel your own days again.',
    short:
      "The breath didn't fully come; the running mostly continued. But you know now that you wanted to stop — and naming it is how people eventually do.",
  },
  unset: {
    free:
      'And the life you built feels like *yours* — chosen, not defaulted into. Whatever you were reaching for, you got close enough to know it when you saw it.',
    partial:
      "Not finished, not quite free — but yours in a way it wasn't at the start. You made choices. They added up to something.",
    short:
      "It didn't come together the way you'd have wanted. But a life spent making your own choices, even the hard ones, is a different thing from one that merely happened to you.",
  },
};

// Pre-fill the {age} slot from the start-point table, then run the result
// through fillSlots for {name} / {city} / {field} / {firm}. Two-pass keeps
// fillSlots itself ignorant of start-point context.
function fillWithAge(
  template: string,
  startPointId: StartPointId,
  profile: Profile | undefined,
): string {
  const age = String(START_POINT_BY_ID[startPointId].startAge);
  const withAge = template.replace(/\{age\}/g, age);
  return fillSlots(withAge, profile);
}

// Resolved opening — three lines, all slot-filled, in the framework order:
// PLACE → DESIRE → QUESTION.
export type ResolvedOpening = {
  place: string;
  desire: string;
  question: string;
};

export function resolveOpening(
  startPointId: StartPointId,
  profile: Profile | undefined,
): ResolvedOpening {
  const why: WhyTag = profile?.why ?? 'unset';
  return {
    place: fillWithAge(OPENING_PLACE[startPointId], startPointId, profile),
    desire: fillSlots(WHY_OPENINGS[why], profile),
    question: fillSlots(QUESTION_LINE, profile),
  };
}

// Resolved why-ending line — appended below the existing grade-keyed
// ending copy on RunSummaryScreen. Returns undefined if no profile is
// present (won't happen in normal play, but keeps the render safe for the
// dev-seed path which may set up a run without onboarding).
export function resolveWhyEnding(
  profile: Profile | undefined,
  grade: GradeLetter,
  ending: Ending,
): string {
  const why: WhyTag = profile?.why ?? 'unset';
  const band = bandForResult(grade, ending);
  return fillSlots(WHY_ENDINGS[why][band], profile);
}
