// Personalization profile (spec §4 / §5). PURE TEXT INPUT — never read by
// the engine. Used only by resolveEventText to fill {slot} tokens in display
// strings, and by the why-copy framework for opening + ending narration.
// Slot defaults live alongside the type so a missing or partial profile
// still produces grammatical sentences.

// `why` and `workSituation` carry tags, not slot strings. They are NEVER
// referenced as {slot} keys by any event template, so fillSlots can keep
// reading the profile as a flat string map without leaking these into copy.

export type WhyTag =
  | 'people'    // More time with people I love
  | 'build'     // Build something of my own
  | 'security'  // Stop worrying
  | 'world'     // See the world
  | 'breathe'   // Just breathe
  | 'unset';    // skipped or free-text (v2 may AI-personalize)

export type WorkSituation =
  | 'student'   // → profile_student
  | 'working'   // → profile_working
  | 'building'  // → profile_building (founder / freelancer / making a thing)
  | 'between'   // → profile_between (between jobs / pause)
  | 'unset';    // skipped — no flag is written

export const WORK_SITUATION_FLAG: Record<
  Exclude<WorkSituation, 'unset'>,
  string
> = {
  student: 'profile_student',
  working: 'profile_working',
  building: 'profile_building',
  between: 'profile_between',
};

export type Profile = {
  name: string;   // {name} — narrator/second-person tag
  city: string;   // {city} — where the player lives
  field: string;  // {field} — career field / discipline
  firm: string;   // {firm} — current employer / firm
  why: WhyTag;          // opening DESIRE + ending reflection lookup
  workSituation: WorkSituation; // → one player.flags entry at run start
};

// Neutral fallback for each slot. The rule from §12: read naturally when
// nothing personal is known. "{firm} offered a transfer to {city}" with the
// defaults below renders "your firm offered a transfer to your city" —
// grammatical, second-person, no obvious gap.
export const DEFAULT_SLOTS: Profile = {
  name: 'you',
  city: 'your city',
  field: 'your field',
  firm: 'your firm',
  why: 'unset',
  workSituation: 'unset',
};

// Dev-stubbed profile. Hard-coded constant — used ONLY by the personalization
// identity self-check (checkPersonalizationIdentity). The values are chosen
// so a slotted event reads visibly differently from the default-only render.
// The live runtime feeds the player's onboarding-derived profile through the
// gameStore instead.
export const DEV_STUB_PROFILE: Profile = {
  name: 'Mai',
  city: 'Hanoi',
  field: 'product design',
  firm: 'Volt Studio',
  why: 'build',
  workSituation: 'working',
};
