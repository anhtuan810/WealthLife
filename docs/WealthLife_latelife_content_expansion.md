# WealthLife — Late-life content expansion brief

_Doubles growth (35–50) and freedom (50–60) event density and adds ambient texture so the back half
of a run feels populated, not compressed-empty. Follows the conventions of
`WealthLife_phase2_content_brief.md` exactly. Authored by Claude._

---

## 0. Why this exists + the rules that carry over

The life-arc frame works, but growth + freedom hold only ~14 events across 25 years, so compression
skips through near-empty decades. This batch roughly **doubles** density and adds **repeatable
ambient beats** so quiet stretches have texture instead of a fast-forward.

Carry-over rules (unchanged from Phase 2):
- **Pure data.** Append to `/content/events`. Engine untouched.
- **Effects directional (↑/↓), as named `TODO_TUNE` constants.** What's fixed is which StatKey moves
  and which way — magnitudes tune later.
- **The decision beats must keep moving `passiveIncome` / `expenses` / `assets`** — that's the freedom
  climb. BUT see the ambient-beat exception in §3.
- Schema per §12 `GameEvent`. `deferWindow` defaults by category (pressure 0, career/investing/
  opportunity 3) unless noted.
- Each event registers a placeholder-first art key `event_<id>`; art briefs come in a later pass
  (same recipe as the 14 just delivered). Tone: mature, tradeoff-heavy, no memes, no moralizing.
- Most fire for all directions; only gate on `started_*` / `direction` when the beat is *about* that.

---

## 1. Growth phase additions (35–50) — 8 events

| id | category | situation (one line) | choices → directional effects |
|---|---|---|---|
| `growth_family_milestone` | pressure | A dependent enters the picture — a permanent, meaningful new cost. | **Embrace it** (expenses ↑ permanent, stress ↓ meaning) · **Plan carefully** (expenses ↑ less, discipline ↑) |
| `growth_windfall` | opportunity | A one-time windfall lands — inheritance, bonus, a sale. | **Invest it** (assets ↑↑, passiveIncome ↑) · **Pay down debt** (debt ↓↓, stress ↓) · **Enjoy some** (cash ↑ now, stress ↓ short) |
| `growth_layoff` | pressure · `deferWindow 0` | The role disappears out from under you. | **Pivot fast** (salary recovers lower, stress ↑) · **Take the time** (cash ↓, skill ↑, stress ↓, slower return) · *onLapse:* salary ↓, stress ↑ |
| `growth_second_stream` | investing | A side venture could become a real second income. | **Build it** (cash ↓, passiveIncome ↑ compounding, discipline ↑) · **Stay focused** (salary steady) |
| `growth_payoff_vs_invest` | investing | Surplus to deploy: kill the mortgage or feed the market. | **Pay it down** (debt ↓↓, stress ↓, less compounding) · **Invest the surplus** (assets ↑, passiveIncome ↑, debt persists) |
| `growth_bad_bet` | opportunity | A hot tip with a real downside. | **Go in** (assets ↑↑ OR loss → assets ↓, riskTolerance ↑) · **Pass** (discipline ↑) |
| `growth_peak_earning` | career | Your earning power crests — but the role asks more. | **Take it** (salary ↑↑, stress ↑, health ↓) · **Hold steady** (salary ↑ small, stress ↓) |
| `growth_burnout_fork` | pressure · gated `stress >= 60` | The pace is no longer sustainable. | **Step back** (salary ↓, health ↑↑, stress ↓↓) · **Push through** (salary ↑, health ↓, stress ↑) |

## 2. Freedom phase additions (50–60) — 6 events

| id | category | situation (one line) | choices → directional effects |
|---|---|---|---|
| `freedom_healthcare` | pressure | Health costs start to climb with the years. | **Insure well** (expenses ↑ steady, stress ↓) · **Self-fund** (cash buffer drawn, variance, stress ↑) |
| `freedom_help_family` | opportunity | Someone you love needs real help. | **Help generously** (cash ↓ or assets ↓, reputation ↑, stress ↓) · **Set a limit** (assets preserved, small stress ↑) |
| `freedom_encore` | career | A passion project could be a gentle encore. | **Pursue it** (salary ↑ small, stress ↓, meaning) · **Fully retire** (salary → 0, stress ↓↓) |
| `freedom_legacy` | opportunity · `deferWindow 3` | What you leave, and to whom, becomes the question. | **Give / structure it** (assets ↓, reputation ↑, stress ↓) · **Hold it close** (assets preserved) |
| `freedom_late_scare` | pressure · `deferWindow 0` | A jolt near the finish — market or health. | **Ride it out** (variance: recovers ↑ or ↓, stress ↑) · **De-risk** (assets ↓ locked safer, passiveIncome ↓, stress ↓↓) |
| `freedom_enough` | career | The quiet recalibration: is this enough? | **Keep building** (passiveIncome ↑, stress flat) · **Declare enough** (salary ↓, stress ↓↓, meaning) |

## 3. Ambient texture beats — 2 events (the exception to the money rule)

These are **repeatable, low-weight, low-priority** beats that fill quiet stretches so compression
isn't pure fast-forward. They are the EXCEPTION to "must move money": keep their money impact tiny
or neutral (small/symmetric) so they add texture **without disturbing the locked balance**. Mostly
small stress/health/flavor. Set `repeatable: true`, low `weight`, and a cooldown so they don't spam.

| id | category | phase | situation | choices → effects (small) |
|---|---|---|---|---|
| `growth_market_drift` | investing · repeatable · low weight | growth | A quiet quarter — the market drifts, nothing dramatic. | **Stay the course** (passiveIncome ± tiny, discipline ↑ trace) · **Tinker** (passiveIncome ± tiny other way, small stress) |
| `freedom_quiet_season` | pressure · repeatable · low weight | freedom | A calm season — or a restless one. | **Savor it** (stress ↓ small, health ↑ small) · **Stay busy** (stress ↑ trace, small flavor) |

---

## 4. Density target + what to verify
- After this lands, growth holds ~17 events and freedom ~11 — roughly double.
- A full 18→60 run should surface a decision every few months through growth/freedom rather than
  long silent skips, with the ambient beats filling the gaps between the bigger forks.
- **Do NOT let the new beats re-break balance:** the decision beats move money directionally (fine,
  magnitudes are TODO_TUNE), but the ambient beats must net near-zero on money. Re-run the coverage
  sweep and confirm the four-start spread + grade distributions are within a couple of points of the
  current committed numbers. If they shifted meaningfully, the ambient beats are leaking money —
  flag it.
