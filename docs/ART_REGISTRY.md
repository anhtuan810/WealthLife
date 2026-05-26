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
| `start_hero` | Start screen full-bleed (the **Style Anchor — make this first**) | Portrait / dark | 📝 | A lone figure seen from behind as a soft silhouette, standing small at the foot of a vast luminous financial cityscape at the blue hour, a single warm gold band of light breaking on the far horizon — the promise of freedom. Quiet, aspirational, cinematic. |
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

# ART_REGISTRY §3 — Per-event illustrations (MVP university slice)

_Drop-in replacement for the §3 stub. Briefs the per-event art slot wired by the ArtSlot task._

Status legend: ⬜ placeholder only · 📝 brief written · 🎨 generating · ✅ integrated

## Asset-key convention (locked)
- **Art key = `event_` + the event's `id`.** PNG filename = `<key>.png`, lowercase, dropped into
  `src/assets/art/`, registered with one line in `src/assets/art/index.ts`.
  Example: event `first_tuition_bill` → key `event_first_tuition_bill` → `event_first_tuition_bill.png`.
- The `event_` prefix namespaces these against the structural assets (`start_hero`, `phase_*`,
  `cat_*`, `identity_medallion`, `milestone_burst`) that share the folder.
- Until a key has a line in the `ART` map, its card shows the category-tinted placeholder — so this
  set can be generated in any order, and an un-generated event still looks finished.

## Generation recipe (per event)
1. Prepend the **Master Style Block** (§1).
2. Upload the approved `start_hero` as the **style reference** and add: *"Match the style, palette,
   lighting, and mood of the attached reference exactly."*
3. Paste the **scene line** from the table below.
4. End with: *"Single symbolic subject, centered, dark cinematic background, generous negative
   space. No people in sharp focus — silhouettes, hands, or objects only. no text, no letters, no
   numbers, no UI, no logos, no watermark."*

Tint = the event's own `category` accent (foundation = gold, career = capital blue,
investing = emerald, pressure = amber, opportunity = warm gold). The tint is a soft color-grade
hint; the placeholder already enforces it in-app via `category`.

---

## Foundation chapter (age 18–22, university path)

| Asset key | Event | Tint | Scene line |
|---|---|---|---|
| `event_first_tuition_bill` | First Tuition Bill | gold | A first tuition invoice on a bare desk under one lamp — a number that buys time and borrows it back. |
| `event_scholarship_offer` | Scholarship Letter | gold | A sealed merit-award letter catching a thin shaft of gold light — opportunity with a renewal clause. |
| `event_major_choice` | Major Declaration | gold | Two corridors of light forking into the dark — a path locked in before its far end is visible. |
| `event_side_project_window` | Side Project Window | gold | A single lit screen glowing on a dark desk after midnight — a small thing built on borrowed hours. |
| `event_networking_event` | Industry Mixer | gold | A crowded room dissolved into warm silhouettes and drifting light — two real conversations in the noise. |
| `event_find_mentor` | A Senior Operator Takes Interest | gold | Two chairs at a small table under a low warm light — a steady older presence, offered monthly. |
| `event_first_brokerage` | Open a Brokerage Account | gold | A faint line of light rising from one small seed of capital — the first automated step into markets. |
| `event_side_project_milestone` | First Real Users | gold | A scatter of first points of light gathering around one small built object — early, fragile traction. |
| `event_loan_repayment_notice` | Repayment Schedule | gold | A repayment schedule lit coldly on a table, a slow shadow of interest creeping in at the edges. |
| `event_acquihire_offer` | A Buyer Calls | gold | A folded offer sliding across a dark table toward a small glowing object — a built thing nearly let go. |
| `event_drop_out_decision` | Walk Away From the Degree | gold | A half-finished staircase of light beside an open door to grey daylight — finish, or reclaim two years. |
| `event_mentor_warm_intro` | A Warm Introduction | gold | Three doors of faintly different light down a dark hall, a hand gesturing toward one. |
| `event_market_dip_buy` | A Sharp Dip | gold | One emerald line plunging then leveling against a dark grid — a fifteen-percent drop and a steady hand. |
| `event_whats_next` | End of the Foundation | gold | A lone silhouette at a threshold looking out over three faint horizons — the next ten years, deciding. |

## Career chapter (age 22–25)

| Asset key | Event | Tint | Scene line |
|---|---|---|---|
| `event_promotion_review` | Performance Review | blue | A single chair drawn to the head of a longer table — a title that arrives heavier than it looks. |
| `event_burnout_recovery_event` | The Wheels Come Off | blue | A desk lamp left burning over unfinished work at midnight — a body running well past empty. |
| `event_startup_offer` | A Startup Comes Calling | warm gold | A narrow door of warm gold light onto an unlit room — equity, conviction, and a runway clock starting. |
| `event_universal_cross_pull` | A Builder Wants a Partner | warm gold | An outstretched hand offering a small glowing object across a threshold — a partner, not an employer. |
| `event_mentor_role_intro` | Your Mentor Opens a Door | warm gold | Two doors of light over a single shared coffee — one stable room, one small and bold. |
| `event_corporate_leadership_offer` | Director Track | blue | A higher landing of cool blue light reached by ascending steps — a director's chair, full of people-work. |
| `event_founder_scaling_decision` | Scale the Side Business | blue | A small lit workshop straining at its own walls — a side thing grown past side-thing size. |
| `event_independent_brand_launch` | Launch a Personal Brand | blue | A single name resolving out of the dark into clear light — work with a face attached, exposed and amplified. |
| `event_etf_recurring_uplift` | Increase the Auto-Buy | emerald | A steady emerald curve widening as a small dial turns up — a contribution quietly made transformative. |
| `event_loan_consolidation_offer` | Consolidation Offer | amber* | A tangle of cold debt-lines braided into one calmer thread — the monthly weight reshaped, the term intact. |
| `event_dropped_out_grit_opportunity` | The Road Not Taken Pays | warm gold | A rough-edged doorway of warm light off an unfinished path — the grit of the gamble starting to return. |
| `event_finished_degree_consulting_role` | A Consulting Pipeline Opens | warm gold | Three bright doors opening at once down a polished corridor — a credential mattering more than expected. |

\* `loan_consolidation_offer` tint follows its content `category` (tags read debt/relief/pressure
→ amber assumed). Confirm against the content file before generating; trivially adjustable.

---

## Excluded from MVP art (non-university paths — cannot fire in the slice)
`warehouse_role`, `overtime_spiral` (straight_to_work) · `vocational_certification`,
`trade_promotion` (vocational) · `first_freelance_referral`, `freelance_retainer` (self_taught).
Brief these only if/when the alternate foundation backgrounds leave `[V1.1]`/`[FUTURE]`.

## Confirm reachability before briefing (university flag-chain uncertain)
These career/foundation events gate on flags I couldn't trace to a university-path setter; brief
once the sim (`src/sim/perPathReport.ts`) confirms the university path reaches them:
`premium_networking` (lives_in_hub) · `bigco_full_time_offer` / `bigco_alumni_referral`
(interned_bigco) · `sabbatical_window` (has_emergency_fund) · `agency_expansion` (has_first_client)
· `studio_launch` (has_retainer) · `inflated_lifestyle_trap` (inflated_lifestyle) ·
`burnout_relapse_warning` (burnout_warned) · `property_deal` (verify it exists / its category).

Note: briefing a never-reached event only wastes one illustration; an un-briefed reached event
just shows its placeholder. Neither breaks anything — so this list is a cost-saver, not a blocker.

---

## 4. Open questions / decisions to revisit
- Identity layer depth: single medallion now vs a small set of run-end emblems later (`[V1.1]`).
- Whether phase scenes animate (parallax/drift) or hold still — decide when the transition screen is built.
