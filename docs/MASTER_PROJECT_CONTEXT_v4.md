# WealthLife — MASTER_PROJECT_CONTEXT.md

_Revision v4 · supersedes v3 · last updated 26 May 2026_

## 0. Purpose & sources of truth

This is the master context for Claude (acting as product manager + chief architect) and Claude
Code (executing implementation). It is the source of truth for product vision, gameplay
direction, technical architecture, **art production**, MVP scope, and roadmap.

When sources conflict, resolve in this order:
1. **The current codebase leads on story, gameplay, and the financial/stress model.** Where this
   doc's prose disagrees with shipped, working game logic, the code wins and this doc is updated.
2. **This document** leads on product framing, architecture, art pipeline, and scope.
3. **Conversation decisions** refine both.

Claude: break work into small tasks, write clear Claude Code prompts, protect the architecture,
keep visuals premium, prevent scope creep, and own the art pipeline. Claude Code: execute small,
concrete tasks — never "build the whole game" in one run.

### 0.1 Scope tiers
- `[MVP]` — ships in the first vertical slice. Build now.
- `[V1.1]` — fast follow once the MVP loop feels good. Designed for, not built.
- `[FUTURE]` — horizon. Do not build; do not let it expand the MVP.

### 0.2 What changed in v4 (read first)
v3 made a wrong turn on identity. It is corrected here:

1. **The three directions stay.** v3 deleted Corporate / Founder / Freelancer in favor of a pure
   emergent strength profile. That was wrong. The codebase models the three directions and they
   remain the spine of mid-game identity. (§2, §7)
2. **University is the start, the directions come later.** The player begins in the **university
   foundation** at 18 and grows *into* a direction around 22 — an earned, foundation-informed
   choice, never an immediate cold pick. (§2, §6)
3. **University is the single MVP starting context.** Other backgrounds (vocational, self-taught,
   straight-to-work) move to `[V1.1]`/`[FUTURE]`. Keep the start simple.
4. **Player state reconciled to the actual code** (cash/assets/liabilities/monthlyIncome/
   monthlyExpenses/passiveIncome/stress 0–5/stressMomentum), plus foundation + direction fields. (§13)
5. **Art is now first-class.** The GPT Image pipeline, locked style bible, asset-key contract,
   rich per-event illustration, and the living Art Registry are specified, not hand-waved. (§11)
6. **Tech: Expo SDK 56** (was mistakenly pinned at 54).

Locked decisions that survive from v3: data-driven content engine (§12), beat system (§9),
graded-trajectory scoring (§10), deterministic simulation, AI as a future narrative-only layer.

---

## 1. What WealthLife is

A premium, iPhone-first **wealth strategy simulation game**. You start adult life at 18 in
university, make education/money/career/investing decisions, and try to escape financial pressure
and build long-term freedom.

It is **not** a life simulator, not a childhood-to-death sim, not a meme-riches game, not a
budgeting app, not a finance course, and not "just a dashboard." It is a visually polished,
emotionally engaging, strategic journey.

Core theme: *Can you escape the rat race before stress, debt, or burnout take over?*
Final fantasy: not "become a billionaire" but **gain control over your life.**

It should feel modern, premium, cinematic, strategic, tense, aspirational, and rewarding.

---

## 2. Core direction — the identity model (corrected)

**Foundation → Direction → Freedom.** Identity is *earned through a university chapter, then
expressed as a chosen direction.*

- The player starts at 18 in **university** (the foundation). Dense early decisions — debt,
  major, side hustle, first internship, first investment, networking — shape their finances and a
  light set of strengths/traits.
- Around 22, the player **transitions into a direction**: **Corporate Climber**, **Startup
  Founder**, or **Freelancer** (the codebase's three). This is a *guided* choice: the foundation
  surfaces what the player is set up for, and they decide. Earned, not cold-picked; deferred, not
  immediate.
- The direction then drives the mid-game career/financial model the code already implements.
  Blended play (job + investing, freelance + property, etc.) is `[V1.1]`.

The player should feel: *"I built this trajectory in university, then chose my path — and I could
have chosen another."* This is the source of ownership and replayability.

---

## 3. Emotional arc

**Survival → Stability → Growth → Leverage → Freedom.** Every decision trades today's comfort
against future freedom, ambition, stress, and risk. Make progress visible; make stress matter;
avoid random chaos; never feel like a spreadsheet.

---

## 4. Audience & tone

Ambitious adults, investors, tech/startup-minded people, FIRE/financial-independence fans,
strategy and optimization gamers, financially-anxious millennials and Gen Z.

Tone: mature, concise, emotionally grounded, realistic, slightly cinematic. Avoid meme humor,
childish jokes, lecture tone, boring finance education, fake motivational quotes. Respect the
player's intelligence.

> Good: "Your rent rises just as your internship ends — preserve cash, take more work, or invest
> in a skill that may pay off later."
> Bad: "LOL capitalism is hard! Pick one!"

---

## 5. Core fantasy

Escape paycheck dependency, build resilience, reduce money stress, create optionality, buy back
time, feel compounding work, choose freedom over endless pressure. The player should keep
thinking *"I want one more month."*

---

## 6. Phase structure

### Phase 1 — University Foundation, 18→~22 `[MVP]`
The formative chapter. **Dense decisions** (see beat system §9). Shapes debt, financial habits,
network, skill base, ambition/discipline/risk appetite, early investing, and which directions are
well-supported. Fast and strategic — **not** a school sim (no classes-to-attend, exams,
cafeteria, dating drama). 10–20 min for a full run in MVP.

### Phase 2 — Direction & Career, ~22→35 `[MVP]` slice / `[V1.1]` depth
At the transition the player chooses a direction (§7) and enters the mid-game: salary growth,
promotion, burnout, investing, reputation, freedom progress. The MVP ships an early slice of this
so the trajectory is visible; full depth is `[V1.1]`.

### Phase 3 — Wealth & Freedom, 35+ `[FUTURE]`
Compounding, passive income, financial independence, lifestyle, legacy. Do not build now.

---

## 7. The three directions `[MVP]` (from the codebase)

Reached after the university foundation, biased by how it went. Numbers are tunable and live in
config, not prose.

- **Corporate Climber** — steady paycheck, ambitious ladder. Stable income, burnout risk, network
  access.
- **Startup Founder** — high-variance bets for asymmetric upside. Equity-heavy, cash-poor,
  volatile stress.
- **Freelancer** — own your time, hunt every month. Flexible hours, income gaps, skill
  compounding.

The foundation chapter doesn't *lock* a direction — it makes some cheaper/stronger to step into.
Post-hoc descriptive labels at run-end (Burned-Out High Earner, Slow & Steady Compounder, etc.)
are `[V1.1]` flavor.

---

## 8. Strengths & traits `[MVP]` (light)

A small profile the foundation builds and that *biases, never gates*: skill, network, reputation,
discipline, riskTolerance, ambition (0–100), plus descriptive `traits[]` (the codebase already
carries traits). These tilt which directions and opportunities are easier and more rewarding.
Keep this secondary in MVP — it supports the directions, it doesn't replace them.

---

## 9. Core loop & beat system `[MVP]`

Each active month: show state → (maybe) present an event with 2–4 choices → apply deterministic
consequences → animate stats → advance. The loop must create *one-more-month* pull.

**Beat system** keeps it from becoming tap-grind. A pacing controller classifies each month:
- **Quiet tick** (most months) — cashflow applies, one ambient line, instant tap-through.
- **Decision month** — fires a real event; spaced by a cooldown unless a high-priority
  conditional event is eligible (fires immediately).
- **Foundation density** — during university, decisions come back-to-back; short/zero cooldown.

Required UX: a **"Skip to next decision"** control so quiet months feel like momentum.

Every decision should force a tradeoff (salary vs burnout, cheap housing vs network, side hustle
vs stress, invest vs cash safety, etc.).

---

## 10. Win conditions, endings & scoring `[MVP]`

Not a binary "reach 100% freedom." The **freedom ratio** (passive income ÷ expenses) is the
long-horizon north-star bar the player climbs all run. The MVP payoff is a **graded trajectory**:
at the target age the run ends with an **S/A/B/C/D grade**, how high the freedom bar got, and a
short narrated ending.

Endings are data (§12): `{ id, priority, condition, title, copy }`, first match by priority wins.
MVP endings (~3–4): **Strong Start**, **Treading Water**, **Early Debt Spiral**, **Burnout
Warning**. Show consequences; don't moralize.

**Locked rule (already in code):** when cash runs out it becomes debt, not game over — it accrues
interest. Going into the red is rising pressure, not failure. Debt is paid down only by choice.

---

## 11. ART — the priority of this revision `[MVP]`

Art is what separates WealthLife from the sea of AI dashboard games. The component craft is
already premium (animated background, Skia net-worth chart, freedom meter, haptic buttons). The
gap is **illustrated surfaces** that carry mood and story. This section is the system for filling
that gap reliably.

### 11.1 Visual direction
Premium dark mode, layered gradients, soft glow accents, high-contrast type, cinematic decision
cards, satisfying stat motion. Mood refs: Apple Wallet polish, Bloomberg seriousness, calm dark
luxury, subtle cyberpunk-finance. Avoid: cartoons, casino neon, cluttered dashboards, bright
flat UI, walls of text.

Locked palette (from code): bg `#08090B`, gold `#D9B26A`, capital blue `#7CB8FF`, emerald
`#2EC07A`, off-white `#F5F2EA`.

### 11.2 Art pipeline (tool: GPT Image)
Claude cannot generate images; the founder generates them in **GPT Image (ChatGPT/DALL·E)** using
briefs Claude writes. The consistency risk (GPT Image drifts between generations) is managed by:
1. A locked **Master Style Block** prepended to every prompt.
2. A single approved **Style Anchor** image (`start_hero`) reused as a *reference upload* on every
   later generation: *"match the style, palette, lighting of the attached reference."*
3. **No text in any image** (the app draws all words).
4. Fixed composition per surface; category color-tinting for coherence.

Full style bible + ready-to-paste prompts live in the separate **Art Registry** doc.

### 11.3 Placeholder-first + the asset-key contract
For every art need, Claude Code: (a) builds the on-screen **slot** (frame, aspect, safe area,
entrance animation); (b) ships a **procedural placeholder** (gradient/SVG/glow) so the build never
breaks; (c) the slot auto-swaps to a real PNG when a file named after the **asset key** lands in
`src/assets/art/` (e.g. `path_university.png`). The asset key is the seam between the art track and
the code track — they never block each other.

### 11.4 Rich per-event illustration `[MVP]`
Every event gets an illustration in the event card's art slot. To keep 30+ images reading as one
set: fixed composition (single symbolic subject, centered, dark cinematic bg, negative space, no
sharp faces), category tint, the shared style anchor. Un-illustrated events fall back to the
procedural placeholder so cards always look finished. Per-event briefs are written alongside the
event content (§17 Step 5).

### 11.5 Art-hosting surfaces (MVP)
Start hero · university foundation key art · phase-transition scenes (Survival→Freedom) ·
event-card illustration slot + category accents · direction-transition art (corporate/founder/
freelancer) · run-end identity medallion · milestone/freedom-unlock burst.

### 11.6 Animation `[MVP]` core / `[V1.1]` extras
Card entrance/exit, monthly transition, stat-change and net-worth number animation, freedom
bar/ring, stress pulse when high, haptics on decisions, milestone glow, graph movement, phase
scenes. Motion: premium, restrained, satisfying. Avoid bouncing, flashing, particle overload.

### 11.7 Audio
`[FUTURE]` — out of scope until the core loop and visuals feel good.

---

## 12. Data-driven content engine `[MVP]`

Content is data; the engine is a dumb interpreter that never changes when content is added.

```ts
type GameEvent = {
  id: string; title: string;
  category: 'foundation'|'career'|'investing'|'pressure'|'opportunity';
  phase: 'foundation'|'career'|'growth'|'freedom';
  priority?: number; weight?: number; repeatable?: boolean;
  conditions?: EventConditions; choices: Choice[];
  fallbackText?: string; art?: string; tags?: string[];
};
type EventConditions = {
  minAge?: number; maxAge?: number; phase?: GameEvent['phase'];
  direction?: ('corporate'|'founder'|'freelancer')[];
  stats?: Record<string,string>;        // e.g. { network: '>=40', debt: '<=5000' }
  requiresFlags?: string[]; forbidsFlags?: string[];
};
type Choice = {
  id: string; label: string;
  effects: Partial<Record<StatKey, number>>;
  setsFlags?: string[]; resultText?: string;
};
type Ending = { id: string; priority: number; condition: EventConditions; title: string; copy: string };
```

**Flags** (`player.flags: string[]`) wire early choices to late consequences: a university choice
sets `has_side_business`; a later founder event requires it. **Engine loop:** gather eligible
events (all conditions pass, not already fired unless repeatable) → fire highest priority, else
respect cooldown then weighted-random → apply effects, write flags, log → at run-end evaluate
endings by priority. Adding content = appending to `/content/*`; the engine never changes.

---

## 13. Player state `[MVP]` (reconciled to code)

```ts
type PlayerState = {
  age: number;            // starts at 18
  month: number;
  phase: 'foundation' | 'career' | 'growth' | 'freedom';
  foundationContext: 'university';        // single MVP context; extensible later
  direction: 'corporate' | 'founder' | 'freelancer' | null;  // null until the ~22 transition

  // finances (current code model — kept verbatim)
  cash: number;
  assets: number;
  liabilities: number;     // cash shortfall rolls in here and accrues interest
  monthlyIncome: number;
  monthlyExpenses: number;
  passiveIncome: number;   // drives freedom %

  // pressure (current code model)
  stress: number;          // 0–5 discrete
  stressMomentum: number;  // hidden accumulator nudging stress by ±1

  // light strengths/traits (foundation-built; bias, not gate)
  strengths: { skill: number; network: number; reputation: number;
               discipline: number; riskTolerance: number; ambition: number };
  traits: string[];

  // content wiring
  flags: string[];
  firedEventIds: string[];

  netWorthHistory: number[];   // one entry per month
};

// derived (helpers, not stored)
netWorth      = cash + assets - liabilities
freedomPct    = clamp(round(passiveIncome / monthlyExpenses * 100), 0, 100)
```

---

## 14. Architecture `[MVP]`

Clean separation, no overengineering:
- **Simulation engine** — pure TS: money, interest, stress, monthly + phase progression,
  scoring. Testable without UI. (The current `tick.ts` stress/debt model is the seed.)
- **Event engine** — dumb interpreter over `/content` (§12).
- **Pacing controller** — the beat system (§9).
- **Narrative layer** — `[FUTURE]` AI text + deterministic fallback; never mutates core state.
- **Visual layer** — transitions, animations, charts, art slots, milestones.
- **UI layer** — screens, cards, navigation.
- **Persistence** — local save/load for MVP.

Folder shape (current + planned): `/components`, `/screens`, `/game` (player, tick, config →
evolve into `/systems`), `/content/events`, `/data` (directions, foundation, constants),
`/state` (gameStore), `/types`, `/assets/art`, `/theme`.

---

## 15. Tech stack `[MVP]`

React Native + Expo **SDK 56**, TypeScript, Zustand, React Native Reanimated, React Native Skia,
Expo Haptics, Gesture Handler, expo-linear-gradient. iPhone-first; keep cross-platform-friendly.
Avoid Unity/Unreal, heavy 3D/physics, exposed API keys. Local-only is fine for MVP.

---

## 16. AI philosophy `[FUTURE]`

AI is narrative/flavor only and isolated behind a fallback. It must **never** control money,
progression, probability, balancing, win/lose, or returns. Do not add until the core loop and
visuals feel good.

---

## 17. MVP scope & working model

**Ships first:** start screen → begin university at 18 → dense foundation decisions that shape
finances + strengths → direction transition at ~22 → early career slice → freedom/stress/net-worth
move → target age → S/A/B/C/D graded ending → play again. ~30 events in the §12 schema, 3–4
endings, local save/load, premium visuals + rich per-event art, smooth animation.

**Out of scope for MVP:** multiplayer, real stock APIs, tax engine, options/crypto, relationships/
family, full backend/accounts/payments, audio, 3D, alternate foundation backgrounds.

**Working model:** Claude = PM + chief architect → writes specs and Claude Code prompts (one small
task at a time) and owns the Art Registry. Founder runs Claude Code and generates art in GPT Image
from Claude's briefs. Build order: (1) data model — university foundation + reconciled state +
keep directions; (2) event engine + beat system; (3) EventCard + ChoiceButton with art slot;
(4) foundation→direction flow; (5) ~30 events + per-event art briefs; (6) endings/grade + run-end
art. Art is generated in parallel against the asset-key contract.

---

## 18. Design principles & risks

Principles: start meaningful immediately; every decision has tradeoffs; make progress visible;
make stress matter; avoid random chaos; never feel like a spreadsheet; keep UI premium; identity
is earned through the foundation then chosen; show consequences clearly; focus on freedom, not
greed.

Top risks: feeling like a dashboard (mitigate with the event/decision loop + rich art); scope
explosion (enforce scope tags, small CC tasks); art inconsistency (style anchor + asset-key
contract); boring early game (dense, tradeoff-heavy university chapter); letting AI touch logic
(forbidden).

---

## 19. Final instruction

Build a premium, iPhone-first wealth journey: begin in university at 18, grow into a direction,
and climb toward freedom — where early choices shape who you become, and every screen looks like
something worth keeping. Prioritize, in order: visual/art polish, emotional engagement, meaningful
decisions, fast iteration, clean architecture, mobile-first UX. Do not overbuild. Build a small but
premium vertical slice first. The first great version should make the player think: *I want to
play one more month.*
