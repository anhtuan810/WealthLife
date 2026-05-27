# WealthLife — ART_REGISTRY + MASTER §11 Deltas

**Session date:** 2026-05-27
**Purpose:** Lock the architectural and art-direction decisions from this
session into the canonical docs (ART_REGISTRY.md and MASTER_PROJECT_CONTEXT_v4.md
§11) so they survive chat compaction and future session handoffs.

The session that produced these deltas: medallion integration, phase-transition
beat build, freedomPct-trajectory investigation, art-direction pivot from
golden-hour photoreal to riso/printmaking, full 58-event regeneration in the
new direction.

This file is **change instructions**, not a replacement for the docs. Apply
each block to the named section.

---

## 1. ART_REGISTRY §0 — Art-direction history (NEW subsection at top)

Add this as a new "Direction history" block immediately under §0 so future
readers understand the look isn't arbitrary — it's the second locked direction
after a deliberate pivot.

```markdown
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
```

---

## 2. ART_REGISTRY §1 — Master Style Block (REPLACE)

The old §1 (bright golden-hour) is now superseded. Replace the entire §1
master style block with:

```
A premium editorial illustration in RISOGRAPH PRINT style for a high-end
mobile wealth-strategy life sim. Limited spot-color palette of warm gold
(#D9B26A), soft dawn-blue (#7CB8FF), and deep ink near-black (#08090B), on
a cream paper background (#F5F2EA). Visible halftone dot texture and soft
grain throughout. Subtle misregistration where colors overlap, the way real
riso prints layer. Restrained, intentional, crafted. Magazine-cover energy
— the polish of a New Yorker or Monocle spot illustration in print form.
Mature, calm, premium. Never casino, never cartoon, never children's-book,
never corporate explainer.
```

Keep a "v1 archive" subsection below §1 with the old bright-direction style
block, dated, so it isn't lost if needed for reference.

---

## 3. ART_REGISTRY §2 — Surface status table (UPDATES)

Update the surface-by-surface status. The MVP art-hosting surfaces are now:

| Surface | Aspect | Status | Notes |
|---|---|---|---|
| `start_hero` | Portrait full-bleed | ✅ riso | The set's style anchor. Re-upload on every other generation. |
| `event_*` (×58) | Landscape 3:2 (1536×1024) | ✅ riso | 26 original + 32 gap-fill = 58, all in riso. Subject upper-center. |
| `identity_medallion` | Square, transparent center | ✅ riso/gold | Frame around procedural StrengthSigil on RunSummaryScreen. PNG transparency was the blocker (GPT Image bg unreliable) — solved via luminance-keyed background removal. |
| `phase_career` | Portrait full-bleed | ✅ riso | Single MVP phase-transition scene. Fires once at foundation→career flip (age ~22). |
| `phase_survival/stability/growth/freedom` | Portrait full-bleed | ⏸ V1.1 | See §5 deferral rationale. |
| `cat_*` accents | n/a | ✕ CUT | Redundant with ArtSlot's procedural category glyphs. Decision: do not produce. |
| Direction-transition art (corporate/founder/freelancer variants) | Portrait full-bleed | ⏸ V1.1 | phase_career fills this role generically for MVP. Per-direction variants for V1.1. |

---

## 4. ART_REGISTRY §3 — Event coverage (REPLACE)

The previous §3 claimed "all 26 MVP events have art." The audit on
2026-05-27 revealed there are actually **58 events in src/content/events/**,
not 26. The original 26 were a curated subset. Replace §3 with:

```markdown
### §3 — Event coverage

Total events in src/content/events/: **58**
Events with riso art: **58 (100%)**
Last audit: 2026-05-27

The original 26 (registered at MVP start) and the 32 gap-fill events
(added 2026-05-27 after audit) are all in the v2 riso direction.

Three near-duplicate events share theme but render as separate images
for now:
- university_income_relief_debt
- university_income_relief_lowsalary
- university_income_relief_stress
(Optional optimization: collapse to one shared PNG via index.ts. Not
done yet; defer until art-content cost matters.)

To re-audit coverage in future sessions, the read-only CC prompt that
produces the event/art coverage table is preserved in the chat history
of the 2026-05-27 session and is reproducible from event content.
```

---

## 5. ART_REGISTRY §4 — Wiring lessons (ADD a new entry)

§4 already has the ArtSlot absoluteFill bug. Add a second entry below it:

```markdown
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
component side, ensure the <Image> has explicit width/height (not just
StyleSheet.absoluteFill) and the z-order draws the frame above any
procedural bounding circle StrengthSigil produces.

**Lesson:** For any overlay-style art slot (transparent center, edge
ornament), validate transparency in isolation against the app chrome
color BEFORE registering in the ART map. The composited preview is the
only honest check.
```

---

## 6. ART_REGISTRY §5 — Decisions on record (NEW section)

Create a new §5 capturing decisions that should not be relitigated.

```markdown
## §5 — Decisions on record

### Phase-transition scene scope (decided 2026-05-27)

**Decision:** MVP ships with exactly ONE phase-transition scene
(phase_career) at the foundation→career flip around age 22. The four
emotional-arc band scenes (phase_survival/stability/growth/freedom) are
deferred to V1.1.

**Why:** A freedom-trace investigation on 2026-05-27 showed
freedomPct sits near 0 across the entire 18–25 MVP slice in a
representative run. The four band scenes would key off freedomPct
threshold crossings, but those crossings don't happen — passive income
in the MVP slice is too scarce relative to monthly expenses for
freedomPct to climb meaningfully. The Survival→Freedom emotional arc is
inherently a full-lifespan feature; the 18–25 MVP slice doesn't have the
horizon for it. Foundation→career at 22 is the ONE transition that
happens reliably in every run and is meaningful enough to warrant a
full-screen scene.

**If revisited in V1.1:** When career-phase content extends and runs reach
age 35+ (Phase 3, currently FUTURE per §6), regenerate the four band
scenes and key them off freedomPct band-crossings using the existing
DevMenu FREEDOM% chips as the test harness. The naming reconciliation
worth recording: the phase field is foundation/career/growth/freedom, but
the art-key arc is survival/stability/growth/freedom (the emotional arc,
not the structural phase). For V1.1, scenes key off the emotional arc
(freedomPct bands), not the structural phase field.

### cat_* category accents (decided 2026-05-27)

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
```

---

## 7. MASTER_PROJECT_CONTEXT_v4.md §11.5 — Surface list (REPLACE)

The §11.5 "Art-hosting surfaces" list is stale. Replace with:

```markdown
### §11.5 — Art-hosting surfaces (MVP, complete)

- **Start hero** (`start_hero`) — portrait full-bleed, riso. Set anchor.
- **Event-card illustration slot** — landscape 3:2, riso. 58 events, all
  illustrated. (See ART_REGISTRY §3 for coverage detail.)
- **Phase-transition scene** (`phase_career`) — portrait full-bleed, riso.
  Single MVP transition at foundation→career flip.
- **Run-end identity medallion** (`identity_medallion`) — transparent
  square frame, gold-on-emerald riso. Wraps procedural StrengthSigil on
  RunSummaryScreen.

**Deferred to V1.1:**
- Emotional-arc band scenes (phase_survival/stability/growth/freedom).
  Reachability gated on Phase 3 (35+) content existing.
- Per-direction transition art variants (corporate/founder/freelancer).
- Milestone/freedom-unlock bursts.

**Cut from scope:**
- Category accent illustrations (`cat_*`). Redundant with procedural glyphs.
```

---

## 8. MASTER_PROJECT_CONTEXT_v4.md §11 prelude — Status line (REPLACE)

Add a one-liner at the top of §11:

```markdown
**Status:** MVP art surface complete (as of 2026-05-27). All four
art-hosting surfaces shipped in v2 riso direction. See ART_REGISTRY for
detail.
```

---

## How to apply this delta file

1. Open the canonical `ART_REGISTRY.md` and `MASTER_PROJECT_CONTEXT_v4.md`.
2. Apply each numbered block above to the named section. The blocks are
   labeled with intent ("REPLACE", "ADD", "NEW") so you don't accidentally
   delete unrelated content.
3. Save the delta file alongside the canonical docs as
   `docs/changelog/2026-05-27-riso-pivot-and-mvp-art-complete.md` so
   the rationale is preserved as a session record. (Or wherever your
   project's changelog convention lives.)
4. Delete this file from your working directory once folded in.

The blocks are intentionally specific so a future-Claude can also apply
them automatically if you'd rather hand this off to CC.
