# WealthLife — Opening & ending copy framework: spending the `why`

_The narrative spine. Onboarding captures a `why` (what freedom is *for*); the opening plants it,
the ending pays it back. Turns the grade screen into a resolution. All authored — no AI needed for
v1. Authored by Claude._

---

## 0. The idea in one line

A story is a desire, tested, and answered. Onboarding gives you the desire (`why`). The opening
states it out loud so the player owns it. The ending answers it honestly against what happened.
Everything between is the test you already built.

---

## 1. The `why` set

From onboarding Q5. Five tags + a fallback. Each maps to a real facet of the core fantasy:

| tag | onboarding option | facet of freedom |
|---|---|---|
| `people` | More time with people I love | buy back time |
| `build` | Build something of my own | create / ambition |
| `security` | Stop worrying | reduce money stress |
| `world` | See the world | optionality |
| `breathe` | Just breathe | escape the pressure |
| `unset` | (skipped, or free-text) | "a life that's mine" |

Free-text answers route to `unset` for v1 (warm but non-specific). v2 can AI-personalize free text.

---

## 2. The opening — PLACE → DESIRE → QUESTION

Three beats. PLACE and QUESTION are shared slotted frames (start-age-aware); DESIRE is the per-`why`
payload — that's where the personalization concentrates.

**PLACE (shared, start-aware):**
- university (18): "Eighteen, in {city}. Everything's ahead of you, and none of it is decided yet."
- early (22) / established (26): "You're {age}, in {city}, with the shape of your life still up to you."
- midlife (38): "Thirty-eight, in {city}. Half the game is behind you — the half still ahead is the half that counts."

**DESIRE (per `why` — the heart):**

- `people` — "If you let yourself say it plainly: you don't want a bigger number, you want to stop missing things. The dinners, the ordinary Tuesdays, the people who won't always be a phone call away. To you, freedom means being *there*."
- `build` — "You've always half-suspected you're meant to make something — not just earn, but build a thing that's yours and outlasts the paycheck. To you, freedom is the room to bet on that."
- `security` — "You're not chasing yachts. You want the knot in your chest to loosen — to open a bill without flinching, to sleep without doing the math. To you, freedom is the quiet after the worry."
- `world` — "There's a map in your head with too many empty places on it. You don't want to be rich, you want to be *able to go* — to say yes before the moment passes. To you, freedom is an open door."
- `breathe` — "You're tired in a way money is supposed to fix and never quite does. What you want is space — to slow down, to stop running, to feel your own life instead of chasing it. To you, freedom is room to breathe."
- `unset` — "You're not sure yet exactly what you're building toward — only that you want a life that feels like *yours*, with room to choose. That's enough to begin with."

**QUESTION (shared):** "The years between here and sixty answer one question — whether you get
there. They start now."

---

## 3. The ending — `why` × outcome band

The ending screen keeps its existing grade-based header (what *happened*), then closes with the
`why` reflection below (what it *meant*). Three outcome bands, derived from the result you already
compute:

- `free` — freedom reached (S / A, freedom bar met)
- `partial` — real progress, not free (B / C)
- `short` — fell short / distress (D / distress ending)

The matrix (15 cells). **Read the `short` row carefully — its job is honest dignity, never shame.**

### `people`
- **free:** "And the thing you actually wanted is yours. The mornings aren't borrowed anymore. You're *there* — for the ordinary, unremarkable hours that turned out to be the whole point."
- **partial:** "You didn't buy back all of it. But you bought back more than most people ever do — and somewhere in here you learned which hours to guard with both hands."
- **short:** "The time stayed expensive, and you know it. But you spent these years clear about what you were trying to buy — and that clarity is worth carrying into the ones still ahead."

### `build`
- **free:** "And you got the room to build it. Whatever you made of these years, it's *yours* — it carries your fingerprints, not someone else's logo."
- **partial:** "You didn't get all the way to your own thing — but you stopped being only someone else's. You proved you could make something. That proof doesn't expire."
- **short:** "What you meant to build is still mostly an idea. But you spent these years refusing to forget it existed, and ideas that survive that long have a way of finding their moment."

### `security`
- **free:** "And the knot is gone. You open the bills without flinching now. The quiet you were chasing was real, and you live inside it."
- **partial:** "The worry is quieter than it was — not silent, but it no longer runs the room. You built enough floor under yourself to stand without bracing."
- **short:** "The quiet didn't fully come. But you understand the math now in a way eighteen-year-old you never did — and understanding is where worry finally starts to lose."

### `world`
- **free:** "And the door is open. The map has fewer empty places on it now, and you can still say yes before the moment passes."
- **partial:** "You didn't reach everywhere. But you *went* — further than the version of you at the start dared believe — and you kept the door from closing."
- **short:** "Most of the map stayed empty. But you never stopped believing you'd be *able to go* — and that belief is the part that eventually books the ticket."

### `breathe`
- **free:** "And you can breathe. You stopped running somewhere back there, and the life you were chasing turned out to be the one you're simply living now."
- **partial:** "Not fully unclenched, but not sprinting either. You found some of the room you needed — enough to feel your own days again."
- **short:** "The breath didn't fully come; the running mostly continued. But you know now that you wanted to stop — and naming it is how people eventually do."

### `unset`
- **free:** "And the life you built feels like *yours* — chosen, not defaulted into. Whatever you were reaching for, you got close enough to know it when you saw it."
- **partial:** "Not finished, not quite free — but yours in a way it wasn't at the start. You made choices. They added up to something."
- **short:** "It didn't come together the way you'd have wanted. But a life spent making your own choices, even the hard ones, is a different thing from one that merely happened to you."

---

## 4. Tone rules (non-negotiable)

- Mature, concise, slightly cinematic. Second person. No fake-motivational quotes, no lecturing,
  no finance-class voice. (The plan's own tone bar: "respect the player's intelligence.")
- **The `short` band never shames.** Money outcomes are raw; a player who fell short gets honesty
  and dignity and a forward look — never "you failed." The aspirational tone survives loss.
- Weave slots (`{name}`, `{city}`) *lightly* — one touch per passage, not stuffed.
- The DESIRE and its matching ending must rhyme: the ending should echo an image from the opening
  (the "borrowed mornings," the "open door," "the knot") so the player feels the loop close.

---

## 5. How it plugs into the architecture (from the personalization spec)

- **Opening:** a personalized opening moment after onboarding, before the first beat. Data =
  `OPENING_PLACE[startId]` + `WHY_OPENINGS[why]` + shared QUESTION, run through `fillSlots`. Render
  as a dedicated intro screen or a special framed card.
- **Ending:** `band = f(grade/ending)` (S,A→free · B,C→partial · D/distress→short). Append
  `WHY_ENDINGS[why][band]` (slot-filled) beneath the existing grade-keyed ending narrative on
  RunSummaryScreen. It *adds* to the current ending copy; it doesn't replace it.
- **Fallback:** `why` unset/free-text → the `unset` row. Both tables are plain authored data — no
  AI, no network, fully local. (v2: AI personalizes free-text `why` into the same slots.)
- This is pure text: band derivation reads the grade you already compute; nothing here touches
  effects, selection, or the score.

---

## 6. Why this is the highest-leverage copy in the game

Every other line describes a *situation*. These two moments describe the *player*. The opening is
the first time the game has a protagonist with a stated desire; the ending is the first time a run
*resolves* instead of merely scoring. Spend real care on these ~20 lines — they're what makes
someone say "this game knew what I was after," which is the whole reason the personalization idea
is worth building.
