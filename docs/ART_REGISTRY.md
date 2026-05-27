# WealthLife — Art Asset Registry & GPT Image Style Bible

Living document. The code track and the art track meet here: the **asset key** is the contract.
Each art slot ships a procedural placeholder that auto-swaps to a real PNG when a file with the
matching name lands in `src/assets/art/` AND is registered in `src/assets/art/index.ts`. So art is
generated in parallel with code, and nothing breaks.

Status legend: ⬜ placeholder only · 📝 brief written · 🎨 generating · ✅ integrated

> **DIRECTION CHANGE (locked):** The art direction is **bright golden-hour / luminous-aspirational**,
> NOT the original dark near-black look. The *app chrome* stays dark (#08090B, dark cards, white
> text); the *art* is bright. The look is "luminous imagery inside a dark premium app." Brand colors
> are unchanged. This doc has been updated throughout to reflect that. (See §5 for history.)

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
4. **Backgrounds:** full-scene art is bright/luminous (NOT dark). Overlay assets (medallion,
   accents, burst) request a transparent center/background.
5. **Aspect by surface:** event cards → **landscape 3:2 (1536×1024), subject UPPER-CENTER**; hero →
   portrait full-bleed; overlays → square. Export large; the app downscales.
6. **Filename = asset key + `.png`**, lowercase. Drop into `src/assets/art/` AND add a `require`
   line to `src/assets/art/index.ts` (or it shows the placeholder).

---

## 1. Master Style Block — BRIGHT (paste at the top of every full-scene prompt)

> A premium, cinematic, luminous illustration for a high-end mobile wealth-strategy game. Bright,
> hopeful, aspirational golden-hour atmosphere — warm natural sunlight, soft volumetric light,
> gentle bloom, a touch of fine grain, airy and open. Elegant and restrained — the polish of Apple
> brand photography and the calm confidence of premium finance. Never casino, never cartoon, never
> oversaturated, never stock-photo cheese; tasteful, editorial, atmospheric, real. Luminous palette:
> warm gold sunlight (#D9B26A), soft dawn-blue sky (#7CB8FF), natural green (#2EC07A) in foliage and
> growth, generous off-white / cream highlights (#F5F2EA). High-key but cinematic, soft shadows,
> shallow depth of field, generous negative space, modern editorial composition.

**Do:** warm natural light, a single clear subject, optimism through light and openness.
**Avoid:** clutter, faces in sharp detail, heavy darkness or gloom, oversaturation, neon.

**Overlay/transparent variant:** drop the scene/background language; end with *"Isolated subject on
a fully transparent background (alpha), no scene — just the glowing motif. Export PNG with
transparency."*

---

## 2. Structural / hero assets

| Key | Surface | Aspect / bg | Status | Prompt (bright direction; append after §1 + reference) |
|---|---|---|---|---|
| `start_hero` | Start screen full-bleed (**Style Anchor — the locked reference**) | Portrait / luminous | ✅ | A lone figure seen from behind on a hilltop, standing calm at the foot of a luminous city at golden dawn, the sun rising warm over the skyline, light spilling toward the viewer — the open promise of the day. Optimistic, aspirational, a beginning. (Approved image is the reference upload for all others.) |
| `path_university` | Foundation-path card | Square / transparent | ⬜📝 | Bright emblem-scene: an arched scholarly hall dissolving into warm light, a faint open book of light, gold-and-blue. Symbolic. (Only MVP path; others excluded.) |
| `phase_survival` | Phase-transition scene | Portrait / luminous | ⬜📝 | A quiet sunlit street, a small bright window ahead — tense but hopeful, early morning. Room at top for a title. |
| `phase_stability` | Phase-transition scene | Portrait / luminous | ⬜📝 | A warm-lit window glowing over a calm bright city — the first solid ground. Room at top for a title. |
| `phase_growth` | Phase-transition scene | Portrait / luminous | ⬜📝 | A bright skyline rising, threaded with emerald light moving upward — compounding momentum. Room at top for a title. |
| `phase_freedom` | Phase-transition scene | Portrait / luminous | ⬜📝 | A wide open dawn horizon above the city, gold light flooding in, the figure free and unhurried. Room at top for a title. (Verify the 18–25 slice reaches this phase before generating.) |
| `identity_medallion` | Run-end "who you became" frame | Square / transparent | ⬜📝 | An ornate but minimal circular medallion frame of thin gold and faint emerald light, completely empty hollow transparent center (procedural strength-sigil renders inside). Ceremonial, premium. |
| `milestone_burst` | Freedom-unlock moment | Square / transparent | ⬜📝 | A soft radial bloom of gold-and-emerald light, fine sparks, fading to transparent. Restrained, no confetti. |

Excluded for MVP (university-only): `path_vocational`, `path_self_taught`, `path_straight_to_work`.
Likely redundant (ArtSlot already draws procedural category glyphs): the five `cat_*` accents —
decide before generating.

---

## 3. Per-event illustrations — ✅ COMPLETE (26 of 26, bright golden-hour, landscape 3:2)

All 26 MVP university-slice event PNGs are generated, registered in `index.ts`, and rendering.

- **Composition (fixed):** landscape 3:2, **1536×1024**, single symbolic subject placed
  **UPPER-CENTER** filling most of the frame (the slot shows the upper region; subject must be high).
  Objects/hands/light, no sharp faces. Bright golden-hour, reframed toward possibility/agency.
- **Asset key = `event_<id>`**, file `event_<id>.png`.
- **Prompt template:** [§1 BRIGHT block] + "Match the attached reference exactly." + "WIDE
  HORIZONTAL 3:2 LANDSCAPE, subject upper-center: **[hopeful one-line event scene]**." + the no-text
  closer.

Registered event keys (all ✅): acquihire_offer, burnout_recovery_event, corporate_leadership_offer,
drop_out_decision, dropped_out_grit_opportunity, etf_recurring_uplift, find_mentor,
finished_degree_consulting_role, first_brokerage, first_tuition_bill, founder_scaling_decision,
independent_brand_launch, loan_consolidation_offer, loan_repayment_notice, major_choice,
market_dip_buy, mentor_role_intro, mentor_warm_intro, networking_event, promotion_review,
scholarship_offer, side_project_milestone, side_project_window, startup_offer, universal_cross_pull,
whats_next. (Per-event scene lines: see chat history / regenerable by the PM on request.)

When a PNG doesn't exist or isn't registered, the slot shows the procedural placeholder, so cards
always look finished.

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

## 5. Open questions / history
- Identity layer depth: single medallion now vs a run-end emblem set later (`[V1.1]`).
- Whether phase scenes animate or hold still — decide when the transition beat is built. (No
  phase-transition moment exists in the loop yet; building it is a new beat, not just a slot.)
- History: original direction was dark near-black "Bloomberg terminal" luxury; changed to bright
  golden-hour aspirational after validation testing. App chrome stayed dark.
