# WealthLife — Art Asset Registry & GPT Image Style Bible

Living document. The code track and the art track meet here: the **asset key** is the contract.
Claude Code builds each art slot with a procedural placeholder that auto-swaps to a real PNG when
a file with the matching name lands in `src/assets/art/`. So you can generate art in any order,
in parallel with code, and nothing breaks.

Status legend: ⬜ placeholder only · 📝 brief written · 🎨 generating · ✅ integrated

---

## 0. How we use GPT Image (read once)

Rich per-event art only works if the set looks like *one* set. GPT Image drifts between
generations, so we constrain it:

1. **Generate the Style Anchor first** (`start_hero`, §2). Iterate until it's *the look*. Then in
   every later generation, **upload that approved image as a reference** and add: *"Match the
   style, palette, lighting, and mood of the attached reference exactly."* This is the single
   biggest consistency lever.
2. **Always prepend the Master Style Block** (§1) to every prompt.
3. **No text in any image.** The app draws all words itself. End every prompt with
   *"no text, no letters, no numbers, no UI, no logos, no watermark."*
4. **Backgrounds:** full-bleed scenes use a dark background on the app's near-black (#08090B).
   Overlay assets (path emblems, category accents, milestone burst, identity medallion) request a
   **transparent background**.
5. **Aspect ratio by surface:** full-screen scenes → portrait; card/header accents → square;
   wide banners → landscape. Export the largest size the tool offers and let the app downscale.
6. **Filename = asset key + `.png`**, lowercase, exactly as listed. Drop into `src/assets/art/`.

---

## 1. Master Style Block (paste at the top of every prompt)

> A premium, cinematic, dark-luxury illustration for a high-end mobile wealth-strategy game.
> Near-black background (#08090B) layered with deep charcoal gradients, soft volumetric light,
> gentle bloom, and fine film grain. Restrained and elegant — the seriousness of a Bloomberg
> terminal and the polish of Apple Wallet. Never casino, never cartoon, never bright or playful.
> Accent palette used sparingly: warm muted gold (#D9B26A), cool capital blue (#7CB8FF),
> emerald green (#2EC07A) for growth, off-white (#F5F2EA) highlights. Shallow depth of field,
> high contrast, generous negative space, modern editorial composition.

**Do:** atmosphere, single clear subject, mood through light. **Avoid:** clutter, text, faces in
sharp detail, neon overload, stock-photo realism, busy infographics.

---

## 2. Structural / hero assets (can be generated now)

| Key | Surface | Aspect / bg | Status | Prompt (append after Master Style Block + reference) |
|---|---|---|---|---|
| `start_hero` | Start screen full-bleed (the **Style Anchor — make this first**) | Portrait / dark | ⬜📝 | A lone figure seen from behind as a soft silhouette, standing small at the foot of a vast luminous financial cityscape at the blue hour, a single warm gold band of light breaking on the far horizon — the promise of freedom. Quiet, aspirational, cinematic. |
| `path_university` | Foundation-path card | Square / transparent | ⬜📝 | A glowing emblem-scene: an arched scholarly hall dissolving into light, a faint open book of light, cool blue tones with gold edge-light. Symbolic, not literal campus. |
| `path_vocational` | Foundation-path card | Square / transparent | ⬜📝 | A glowing emblem-scene: crossed hand-tools and a workbench lit by a single warm lamp, sparks of gold, grounded and capable. Symbolic. |
| `path_self_taught` | Foundation-path card | Square / transparent | ⬜📝 | A glowing emblem-scene: a lone desk in darkness lit only by a screen's cool glow, a small upward spark of gold — self-made, resourceful, slightly risky. Symbolic. |
| `path_straight_to_work` | Foundation-path card | Square / transparent | ⬜📝 | A glowing emblem-scene: an open doorway of warm light at the end of a dark commute, a city waking at dawn — immediate independence. Symbolic. |
| `phase_survival` | Phase-transition scene (Survival) | Portrait / dark | ⬜📝 | A narrow rain-slick street under cold light, a small lit window far off — tense but not hopeless. Muted, cinematic, room at top for a title. |
| `phase_stability` | Phase-transition scene (Stability) | Portrait / dark | ⬜📝 | A single warm-lit apartment window glowing against a calm dark city — the first solid ground. Quiet relief. Room at top for a title. |
| `phase_growth` | Phase-transition scene (Growth) | Portrait / dark | ⬜📝 | A city skyline beginning to rise, threaded with emerald-green light moving upward like compounding momentum. Ambitious, alive. Room at top for a title. |
| `phase_freedom` | Phase-transition scene (Freedom/Leverage) | Portrait / dark | ⬜📝 | A wide open dawn horizon seen from high above the city, gold light flooding in, the figure standing free and unhurried. Expansive, earned calm. Room at top for a title. |
| `cat_foundation` | Event-card header accent | Square / transparent | ⬜📝 | A small symbolic motif: a single seed or cornerstone resting on stone, faint gold glow. Quiet, foundational. |
| `cat_career` | Event-card header accent | Square / transparent | ⬜📝 | A small symbolic motif: ascending steps made of soft light rising into the dark, cool-blue lit. Forward, structured. |
| `cat_investing` | Event-card header accent | Square / transparent | ⬜📝 | A small symbolic motif: a single smooth upward curve of emerald light, compounding. Clean, hopeful. |
| `cat_pressure` | Event-card header accent | Square / transparent | ⬜📝 | A small symbolic motif: a low storm-cloud with a tightening band of warm amber light beneath — pressure, restrained and serious, never frightening. |
| `cat_opportunity` | Event-card header accent | Square / transparent | ⬜📝 | A small symbolic motif: a key or a narrow door of warm gold light opening in the dark. Inviting, rare. |
| `identity_medallion` | Run-end "who you became" frame | Square / transparent | ⬜📝 | An ornate but minimal circular medallion frame of thin gold and faint emerald light on transparent dark, hollow center (a procedural strength-shape sigil renders inside it). Ceremonial, premium. |
| `milestone_burst` | Freedom-unlock / milestone moment | Square / transparent | ⬜📝 | A soft radial bloom of gold-and-emerald light, fine sparks, fading to transparent at the edges. Celebratory but restrained, no confetti. |

That's 16 structural pieces. Recommended order: `start_hero` → 4 phases → 4 paths → 5 categories
→ medallion + burst.

---

## 3. Per-event illustrations (the "rich" layer — briefed during content task, Step 5)

Each event gets one illustration in the event card's art slot. To stay coherent across 30+:

- **Composition is fixed:** single symbolic subject, centered, ~4:3 or square, dark cinematic
  background, generous negative space. No people in sharp focus — silhouettes/hands/objects only.
- **Tint by category** using the accent that matches `cat_*` above (foundation = gold,
  career = blue, investing = emerald, pressure = amber, opportunity = gold-warm).
- **Prompt template:**
  > [Master Style Block] + Match the attached reference exactly. A symbolic cinematic scene
  > representing: **[one-sentence event situation]**. [category] tint. Single subject, centered,
  > dark background, generous negative space. no text, no letters, no numbers, no UI, no watermark.

Examples (pattern only — real list comes with the events):
- `event_rent_hike` → "a landlord's notice slid under a door, lit by a cold hallway light, a small warm lamp beyond" · pressure/amber.
- `event_first_etf` → "a single coin dropped into still water sending out one clean emerald ripple" · investing/emerald.
- `event_internship_offer` → "a glass office tower at dawn with one lit window, a path of blue light leading to its door" · career/blue.

When a per-event PNG doesn't exist yet, the slot shows the procedural placeholder (category glow +
line motif), so the card always looks finished.

---

## 4. Open questions / decisions to revisit
- Identity layer depth: single medallion now vs a small set of run-end emblems later (`[V1.1]`).
- Whether phase scenes animate (parallax/drift) or hold still — decide when the transition screen is built.
