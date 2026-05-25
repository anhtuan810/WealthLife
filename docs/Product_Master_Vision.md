# WealthLife — MASTER_PROJECT_CONTEXT.md

_Revision v3 · supersedes v2 · last updated 25 May 2026_

## 0. Purpose of This Document

This document is the master project context for Claude and Claude Code.

Claude should use this document as the source of truth for:
- product vision
- gameplay direction
- narrative direction
- technical architecture
- visual style
- MVP scope
- development priorities
- implementation roadmap

The goal is to help Claude act as:
- lead technical architect
- game design translator
- implementation planner
- quality controller
- prompt writer for Claude Code

Claude Code should then execute concrete implementation tasks.

> **What changed in v3 (read this first):** five product decisions are now locked. They are
> listed in full in §36. In short: (1) there are **no fixed archetype classes** — early-life
> choices set a **strength profile** that later content reads as modifiers, never as locks;
> (2) all content runs through a **data-driven engine** so new events/endings are data, not
> code; (3) every system, ending, and category now carries a **scope tag**; (4) the monthly
> loop uses a **beat system** so it never becomes tap-grind; (5) the MVP **win condition is a
> graded trajectory**, not a binary "reach 100% freedom." Sections 2, 7, 9, 10, 12, 22, 26,
> 27, and 36 reflect these decisions.

---

## 0.1 Scope Tier Legend

Every system, archetype label, ending, and content category in this document is tagged with
one of the following. **Claude Code only builds `[MVP]` unless explicitly told otherwise.**

- `[MVP]` — ships in the first vertical slice. Build this now.
- `[V1.1]` — fast follow after the MVP loop feels good. Designed for, not built yet.
- `[FUTURE]` — horizon / aspiration. Do not build. Do not let it expand the MVP.

When a section has no tag, treat its *prose* as vision context and its *concrete mechanics*
as `[FUTURE]` until promoted here.

---

## 0.2 MVP Definition — what actually ships first `[MVP]`

The first shippable build is a polished vertical slice, nothing more:

- Start screen + one **foundation path** pick (see §7) — a starting *context*, not a class.
- **Foundation chapter**, age 18 → ~22, dense decisions that set the player's strength profile.
- Transition into **early career**, a handful of months past 22 so the trajectory is visible.
- The **strength system** (§9) driving which opportunities appear and how they pay.
- The **financial + pressure systems** (§11.1, §11.5) at a simple, tunable level.
- ~**30 events** across foundation + early career, in the §26 schema.
- **3–4 endings** reachable inside the slice (§12), plus the **S/A/B/C/D grade**.
- **Local save/load**, one run.
- **Premium dark visual layer** and smooth animation (§13–§17).

Everything else in this document is `[V1.1]` or `[FUTURE]`.

---

# 1. Project Overview

We are building an iPhone-first premium wealth strategy simulation game called **WealthLife**.

WealthLife is a strategic simulation game about escaping financial pressure and building long-term freedom.

It is about:
- starting adult life at 18
- making early education/career decisions that shape who you become
- managing money
- building wealth
- avoiding the rat race
- balancing ambition and burnout
- investing intelligently
- using career/business opportunities wisely
- reaching financial independence

This is **not** a traditional life simulator.

This is **not** a childhood-to-death simulator.

This is **not** a meme-riches game.

This is **not** a spreadsheet finance app.

This is **not** just a dashboard.

This is a visually polished, emotionally engaging, strategic wealth journey game.

The core theme is:

> Can the player escape the rat race before stress, debt, burnout, or bad decisions take over?

The game should feel:
- modern
- premium
- emotionally intelligent
- cinematic
- strategic
- aspirational
- tense
- rewarding
- visually polished

---

# 2. Core Product Direction

The product direction is:

## A strategic wealth journey simulator where identity is earned, not selected

The player starts at age 18, entering university, vocational training, a self-taught path, or
straight into the job market.

**The player never picks a class like "Corporate / Founder / Freelancer."** In the real world
those lines are blurry: people hold a job while building a business, take a hit on a corporate
career to go independent, drift from freelancing into a company and back. WealthLife models
that reality.

Instead of a class, the player's early decisions set a **strength profile** — a shape across
skill, network, capital, reputation, discipline, and risk appetite. That profile then makes
certain futures *easier, more frequent, and more rewarding*, but it locks nothing. A
high-network corporate employee can still take the startup offer; it simply costs career
momentum. Identity is the *shape of your stats*, and it can shift across a run.

The player should feel:

> I built this trajectory myself, and I could have built a different one.

This creates:
- stronger emotional ownership
- better replayability (the same starting path plays differently each run)
- more meaningful progression
- stronger immersion

The game should simulate the pursuit of financial freedom, not random life chaos.

Money is not the final fantasy.

Freedom is the final fantasy.

---

# 3. Core Fantasy

The player fantasy is not:

> Become a billionaire.

The player fantasy is:

> Gain control over life.

More specifically:
- escape paycheck dependency
- avoid the rat race
- build financial resilience
- reduce stress from money
- create optionality
- buy back time
- make better decisions than in real life
- experience the power of compounding
- choose freedom over endless work pressure

The player should feel:
- "My early decisions matter."
- "I am becoming less trapped."
- "I am building freedom month by month."
- "I need to be careful, but I see a path."
- "I want one more month."

---

# 4. Emotional Progression

The emotional arc should be:

## Survival → Stability → Growth → Leverage → Freedom

### Survival
The player has little money, limited options, debt risk, and uncertainty.

### Stability
The player gets income, learns basic money management, builds savings, and reduces immediate pressure.

### Growth
The player invests, improves skills, grows income, and finds better opportunities.

### Leverage
The player starts using assets, networks, property, businesses, and compounding.

### Freedom
The player gains enough optionality to reduce work dependency, choose meaningful work, or retire early.

The player should constantly feel a tradeoff between:
- today's comfort
- future freedom
- career ambition
- stress
- risk
- personal wellbeing

---

# 5. Target Audience

Primary audience:
- ambitious adults
- investors
- tech workers
- startup-minded people
- financially anxious millennials and Gen Z
- people interested in FIRE / financial independence
- strategy and optimization gamers
- people who enjoy career and money decisions

Secondary audience:
- life simulator fans
- tycoon game fans
- management game fans
- personal finance enthusiasts
- people curious about investing and wealth building

The tone should be mature and premium.

Do not make the game childish.

Do not make it a joke simulator.

Do not make it feel like school homework.

---

# 6. Game Identity

Good description:

> WealthLife is a premium mobile wealth strategy game where players start adult life at 18 and make career, education, investing, business, and lifestyle decisions to escape financial pressure and build freedom.

Bad descriptions:
- "A life simulator like BitLife."
- "A budgeting app."
- "A finance education app."
- "A get-rich game."
- "A spreadsheet simulator."
- "A clicker game."

Positioning examples:
- "Can you escape the rat race before burnout wins?"
- "Build freedom in a world designed to keep you busy."
- "Every decision shapes your financial future."
- "Start with little. Build optionality. Escape financial pressure."

---

# 7. Starting Point and the Foundation Path `[MVP]`

The game begins at age 18 with a single choice: which **foundation path** the player enters.
This is the *one* "how you start" list — it replaces the old conflicting lists. It is a
starting *context*, not a class.

The foundation paths:
- **University** — high potential skill + network, real debt risk, slow early income.
- **Vocational training** — earlier income, low debt, narrower but solid skill base.
- **Self-taught** — lowest debt, earliest income, unstable opportunities, network must be built.
- **Straight to work** — immediate income and independence, weakest long-term ceiling unless
  a side path emerges.

Each path biases — but does not fix — the starting strength profile (§9). The actual numbers
the player walks out of the foundation chapter with are *produced by the decisions made during
it*, not preset.

The foundation chapter shapes:
- debt level
- financial mindset
- network quality
- skill base
- ambition / discipline / risk appetite
- early investing habits
- which long-term opportunities unlock later

This is **not** a school simulator.

Avoid:
- classroom simulation
- homework systems
- exam minigames
- detailed campus life management
- teenage chaos
- romance-heavy gameplay
- slow early progression

It should feel:
- fast
- strategic
- meaningful
- emotionally relatable
- full of early tradeoffs

The player should feel:

> My early decisions are shaping my future wealth and freedom.

---

# 8. Phase Structure

## Phase 1 — Foundation: Age 18–22 `[MVP]`

The early adult / university / training phase. **Dense decisions** (see the beat system, §10) —
this is the formative chapter and earns the player's attention.

Main purpose:
- shape the player's strength profile
- create emotional ownership
- establish habits
- define early advantages and disadvantages

Focus areas: education choice, major/specialization, student debt, side hustles, internships,
networking, early investing, living situation, time allocation, ambition, discipline, risk
appetite, early business experiments.

Suggested length: 10–20 minutes for a full foundation phase in MVP. No need for fine detail.

Good early events: choose major; take loan vs work part-time; accept internship; attend
networking event; build app / start small business; buy first ETF; join startup club; cheap
housing vs expensive independence; grades vs networking vs side hustle; accept parental support
vs become independent; invest in skills.

Bad early events: attend math class; study-for-exam minigame; cafeteria simulation; dating
drama; random school jokes; classroom attendance.

The focus must remain: wealth trajectory, future options, early financial habits.

## Phase 2 — Career Acceleration: Age 22–35 `[V1.1]` (early slice is `[MVP]`)

The main gameplay phase. The player's strength profile naturally biases them toward corporate,
founder, freelancer, investor-heavy, or blended play — **without ever being locked**. Blended
paths are first-class: job + investing, freelancing + property, founder + side investing,
corporate + side business, high salary + burnout risk, low salary + high flexibility.

Core systems: salary growth, promotion, burnout, investing, property, entrepreneurship,
reputation, skills, network, financial-freedom progress.

Feel: ambitious, stressful, exciting, strategic, high-pressure, opportunity-rich.

## Phase 3 — Wealth & Freedom: Age 35+ `[FUTURE]`

Late progression. Focus: compounding, passive income, portfolio, financial independence,
stress management, family security, freedom optimization, lifestyle, legacy.

The player chooses: keep working for status/income, reduce workload, build business, manage
assets, retire early, mentor, relocate, spend more, protect family security.

Feel: rewarding, reflective, strategic, emotionally satisfying.

---

# 9. Strength Profile & Emergent Identity `[MVP]`

**This section replaces the old "Archetype Philosophy." There are no classes.**

Identity in WealthLife is the *shape of a stat profile*, set by the foundation chapter and
reshaped by later choices. The player carries a small set of **strengths**:

- **skill** — raises corporate promotion odds and freelance rates; gates skilled opportunities.
- **network** — surfaces founder/freelance offers more often and improves their payoff.
- **reputation** — unlocks freelance clients, partnerships, and trust-based deals.
- **capital** (cash − debt) — low debt + spare capital surfaces investing/property deals sooner.
- **discipline** — dampens stress accumulation and steadies compounding.
- **riskTolerance** — unlocks high-variance, high-upside events; raises exposure to volatility.
- **ambition** — gates the most aggressive opportunities and accelerates burnout if unchecked.

### The one rule that defines the game
**Strengths are modifiers and unlocks, never gates that lock a class.** A player with high
network and capital can take the startup offer even mid-corporate-career — it just costs career
momentum and adds stress. This is the "take a hit on your corporate career to build your own
thing" tension, expressed mechanically.

### How identity emerges
The summary screen *describes* the player after the fact based on their final profile and the
flags they accumulated — e.g. "You lived as a Hybrid Builder" or "a Burned-Out High Earner."
These labels are **post-hoc narration, never a menu pick.** Possible descriptive labels
(`[V1.1]`+ for the full set): Corporate Climber, Startup Founder, Freelancer, Investor, Property
Builder, Balanced Optimizer, Burned-Out High Earner, Slow & Steady Compounder, Risky Speculator,
Freedom Seeker, Hybrid Builder.

The player should feel:
- "I became this because of my decisions."
- "This run is different from last time."
- "I want to replay and try another path."

---

# 10. Core Gameplay Loop & Beat System `[MVP]`

## The monthly loop
Every active month:
1. The player sees current life/wealth state.
2. The player receives a meaningful event (when the beat system fires one).
3. The player chooses between 2–4 decisions.
4. The simulation engine applies consequences.
5. Stats animate and update.
6. New opportunities appear or disappear.
7. The month advances.
8. The player feels progression or pressure.

The loop must create:

> One more month addiction.

Each decision event should usually force a tradeoff: higher salary vs burnout; cheaper housing
vs networking/lifestyle; side hustle vs stress; investing vs cash safety; startup risk vs job
stability; luxury vs freedom progress; leverage vs volatility; loan vs delayed opportunity;
promotion vs health; networking vs comfort.

## The beat system — why the loop never becomes tap-grind
Monthly cadence over many years would be a grind if every month demanded a decision. It does
not. A small **pacing controller** classifies each month into one of three beats:

- **Quiet tick** (most months) — cashflow applies, one ambient status line, maybe a minor stat
  drift. No decision. Instant tap-through.
- **Decision month** — fires a real event with choices. Spaced by a cooldown of N quiet months
  *unless* a high-priority conditional event is eligible (which fires immediately).
- **Foundation density** — during Phase 1, decisions come back-to-back; the cooldown is short
  or zero. Dense early, rhythmic later.

Controller logic is trivial: if a high-priority eligible event exists → fire it; else if
`monthsSinceLastEvent >= cooldown` → fire a weighted-random eligible event; else → quiet tick.

### Required UX lever
Add a **"Skip to next decision"** action so the player fast-forwards quiet months instead of
mashing "Next Month." Quiet months should feel like momentum, never busywork.

---

# 11. Core Systems

## 11.1 Financial System `[MVP]`
Tracks: cash, monthly income, monthly expenses, savings rate, debt, investments, assets,
passive income, net worth, financial-freedom progress.

Calculated: net worth, monthly cashflow, burn rate, freedom ratio, debt-to-income, investment
allocation, emergency-fund months.

Freedom ratio:
> passive income / monthly expenses

When it reaches 100%, the player can theoretically stop depending on salary. This is the
long-horizon north-star milestone (see §12 for how the MVP scores it).

**Locked rule (already in code):** when cash runs out it becomes debt, not game over — the
shortfall rolls into liabilities and accrues interest. Going "into the red" is rising pressure,
not failure. Debt never auto-pays-down; paying it is a player choice via events.

## 11.2 Career System `[MVP]` (core) / `[V1.1]` (depth)
Tracks: skill level, salary, promotion chance, reputation, network, job security, industry
growth, burnout risk, AI disruption risk `[FUTURE]`.

Career is a tool for building freedom, not the final goal. The player should learn: high salary
helps but lifestyle inflation and burnout can trap you; skills create better opportunities;
network creates asymmetric upside; stable jobs help but aren't always enough.

## 11.3 Education / Foundation System `[MVP]`
Tracks: foundation path, debt, skill foundation, network foundation, early reputation,
discipline, financial habits, risk appetite. This is what *produces* the strength profile (§9).

Path biases (examples, tunable): engineering → higher corporate salary, tech-startup access;
business → networking + founder options; finance → investing edge; self-taught → low debt,
early income, unstable opportunities; vocational → early income, low debt, slower scaling unless
a business path emerges. Do not overcomplicate in MVP.

## 11.4 Wealth System `[V1.1]`
Tracks: cash, broad ETF, risky stock basket, side business, first property, startup equity,
debt/leverage. Keep MVP investing minimal — `[MVP]` is cash + one broad ETF only; the rest is
`[V1.1]`. Avoid for the foreseeable future: real-time stock APIs, options, crypto complexity,
tax engine, detailed mortgage simulation. Teach tradeoffs through gameplay, not a finance
platform.

## 11.5 Pressure System `[MVP]`
Tracks: stress, burnout risk, health, lifestyle/job/debt/market pressure.

High stress → productivity drops, health declines, bad events more likely, decision quality may
suffer, burnout events trigger, career progress can stall. Stress must create tension, not be
cosmetic — but it should mostly be the *result of player tradeoffs*, not random punishment.

## 11.6 Opportunity System `[V1.1]`
Tracks: network, reputation, skill, cash availability, timing, market cycle `[FUTURE]`, risk
profile. Opportunities feel earned: high network → startup offer; high skill → promotion; high
capital → property deal; high reputation → freelance clients; low stress → productivity bonus;
high ambition → risky opportunities. The player should understand *why* an opportunity appeared.

---

# 12. Win Conditions, Endings & Scoring `[MVP]`

**Winning is not "reach 100% freedom by 25."** That is almost never reachable in the slice, so
the MVP does not gate success on it. Instead:

- The freedom ratio stays the **long-horizon north-star** — a bar the player climbs all run.
- The MVP **payoff is a graded trajectory**: at the target age, the run ends and the player gets
  an **S/A/B/C/D grade** (already built) plus **how high they pushed the freedom bar** and a
  short narrated outcome. Success = the life you set up, scored — achievable and replayable.

### Endings as data (§26)
An ending is just `{ id, condition, title, copy }` evaluated at run-end; the first matching
ending (highest priority) wins. Adding endings later = adding data, never engine work.

MVP endings (`[MVP]`, reachable inside the slice — keep to ~3–4):
- **Strong Start** — high strength profile + positive cashflow trajectory.
- **Treading Water** — alive and stable but little freedom progress.
- **Early Debt Spiral** — debt and stress dominate the trajectory.
- **Burnout Warning** — high earnings bought with collapsing health/stress.

Full ending catalog (`[FUTURE]`, do not build now): Financial Independence, Flexible Work Life,
Sustainable Wealth, Balanced High Achiever, Family Security, Entrepreneurial Freedom, Quiet
Millionaire, Global Remote Investor, Purpose-Driven Wealth — and the negatives: Debt Trap,
Lifestyle Inflation Prison, Missed Opportunity, Overleveraged Collapse, Career Stagnation,
Speculation Ruin, Fragile Retirement.

The game shows consequences; it does not moralize. The player should feel: "I understand why
this happened. I want to try a better strategy."

---

# 13. Visual Experience — Extremely Important `[MVP]`

Visual quality is a top priority.

Must not look like: a generic React Native prototype, a finance dashboard, a budgeting app, a
spreadsheet, an amateur indie UI, or a plain text simulator.

Must feel: premium, cinematic, immersive, polished, modern, tactile, emotionally engaging.

The visual layer is critical for first impression, retention, App Store screenshots, user trust,
emotional attachment, and perceived value.

The player should open the app and immediately feel:
> This looks premium. I want to explore.

---

# 14. Visual Direction `[MVP]`

Mood references (do not copy directly): modern fintech, Apple Wallet polish, Arc Browser
elegance, Bloomberg-terminal seriousness, premium mobile strategy games, subtle cyberpunk
finance mood, calm dark luxury, cinematic decision cards, high-end productivity apps.

Core visual pillars: premium dark mode, layered gradients, soft glow accents, high-contrast
typography, clean cards, smooth transitions, subtle depth, modern icons, cinematic event
presentation, animated progress, satisfying stat changes.

Avoid: childish cartoons, casino visuals, cheap neon overload, cluttered dashboards, generic
flat UI, too much text per screen, ugly charts, overly bright colors.

---

# 15. UI Design Requirements `[MVP]`

Mobile-first and iPhone-first. Prioritize one-handed usability, large tap targets, readable
typography, clean spacing, minimal clutter, emotional hierarchy, clear decision buttons, fast
feedback.

Main screen communicates: current age/month, net worth, cashflow, stress, freedom progress,
current event, meaningful choices.

Suggested gameplay layout: (1) top status bar — age, month, phase; (2) wealth summary card —
net worth, cashflow, freedom %; (3) stress/health indicator; (4) event card with atmospheric
treatment; (5) choice buttons; (6) bottom nav to portfolio/career/progress.

Do not show too many numbers at once. Numbers should feel rewarding, not overwhelming.

---

# 16. Animation Requirements `[MVP]` (core) / `[V1.1]` (extras)

Include: smooth card entrance/exit, monthly transition, stat-change animation, net-worth number
animation, freedom progress ring/bar, stress pulse when high, subtle haptics on decisions, a
small glow/spark on milestones, graph movement over time, phase-transition scenes.

Motion should feel premium, elegant, restrained, satisfying. Avoid childish bouncing, casino
flashing, particle overload, slow annoying animations. Use animation to make progression feel
alive.

---

# 17. Graphics Requirements `[MVP]` (simple) / `[FUTURE]` (rich)

Not a 3D game, but it needs a strong visual identity. Possible elements: character
silhouette/profile card, city skyline background, themed abstract backgrounds, animated wealth
graph, asset icons, event-category illustrations, opportunity cards, freedom-milestone visuals,
phase-transition scenes, atmospheric gradients.

For MVP use simple but polished visuals — icons, abstract illustrations, gradients, subtle
animated backgrounds, card art. Do not require expensive custom art. But do not make it
text-only.

---

# 18. Game Engine / Technical Exploration

Preferred stack: React Native, Expo (SDK 54 pinned until first EAS build), TypeScript.

Visual/animation libraries (all SDK-54 compatible, already installed): React Native Reanimated,
React Native Skia, Expo Haptics, Gesture Handler, Zustand, expo-linear-gradient.

Recommended direction: React Native + Expo for app shell and UI; Reanimated for transitions;
Skia for premium charts/effects; a deterministic, data-driven simulation engine in TypeScript.

Avoid: Unity/Unreal, heavy 3D/physics, engine complexity that slows iteration.

---

# 19. AI Philosophy

AI is used for narrative and flavor only.

AI must **not** control: money calculations, progression, probability, balancing, win/lose
logic, investment returns, or core simulation.

AI may generate: event descriptions, personalized narrative, advisor commentary, yearly
summaries, ending summaries, emotional flavor, alternative wording, contextual story fragments.

The game must work fully without AI. The AI layer is optional and isolated. If the API fails,
deterministic fallback content appears. This is critical for reliability and cost control.
**AI is `[FUTURE]` — do not add it until the core loop feels good.**

---

# 20. Architecture Philosophy

Modular, lightweight, scalable. Avoid overengineering. Clean separation:

- **20.1 Simulation Engine** — pure TypeScript: money, income, expenses, investments, debt,
  stress, career, probabilities, monthly progression, phase progression, win/loss checks.
  Testable without UI.
- **20.2 Event Engine** — a *dumb interpreter* over data (see §26). It filters content by
  conditions, weights eligible content, applies effects, and reads/writes flags. It knows
  nothing about specific events.
- **20.3 Narrative Layer** — AI text + fallback text + tone + summaries. Must not mutate core
  state.
- **20.4 Visual Experience Layer** — transitions, animations, haptics, charts, effects,
  milestone visuals.
- **20.5 UI Layer** — screens, components, navigation, decision cards, portfolio/career/progress.
- **20.6 Persistence Layer** — local save/load for MVP; save slots and cloud sync later.

---

# 21. Suggested Folder Structure

```txt
/src
  /app
    App.tsx
    navigation.tsx
  /components
    /common      Button.tsx Card.tsx StatBadge.tsx ProgressBar.tsx
    /game        EventCard.tsx ChoiceButton.tsx WealthSummaryCard.tsx StressMeter.tsx FreedomProgress.tsx MonthTransition.tsx
    /visual      AnimatedBackground.tsx WealthGraph.tsx GlowEffect.tsx PhaseBanner.tsx
  /screens       StartScreen.tsx FoundationScreen.tsx GameScreen.tsx PortfolioScreen.tsx CareerScreen.tsx YearSummaryScreen.tsx GameOverScreen.tsx
  /systems       simulationEngine.ts eventEngine.ts pacingController.ts progressionEngine.ts careerEngine.ts wealthEngine.ts stressEngine.ts freedomEngine.ts
  /content
    /events      foundationEvents.ts careerEvents.ts investingEvents.ts crisisEvents.ts opportunityEvents.ts
    endings.ts
    index.ts     # imports + registers all content; engine reads only this
  /data          foundationPaths.ts strengths.ts constants.ts
  /state         gameStore.ts settingsStore.ts
  /types         game.ts events.ts player.ts finance.ts
  /services      aiNarrativeService.ts storageService.ts
  /styles        theme.ts typography.ts spacing.ts colors.ts
  /utils         formatMoney.ts random.ts calculations.ts
/docs            vision.md gameplay.md architecture.md roadmap.md prompts.md
```

`/content` and `pacingController.ts` are new in v3. Adding content means editing files under
`/content` only — never the engine.

---

# 22. MVP Scope `[MVP]`

See §0.2 for the authoritative MVP definition. In short: start screen + foundation-path pick;
foundation chapter 18→~22 setting the strength profile; transition into early career; the
strength system biasing opportunities; simple financial + pressure systems; ~30 events in the
§26 schema; 3–4 endings + grade; local save/load; premium visuals and smooth animation; a
complete graded run; iPhone testing via Expo.

---

# 23. Explicitly Out of Scope for MVP

Do not implement yet: multiplayer, real stock APIs, advanced tax engine, options trading, crypto
complexity, full relationship system, children/family simulation, immigration system, full
backend, user accounts, subscriptions, payments, a huge event database, voice AI, 3D, open
world, heavy game-engine architecture.

> The MVP goal is: **small but premium, playable, emotionally engaging.**

---

# 24. First Playable Milestone `[MVP]`

> A visually polished iPhone build where the player picks a foundation path at 18, makes
> dense early decisions that visibly shape their strengths, watches cash/stress/freedom move,
> reaches the target age, and gets a graded outcome — and wants one more run.

Specifically: pick a foundation path → start at 18 → make foundation decisions → see the
strength profile form → continue into early career → see freedom/stress/net-worth change →
reach the target age → graded summary → "play again." This matters more than feature count.

---

# 25. Initial Event Categories

Foundation `[MVP]`: education choice, major, student debt, side hustle, first job, internship,
networking, first investment, living situation, financial habits, skill building, startup
experiment.

Career `[V1.1]`: promotion, job offer, layoff risk, burnout, manager conflict, skill upgrade,
relocation, career switch, freelance client, startup opportunity.

Investing `[V1.1]`: market dip, ETF investing, risky stock, property deal, emergency fund,
lifestyle inflation, leverage temptation.

Pressure `[MVP]` (light): rent increase, health issue, family support request, unexpected
expense. `[V1.1]`: economic crisis, debt pressure, burnout warning.

Opportunity `[V1.1]`: mentor, networking contact, early startup equity, business partner,
freelance expansion, high-income role, property discount.

---

# 26. Content Schema — the extensible system `[MVP]`

This is the system that lets us add content forever without touching the engine. The engine is
a dumb interpreter; intelligence lives in data. Three primitives make it work: **conditions**,
**flags**, and **weights**.

### Event schema
```ts
type GameEvent = {
  id: string;
  title: string;
  category: "foundation" | "career" | "investing" | "pressure" | "opportunity";
  phase: "foundation" | "career" | "growth" | "freedom";
  priority?: number;            // higher = fires before normal weighted events
  weight?: number;              // soft randomness among eligible events (default 1)
  repeatable?: boolean;         // default false; fires once per run unless true
  conditions?: EventConditions; // ALL must pass for the event to be eligible
  choices: Choice[];
  fallbackText?: string;        // deterministic text if AI narrative is off/unavailable
  tags?: string[];
};

type EventConditions = {
  minAge?: number;
  maxAge?: number;
  phase?: GameEvent["phase"];
  foundationPath?: string[];          // e.g. ["university","self_taught"]
  stats?: Record<string, string>;     // threshold expressions: { network: ">=40", debt: "<=5000" }
  requiresFlags?: string[];           // all must be present
  forbidsFlags?: string[];            // none may be present
};

type Choice = {
  id: string;
  label: string;
  effects: Partial<Record<StatKey, number>>; // deltas applied to player stats/finances
  setsFlags?: string[];                       // flags this choice writes onto the player
  resultText?: string;
};
```

### Flags — how early choices reach forward
A **flag** is just a string on the player (`player.flags: string[]`, generalizing the existing
`traits[]`). Choices *set* flags (`dropped_out`, `has_side_business`, `took_big_loan`); later
events *require or forbid* them via `conditions`. This is the wire that connects a university
decision at 19 to an opportunity at 30 — with zero engine changes. A founder offer at 28 can
simply require `["has_side_business"]`; a corporate fast-track can forbid `["dropped_out"]`.

### Endings as data
```ts
type Ending = {
  id: string;
  priority: number;                 // first match by priority wins
  condition: EventConditions;       // same condition system as events
  title: string;
  copy: string;
};
```

### Engine contract (the only logic that touches content)
1. Each beat, gather all events where every condition passes and (if not repeatable) it hasn't
   fired this run.
2. If any eligible event has `priority`, fire the highest-priority one.
3. Else respect the pacing cooldown (§10); when due, pick one weighted-random eligible event.
4. Apply the chosen choice's `effects`, write its `setsFlags`, log it to history.
5. At run-end, evaluate endings by priority; the first whose condition passes is the outcome.

Adding content = appending objects to `/content/*`. The engine never changes.

### Example event (v3 format)
```ts
{
  id: "first_student_loan_decision",
  title: "Student Loan Decision",
  category: "foundation",
  phase: "foundation",
  conditions: { minAge: 18, maxAge: 22, foundationPath: ["university"] },
  choices: [
    { id: "take_loan",   label: "Take the loan and focus on study",
      effects: { cash: 5000, debt: 5000, skill: 5, stress: 5 }, setsFlags: ["took_big_loan"] },
    { id: "work_part",   label: "Work part-time to reduce debt",
      effects: { income: 300, stress: 10, skill: -2, debt: 1000 }, setsFlags: ["worked_through_school"] },
    { id: "cheaper_path",label: "Choose a cheaper local path",
      effects: { debt: 1000, network: -3, stress: -3 } }
  ],
  tags: ["debt","education","early_choice"]
}
```

---

# 27. Player State `[MVP]`

```ts
type PlayerState = {
  age: number;
  month: number;
  phase: "foundation" | "career" | "growth" | "freedom";
  foundationPath: "university" | "vocational" | "self_taught" | "straight_to_work";

  // finances
  cash: number;
  salary: number;
  expenses: number;
  debt: number;
  investments: number;
  assets: number;
  passiveIncome: number;
  netWorth: number;       // derived: cash + assets + investments - debt

  // strengths (set by the foundation chapter, reshaped by later choices)
  skill: number;
  network: number;
  reputation: number;
  discipline: number;
  riskTolerance: number;
  ambition: number;

  // pressure
  stress: number;
  health: number;

  // emergent identity wiring
  flags: string[];          // generalizes the old traits[]; events read/write these
  firedEventIds: string[];  // for non-repeatable events

  freedomRatio: number;     // derived: passiveIncome / expenses
  history: MonthlySnapshot[];
};
```

**Removed in v3:** any locked `archetype` / `careerDirection` class field. Identity is the shape
of the strengths + flags, narrated at run-end (§9, §12).

---

# 28. Visual Components Required Early `[MVP]`

AnimatedBackground, WealthSummaryCard, EventCard, ChoiceButton, StressMeter, FreedomProgress,
MonthTransition, WealthGraph, StatChangeAnimation, YearSummaryCard. The game must feel premium
from the first screen.

---

# 29. Claude's Role

Claude acts as: lead technical architect, implementation planner, game-design translator,
visual-quality advocate, development manager for Claude Code.

Claude should: break work into small tasks; write clear Claude Code prompts; protect the
architecture; keep visuals polished; prevent overengineering; prevent scope explosion (enforce
the scope tags); maintain docs; recommend when to refactor or simplify.

Claude should not: blindly add features; overcomplicate architecture; make it feel like a
dashboard; ignore visual polish; let AI control simulation logic.

---

# 30. Claude Code Usage Strategy

Small, concrete tasks. One screen, one engine, one refactor, one effect, ten events, one
animation, one bug — never "build the whole game." Do not let Claude Code rewrite the project
repeatedly.

---

# 31. Development Phases

- **Phase A — Visual Foundation** `[MVP]`: app shell, dark theme, animated background,
  typography, card system, buttons, haptics, navigation.
- **Phase B — Foundation Gameplay** `[MVP]`: player state, monthly loop + beat system,
  foundation events, choices/effects, strength profile forming, run to target age, graded
  summary.
- **Phase C — Wealth Systems** `[MVP]` core / `[V1.1]` depth: cashflow, expenses, debt, net
  worth, freedom progress, animated wealth graph.
- **Phase D — Career Direction** `[V1.1]`: skill/network/reputation depth; emergent biasing
  toward corporate/founder/freelancer/investor via strengths + flags; opportunity unlocks.
- **Phase E — Polish & Feel** `[MVP]` ongoing: animations, event presentation, milestones,
  stress feedback, phase transitions, onboarding.
- **Phase F — AI Narrative Layer** `[FUTURE]`: optional AI text, summaries, fallback, isolated
  service. Not before the core loop feels good.

---

# 32. Design Principles

1. Start meaningful immediately.
2. Every decision should have tradeoffs.
3. Make progress visible.
4. Make stress matter.
5. Avoid random chaos.
6. Avoid spreadsheet feeling.
7. Keep UI premium.
8. Let the player shape identity through choices (never a class pick).
9. Show consequences clearly.
10. Focus on freedom, not greed.

---

# 33. Tone and Writing Style

Mature, concise, emotionally grounded, realistic, strategic, slightly cinematic.

Avoid: meme humor, childish jokes, overly long text, lecture tone, boring finance education,
fake motivational quotes.

Good event tone:
> Your rent increases just as your internship ends. You can preserve cash, take more work, or
> invest in a skill that may pay off later.

Bad event tone:
> LOL capitalism is hard! Pick one!

Respect the player's intelligence.

---

# 34. App Store Future Considerations

Publishable on iOS first, Google Play later. Keep cross-platform-friendly code, avoid iOS-only
assumptions, keep React Native / Expo compatibility, keep performance smooth, avoid exposed API
keys, keep AI behind a backend later. Local-only is fine for MVP.

---

# 35. Key Product Risks

Risks: too spreadsheet-like; too BitLife-like; too broad; too educational; not visually polished;
choices feel meaningless; AI makes logic inconsistent; scope explosion; boring early game.

Mitigations: start at 18 with real financial pressure; focus on wealth/freedom not full life;
premium visuals; tradeoff-heavy choices; deterministic simulation; visible progress; enforce
scope tags; polish the core loop before adding systems; use the beat system to keep pacing tight.

---

# 36. Current Product Decisions (LOCKED in v3)

1. **No archetype classes.** Early-life choices set a **strength profile** (skill, network,
   reputation, capital, discipline, riskTolerance, ambition). Strengths are modifiers and
   unlocks, never gates. Identity emerges and is narrated at run-end. (§2, §9, §27)
2. **Data-driven content engine.** Events, choices, and endings are data validated against a
   condition system, with flags wiring early choices to late consequences and weights for soft
   randomness. The engine never changes when content is added. (§26)
3. **One document, scope-tagged.** Everything is `[MVP]` / `[V1.1]` / `[FUTURE]`. Claude Code
   builds only `[MVP]` unless told otherwise. (§0.1, §0.2)
4. **Beat system for pacing.** Quiet ticks vs decision months vs dense foundation, plus a
   "Skip to next decision" control. The loop never becomes tap-grind. (§10)
5. **Graded trajectory, not binary win.** Freedom ratio is the long-horizon north-star; the MVP
   payoff is an S/A/B/C/D grade plus freedom-bar progress and a narrated ending. (§12)

The foundation phase (age 18 start) is core, not optional. Claude should plan, architect, and
prompt Claude Code accordingly.

---

# 37. Final Instruction to Claude

Act as the technical/product bridge between the founder and Claude Code.

Build:
> A premium iPhone-first strategic wealth journey simulator about escaping financial pressure
> and building freedom, where the player's early choices shape the strengths that define how
> the rest of the journey plays out.

Prioritize: (1) visual polish, (2) emotional engagement, (3) meaningful decisions, (4) fast
iteration, (5) clean architecture, (6) mobile-first UX.

Do not overbuild. Do not make a generic life simulator. Do not make a finance dashboard. Build
a small but premium vertical slice first.

The first great version should make the player think:
> I want to play one more month.
