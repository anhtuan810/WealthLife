# WealthLife — Phase-2 late-life art briefs (growth + freedom)

_14 event illustrations for the growth (35–50) and freedom (50–60) content. Authored by Claude
to match `ART_REGISTRY.md` §3 exactly. Drop these scene lines into the §3 table; status 📝._

---

## Generation recipe (same as the shipped 26 — read once)

For each key, build the prompt as:

1. **Paste the §1 Master Style Block** (the BRIGHT golden-hour block).
2. **Upload the approved `start_hero`** as a reference image and add: _"Match the style, palette,
   lighting, and mood of the attached reference exactly."_
3. Add: _"WIDE HORIZONTAL 3:2 LANDSCAPE, subject UPPER-CENTER: **[scene line below]**"_
4. **Close with:** _"no text, no letters, no numbers, no UI, no logos, no watermark."_
5. Export **1536×1024**. Filename = the event's registered `art` key + `.png`, lowercase. Drop into
   `src/assets/art/` AND add a `require` line to `src/assets/art/index.ts`.

**Verify before naming files:** the 26 shipped events use the key form `event_<id>`. Confirm the
Phase-2 events' `art` fields use the same prefix (`event_growth_index_habit`, etc.). If CC registered
them bare (`growth_index_habit`), either rename the PNGs to match the registered key or align the
`art` field — the filename must equal the key exactly or the slot stays on its placeholder.

Each scene: single symbolic subject, upper-center, objects/hands/light only — **no sharp faces**.
Reframed toward possibility and agency, never grim, even for the pressure beats.

---

## Growth phase (35–50)

| Key (event id) | Category | Scene line |
|---|---|---|
| `growth_index_habit` | investing | A single golden seedling rising from open soil, a thin luminous upward line of light trailing from it like a chart climbing, soft emerald foliage catching warm dawn light — quiet compounding, just begun. |
| `growth_lifestyle_creep` | pressure | A warm-lit doorway opening from a modest room into a larger, brighter golden room beyond, sunlight pooling across the threshold — comfort within reach, and its quiet permanent cost. |
| `growth_market_correction` | pressure | A luminous ascending line of light dipping sharply then steadying against a soft dawn-blue sky, gold breaking through the clouds behind it — turbulence, and the calm it takes to ride it. |
| `growth_real_estate` | opportunity | A small sunlit house on open ground, a thin golden arc of light rising from its roof and curving upward into warm sky like an income stream — leverage, and the stream it can build. |
| `growth_career_plateau` | career | A bright stone staircase climbing into soft golden haze, the upper steps dissolving into light — the next level visible, but no longer easy to reach. |
| `growth_health_reckoning` | pressure | A single sunlit path winding through open trees in warm morning light, dappled gold scattered across the ground — an invitation to tend yourself before the bill comes due. |
| `growth_corp_golden_handcuffs` | career | A fine golden wristwatch resting open on a sunlit surface beside a small gold key, warm light glinting off both — the equity that holds you, and the freedom to walk from it. |
| `growth_founder_exit_window` | opportunity | An open golden door standing at the end of a luminous runway that stretches into bright dawn sky — the exit on the table, and the larger horizon beyond it. |
| `growth_freelancer_productize` | investing | A single well-worn craftsman's tool catching warm sunlight, casting a long golden shadow shaped like a rising stack of coins — craft turning into something that earns while you sleep. |

## Freedom phase (50–60)

| Key (event id) | Category | Scene line |
|---|---|---|
| `freedom_work_optional` | career | A simple chair turned toward a wide open window flooded with warm golden light, a calm bright vista beyond — work, for the first time, optional. |
| `freedom_drawdown_question` | investing | A graceful golden vessel tilted mid-pour, a thin steady stream of warm light flowing from it into soft dawn air — the turn from filling the cup to drinking from it. |
| `freedom_sequence_risk` | pressure | A fine golden line drawn taut like a tightrope between two points, a softly lit platform waiting at the far end against pale dawn-blue sky — timing, not size, the threat now. |
| `freedom_late_bloomers_sprint` | opportunity | A single empty running track curving uphill and bending into bright gold light at its crest, warm morning sun ahead — road still left, and the will to take it. |
| `freedom_optionality` | opportunity | An open upturned hand held in warm golden light, soft motes of light lifting and drifting from the palm into bright air — abundance held loosely, and given freely. |

---

## Phase-transition scenes (already in §2, restated for the new copy)

These four already exist as `phase_*` slots in §2. Now that the transition beats are wired into the
loop and the run reaches all phases, they're worth generating. `phase_growth` and `phase_freedom`
pair with the transition copy you committed ("THE GROWTH YEARS" / "WITHIN REACH") — leave clear
negative space at the **top** for the title overlay.

No new briefs needed; the §2 lines hold. Generate `phase_growth` and `phase_freedom` first since
those are the two transitions a full run actually shows.
