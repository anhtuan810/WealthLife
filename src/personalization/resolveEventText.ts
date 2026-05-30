// Personalization rendering layer (spec §2 / §3 / §12). PURE TEXT.
//
// resolveEventText reads STRINGS ONLY from the raw event and rewrites them
// for display. It never reads or returns effects, ids, setsFlags, or
// conditions — those stay on the raw event the engine continues to consume.
// The returned shape mirrors only the visible fields the EventCard renders:
// title, fallbackText, and per-choice label / resultText.
//
// Three-tier fallback per §3:
//   1. pack[event.id]                  (v2 narrative override — unused here)
//   2. slotted template on the event   (e.g. "A transfer to {city}.")
//   3. static original text on the event (no slots → fillSlots is a no-op)
// `pack` is wired through as `undefined` for this slice so v2 can drop in
// without touching the call sites.

import type { GameEvent } from '../types/events';
import { DEFAULT_SLOTS, type Profile } from './profile';

// Per-event narrative override surface. Shape is intentionally narrow —
// strings only, mirroring the visible fields — so v2 cannot smuggle effects
// or flags through this seam. All fields are optional; missing keys fall
// through to the event's own slotted/static text.
export type EventPackEntry = {
  title?: string;
  fallbackText?: string;
  choices?: Record<string, { label?: string; resultText?: string }>;
};
export type ContentPack = Record<string, EventPackEntry>;

// Narrative slot keys — the ONLY profile fields fillSlots will substitute.
// The other Profile fields (why, workSituation) are tags, not slot strings;
// scoping the resolver here keeps them out of event copy even if a template
// accidentally references {why}.
const SLOT_KEYS: ReadonlySet<string> = new Set([
  'name',
  'city',
  'field',
  'firm',
]);

// {slot} substitution. Deterministic: same template + same profile always
// produces the same string. Unknown slots (not in SLOT_KEYS, or no value AND
// no default) are left as-is so a typo surfaces in QA rather than silently
// emptying.
export function fillSlots(
  template: string,
  profile: Profile | undefined,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!SLOT_KEYS.has(key)) return match;
    const fromProfile = profile
      ? (profile as Record<string, string>)[key]
      : undefined;
    if (fromProfile && fromProfile.length > 0) return fromProfile;
    const fromDefault = (DEFAULT_SLOTS as Record<string, string>)[key];
    return fromDefault ?? match;
  });
}

export type ResolvedChoiceText = {
  id: string;
  label: string;
  resultText?: string;
};

export type ResolvedEventText = {
  title: string;
  fallbackText?: string;
  choices: ResolvedChoiceText[];
};

export function resolveEventText(
  event: GameEvent,
  profile: Profile | undefined,
  pack: ContentPack | undefined,
): ResolvedEventText {
  const override = pack?.[event.id];

  const titleTemplate = override?.title ?? event.title;
  const fallbackTemplate = override?.fallbackText ?? event.fallbackText;

  const choices: ResolvedChoiceText[] = event.choices.map((c) => {
    const choiceOverride = override?.choices?.[c.id];
    const labelTemplate = choiceOverride?.label ?? c.label;
    const resultTemplate = choiceOverride?.resultText ?? c.resultText;
    return {
      id: c.id,
      label: fillSlots(labelTemplate, profile),
      resultText:
        resultTemplate !== undefined
          ? fillSlots(resultTemplate, profile)
          : undefined,
    };
  });

  return {
    title: fillSlots(titleTemplate, profile),
    fallbackText:
      fallbackTemplate !== undefined
        ? fillSlots(fallbackTemplate, profile)
        : undefined,
    choices,
  };
}
