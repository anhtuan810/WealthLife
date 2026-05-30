# WealthLife — Art Asset Registry & GPT Image Style Bible

Living document. The code track and the art track meet here: the **asset key** is the contract.
Each art slot ships a procedural placeholder that auto-swaps to a real PNG when a file with the
matching name lands in `src/assets/art/` AND is registered in `src/assets/art/index.ts`. So art is
generated in parallel with code, and nothing breaks.

Status legend: ⬜ placeholder only · 📝 brief written · 🎨 generating · ✅ integrated

---

## 0. How we use GPT Image (read once)

A set only works if it looks like *one* set. GPT Image drifts between generations, so we constrain it:

1. **Generate the Style Anchor first** (`start_hero`, §2). Iterate until it's *the look*. Then on
   every later generation **upload that approved image as a reference** and add: *"Match the style,
   palette, lighting, and mood of the attached reference exactly."* Biggest consistency lever.
2. **Always prepend the Master Style Block** (§1).
3. **No text from the model.** End every prompt with *"no text, no letters, no numbers, no UI, no
   logos, no watermark."* (Founder note: incidental document text in event scenes is acceptable —
   lean in rather than hide AI — but compose with clear negative space where the card's UI text
   overlays.)
4. **Backgrounds:** full-scene art is bright (cream paper for riso). Overlay assets (medallion,
   accents, burst) request a transparent center/background.
5. **Aspect by surface:** event cards → **landscape 3:2 (1536×1024), subject UPPER-CENTER**; hero →
   portrait full-bleed; overlays → square. Export large; the app downscales.
6. **Filename = asset key + `.png`**, lowercase. Drop into `src/assets/art/` AND add a `require`
   line to `src/assets/art/index.ts` (or it shows the placeholder).

### Direction history

1. **v1 — Bright golden-hour photoreal** (initial MVP push). Locked across
   the 26 originally-shipped event PNGs + start_hero + phase_career. Validated
   across the emotional range incl. pressure beats. Shipped and worked, but
   the founder concluded the AI-generated photoreal look had become the
   market's default tell for "AI art" and didn't differentiate the game.

2. **v2 — Risograph / editorial print (CURRENT, locked).** Pivoted on
   2026-05-27. Limited spot-color palette (gold #D9B26A, dawn-blue
   #7CB8FF, deep ink #08090B, cream paper #F5F2EA), heavy halftone grain,
   subtle misregistration, magazine-spot-illustration energy. Hides AI
   fingerprints, on-trend with the 2026 print-revival editorial moment,
   lines up with the locked "mature, calm, premium" tone (§4). Anchor:
   start_hero.png. All 58 events + hero + medallion + phase_career
   regenerated in this direction.

   Pipeline rule: every generation re-uploads start_hero.png as the
   reference image. Batch-mode (single ChatGPT thread, multiple images)
   was tried and failed — the model anchored on its own first generation
   and reproduced it instead of following subsequent scene lines. One
   image per generation with reference re-upload is the only reliable
   path for this style.

---

## 1. Master Style Block — RISO (paste at the top of every full-scene prompt)

> A premium editorial illustration in RISOGRAPH PRINT style for a high-end
> mobile wealth-strategy life sim. Limited spot-color palette of warm gold
> (#D9B26A), soft dawn-blue (#7CB8FF), and deep ink near-black (#08090B), on
> a cream paper background (#F5F2EA). Visible halftone dot texture and soft
> grain throughout. Subtle misregistration where colors overlap, the way real
> riso prints layer. Restrained, intentional, crafted. Magazine-cover energy
> — the polish of a New Yorker or Monocle spot illustration in print form.
> Mature, calm, premium. Never casino, never cartoon, never children's-book,
> never corporate explainer.

**Overlay/transparent variant:** drop the scene/background language; end with *"Isolated subject on
a fully transparent background (alpha), no scene — just the motif on transparent. Export PNG with
transparency."*

### v1 archive — Bright golden-hour (superseded 2026-05-27)

Preserved for reference only. Do not use for new generations.

> A premium, cinematic, luminous illustration for a high-end mobile wealth-strategy game. Bright,
> hopeful, aspirational golden-hour atmosphere — warm natural sunlight, soft volumetric light,
> gentle bloom, a touch of fine grain, airy and open. Elegant and restrained — the polish of Apple
> brand photography and the calm confidence of premium finance. Never casino, never cartoon, never
> oversaturated, never stock-photo cheese; tasteful, editorial, atmospheric, real. Luminous palette:
> warm gold sunlight (#D9B26A), soft dawn-blue sky (#7CB8FF), natural green (#2EC07A) in foliage and
> growth, generous off-white / cream highlights (#F5F2EA). High-key but cinematic, soft shadows,
> shallow depth of field, generous negative space, modern editorial composition.

---

## 2. Structural / hero assets

| Surface | Aspect | Status | Notes |
|---|---|---|---|
| `start_hero` | Portrait full-bleed | ✅ riso | The set's style anchor. Re-upload on every other generation. |
| `event_*` (×58) | Landscape 3:2 (1536×1024) | ✅ riso | 26 original + 32 gap-fill = 58, all in riso. Subject upper-center. |
| `identity_medallion` | — | 🗑 RETIRED | RunSummaryScreen medallion is now procedural — a thin gold ring + warm halo composed in Skia around the StrengthSigil radar grid. PNG no longer used; asset deleted, registry entry removed. Historical note: PNG transparency was the blocker (GPT Image bg unreliable) — solved via luminance-keyed background removal before the procedural switch made the asset unnecessary. |
| `phase_career` | Portrait full-bleed | ✅ riso | Single MVP phase-transition scene. Fires once at foundation→career flip (age ~22). |
| `phase_survival` / `phase_stability` / `phase_growth` / `phase_freedom` | Portrait full-bleed | ⏸ V1.1 | See §5 deferral rationale. |
| `cat_*` accents | n/a | ✕ CUT | Redundant with ArtSlot's procedural category glyphs. Decision: do not produce. |
| Direction-transition art (corporate/founder/freelancer variants) | Portrait full-bleed | ⏸ V1.1 | phase_career fills this role generically for MVP. Per-direction variants for V1.1. |

---

## 3. Event coverage

Total events in `src/content/events/`: **58 + 14 late-life (Phase 2 brief)**
Events with riso art: **58 (100%) — late-life slots ⬜ placeholder only**
Last audit: 2026-05-27 (foundation/career) · 2026-05-30 (late-life slots logged)

The original 26 (registered at MVP start) and the 32 gap-fill events
(added 2026-05-27 after audit) are all in the v2 riso direction.

### Phase 2 late-life slots (status: ⬜ placeholder only)

Per the Phase 2 content brief, growth/freedom events ship with art keys
that auto-fall-back to ArtSlot's procedural placeholder until PNGs land.
The placeholder is the contract; bundling does not require the PNG.
Founder generation subjects below (one-line briefs from §2/§3 of the
content brief).

Growth phase (35–50):
- `growth_index_habit` ⬜ — a single seed sprouting into a thin gold line-chart. Tint: emerald.
- `growth_lifestyle_creep` ⬜ — a golden doorway opening to a larger room. Tint: gold.
- `growth_market_correction` ⬜ — a gold candlestick line dipping then steadying. Tint: blue.
- `growth_real_estate` ⬜ — a small house with a thin gold income-stream arc rising from it. Tint: emerald.
- `growth_career_plateau` ⬜ — a staircase whose top steps fade into haze. Tint: gold.
- `growth_health_reckoning` ⬜ — a single sunlit running path through trees. Tint: blue.
- `growth_corp_golden_handcuffs` ⬜ — a gilded watch/cuff with a gold key beside it. Tint: gold.
- `growth_founder_exit_window` ⬜ — an open gold door at the end of a runway. Tint: emerald.
- `growth_freelancer_productize` ⬜ — a single tool casting a long gold shadow shaped like a coin stack. Tint: emerald.

Freedom phase (50–60):
- `freedom_work_optional` ⬜ — a chair turned toward an open golden window. Tint: gold.
- `freedom_drawdown_question` ⬜ — a gold vessel pouring a thin steady stream. Tint: emerald.
- `freedom_sequence_risk` ⬜ — a gold tightrope near a lit platform. Tint: blue.
- `freedom_late_bloomers_sprint` ⬜ — a single figure-less track curving uphill into gold light. Tint: gold.
- `freedom_optionality` ⬜ — an open gold hand releasing light. Tint: emerald.

Phase-transition scenes still needed:
- `phase_growth` ⬜ — same hero-art treatment as `phase_career`; opens "THE GROWTH YEARS" beat.
- `phase_freedom` ⬜ — same treatment; opens "WITHIN REACH" beat.

Three near-duplicate events share theme but render as separate images
for now:
- `university_income_relief_debt`
- `university_income_relief_lowsalary`
- `university_income_relief_stress`

(Optional optimization: collapse to one shared PNG via `index.ts`. Not
done yet; defer until art-content cost matters.)

To re-audit coverage in future sessions, the read-only CC prompt that
produces the event/art coverage table is preserved in the chat history
of the 2026-05-27 session and is reproducible from event content.

---

## 4. Code contract notes (so art and code don't desync)

- **ArtSlot `<Image>` must have explicit `width:'100%'` + `height:'100%'`** alongside absolute
  insets — NOT `StyleSheet.absoluteFill` alone. Without explicit dims, RN's Image lays out at
  intrinsic size anchored top-left and `cover` is bypassed (this caused a long debugging session;
  now fixed in both ArtSlot and HeroBackdrop).
- **Reload after asset changes:** Metro caches assets; a dev build bakes them into the native
  binary. Overwriting a PNG needs `npx expo run:ios` (rebuild) or `npx expo start -c` + reinstall —
  not a plain reload. Stale image after restart = cache/binary, never a framing bug.
- The `ART` map in `index.ts` must have one `require` line per PNG; the key = filename minus `.png`.

### IdentityMedallion PNG-frame render path (resolved 2026-05-27)

**Symptom:** Run Summary screen showed only the procedural StrengthSigil; the
PNG frame did not render. Overwriting the PNG with different files produced
zero visible change.

**Root cause:** Two layers compounded — (a) GPT Image's PNG transparency
is unreliable and the medallion frame shipped with an opaque black
background, making it nearly invisible over the dark chrome; (b) the
component's render branch had a sizing/z-order issue that meant even a
properly-transparent PNG didn't composite correctly.

**Fix:** Luminance-key the black-bg PNG to alpha (ImageMagick or any tool
that supports alpha keying) BEFORE saving as the final asset. On the
component side, ensure the `<Image>` has explicit width/height (not just
`StyleSheet.absoluteFill`) and the z-order draws the frame above any
procedural bounding circle StrengthSigil produces.

**Lesson:** For any overlay-style art slot (transparent center, edge
ornament), validate transparency in isolation against the app chrome
color BEFORE registering in the ART map. The composited preview is the
only honest check.

---

## 5. Decisions on record

### Phase-transition scene scope (decided 2026-05-27)

**Decision:** MVP ships with exactly ONE phase-transition scene
(`phase_career`) at the foundation→career flip around age 22. The four
emotional-arc band scenes (`phase_survival` / `phase_stability` /
`phase_growth` / `phase_freedom`) are deferred to V1.1.

**Why:** A freedom-trace investigation on 2026-05-27 showed
`freedomPct` sits near 0 across the entire 18–25 MVP slice in a
representative run. The four band scenes would key off `freedomPct`
threshold crossings, but those crossings don't happen — passive income
in the MVP slice is too scarce relative to monthly expenses for
`freedomPct` to climb meaningfully. The Survival→Freedom emotional arc is
inherently a full-lifespan feature; the 18–25 MVP slice doesn't have the
horizon for it. Foundation→career at 22 is the ONE transition that
happens reliably in every run and is meaningful enough to warrant a
full-screen scene.

**If revisited in V1.1:** When career-phase content extends and runs reach
age 35+ (Phase 3, currently FUTURE per §6), regenerate the four band
scenes and key them off `freedomPct` band-crossings using the existing
DevMenu FREEDOM% chips as the test harness. The naming reconciliation
worth recording: the `phase` field is foundation/career/growth/freedom, but
the art-key arc is survival/stability/growth/freedom (the emotional arc,
not the structural phase). For V1.1, scenes key off the emotional arc
(freedomPct bands), not the structural phase field.

### `cat_*` category accents (decided 2026-05-27)

**Decision:** CUT for MVP. Do not produce.

**Why:** ArtSlot's procedural category glyphs already convey category
visually. Adding illustrated category accents would duplicate the signal
at no clarity gain. Five images of overbuild avoided.

### Art direction (decided 2026-05-27)

**Decision:** Locked riso/printmaking. See §0 direction history and §1
master style block.

### Per-event illustration vs procedural placeholder

**Decision:** Placeholder is a legitimate ship state for the long tail.
If V1.2+ adds new events, art is encouraged but not blocking — the
procedural placeholder reads as "moment without illustration," not as
broken. The asset-key contract means a new event can ship without art
and gain art later via a single asset drop, no code change.

---

## 6. Open questions

- Identity layer depth: single medallion now vs a run-end emblem set later (`[V1.1]`).
