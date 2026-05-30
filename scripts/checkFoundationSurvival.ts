// Foundation survivability check after the Phase-4 economy rescale.
// Drives university runs through the foundation chapter (age 18 → 22)
// across seeds × policies and reports:
//   - % of runs that ended foundation with cash = 0 (clamp triggered)
//   - % of runs with debt > 100k at age 22 (debt spiral risk)
//   - % of runs with stress >= 70 or health <= 35 at age 22 (collapse)
//   - median expenses / debt / cash at age 22

declare const console: { log: (...args: unknown[]) => void };

import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
} from '../src/data/constants';
import { ALL_EVENTS } from '../src/content';
import {
  createPlayerFromStartPoint,
  type Phase,
  type Player,
} from '../src/game/player';
import { tick } from '../src/game/tick';
import {
  applyChoice,
  getEligibleEvents,
  pickEvent,
} from '../src/systems/eventEngine';
import { decideBeat } from '../src/systems/pacingController';
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import type { GameEvent } from '../src/types/events';

const log = (msg: string) => console.log(msg);

function addUniqueFlag(flags: string[], flag: string): string[] {
  return flags.includes(flag) ? flags : [...flags, flag];
}
function maybeTransitionToCareer(p: Player): Player {
  if (p.phase !== 'foundation') return p;
  if (p.age < FOUNDATION_END_AGE) return p;
  const hasDirectional = DIRECTIONAL_FLAGS.some((f) => p.flags.includes(f));
  if (hasDirectional) return { ...p, phase: 'career' };
  if (p.age >= FOUNDATION_SAFETY_AGE) {
    return { ...p, phase: 'career', flags: addUniqueFlag(p.flags, 'undecided') };
  }
  return p;
}
const LATER_PHASE_ORDER: ReadonlyArray<Exclude<Phase, 'foundation'>> = [
  'career',
  'growth',
  'freedom',
];
function maybeAdvancePhase(p: Player): Player {
  if (p.phase === 'foundation') return p;
  let target: Exclude<Phase, 'foundation'> = 'career';
  for (const phase of LATER_PHASE_ORDER) {
    if (p.age >= PHASE_START_AGES[phase]) target = phase;
  }
  const cur = LATER_PHASE_ORDER.indexOf(p.phase as Exclude<Phase, 'foundation'>);
  const tgt = LATER_PHASE_ORDER.indexOf(target);
  if (tgt <= cur) return p;
  return { ...p, phase: target };
}
function expirePending(player: Player): Player {
  if (player.pendingDecisions.length === 0) return player;
  const surviving: Player['pendingDecisions'] = [];
  const expiredIds: string[] = [];
  for (const p of player.pendingDecisions) {
    if (p.expiryMonth <= player.month) expiredIds.push(p.eventId);
    else surviving.push(p);
  }
  if (expiredIds.length === 0) return player;
  const firedSet = new Set(player.firedEventIds);
  for (const id of expiredIds) firedSet.add(id);
  let next: Player = {
    ...player,
    pendingDecisions: surviving,
    firedEventIds: Array.from(firedSet),
  };
  for (const id of expiredIds) {
    const event = ALL_EVENTS.find((e) => e.id === id);
    if (!event?.onLapse) continue;
    next = applyChoice(next, event, {
      id: `${event.id}__lapse`,
      label: '',
      effects: event.onLapse.effects ?? {},
      setsFlags: event.onLapse.setsFlags,
    });
  }
  return next;
}

function step(player: Player, msle: number): {
  player: Player;
  msle: number;
  currentEvent: GameEvent | null;
} {
  const ticked = expirePending(tick(player));
  const phased = maybeAdvancePhase(maybeTransitionToCareer(ticked));
  const nextMsle = msle + 1;
  const eligible = getEligibleEvents(phased, ALL_EVENTS);
  const hasPriority = eligible.some((e) => (e.priority ?? 0) > 0);
  const beat = decideBeat({
    phase: phased.phase,
    monthsSinceLastEvent: nextMsle,
    hasPriorityEligible: hasPriority,
  });
  if (beat === 'quiet') return { player: phased, msle: nextMsle, currentEvent: null };
  const event = pickEvent(eligible, beat);
  return { player: phased, msle: nextMsle, currentEvent: event };
}

// Drive a FULL university run to age 60 too — to see whether foundation
// stress decays by run end. Stress at 60 is what the grade reads.
function driveFullRun(seed: number, policyIdx: number) {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player = createPlayerFromStartPoint('university');
    const policy = POLICIES[policyIdx];
    let msle = 0;
    for (let i = 0; i < 12 * 50; i++) {
      const s = step(player, msle);
      player = s.player;
      msle = s.msle;
      if (player.age >= 60) break;
      if (s.currentEvent) {
        const idx = policy.pickIndex(s.currentEvent, rng);
        const choice = s.currentEvent.choices[idx] ?? s.currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, s.currentEvent, choice);
          msle = 0;
        }
      }
    }
    return player;
  });
}

// Drive a university run ONLY through foundation (stop at age 22).
function driveFoundationOnly(seed: number, policyIdx: number) {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player = createPlayerFromStartPoint('university');
    const policy = POLICIES[policyIdx];
    let msle = 0;
    let cashHitZero = false;
    let peakStress = player.stress;
    let troughHealth = player.health;
    // Stop the first month age reaches 22 (or after a safety cap).
    for (let i = 0; i < 12 * 8; i++) {
      const s = step(player, msle);
      player = s.player;
      msle = s.msle;
      if (player.cash <= 0) cashHitZero = true;
      peakStress = Math.max(peakStress, player.stress);
      troughHealth = Math.min(troughHealth, player.health);
      if (player.age >= 22) break;
      if (s.currentEvent) {
        const idx = policy.pickIndex(s.currentEvent, rng);
        const choice = s.currentEvent.choices[idx] ?? s.currentEvent.choices[0];
        if (choice) {
          player = applyChoice(player, s.currentEvent, choice);
          msle = 0;
        }
      }
    }
    return { player, cashHitZero, peakStress, troughHealth };
  });
}

const SEEDS = [11, 47, 89, 131, 199, 233];
const results: ReturnType<typeof driveFoundationOnly>[] = [];
for (const seed of SEEDS) {
  for (let p = 0; p < POLICIES.length; p++) {
    results.push(driveFoundationOnly(seed, p));
  }
}

function median(xs: number[]): number {
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  return Math.round(sorted[Math.floor(sorted.length / 2)]);
}

const n = results.length;
const cashZeroRuns = results.filter((r) => r.cashHitZero).length;
const highDebt = results.filter((r) => r.player.debt > 100_000).length;
const collapsed = results.filter((r) => r.peakStress >= 70 || r.troughHealth <= 35).length;
const finalCash = results.map((r) => Math.round(r.player.cash));
const finalDebt = results.map((r) => Math.round(r.player.debt));
const finalExpenses = results.map((r) => Math.round(r.player.expenses));
const finalSalary = results.map((r) => Math.round(r.player.salary));
const finalStress = results.map((r) => Math.round(r.player.stress));
const peakStressArr = results.map((r) => Math.round(r.peakStress));

log(`# FOUNDATION SURVIVABILITY — university 18 → 22, n=${n} (${SEEDS.length} seeds × ${POLICIES.length} policies)`);
log('');
log('## Failure-mode counts');
log(`  cash hit 0 (rolled into debt) at any point: ${cashZeroRuns}/${n}  (${Math.round((cashZeroRuns / n) * 100)}%)`);
log(`  ended foundation with debt > $100k:        ${highDebt}/${n}  (${Math.round((highDebt / n) * 100)}%)`);
log(`  stress ≥ 70 or health ≤ 35 during chapter: ${collapsed}/${n}  (${Math.round((collapsed / n) * 100)}%)`);
log('');
log('## Median state at age 22');
log(`  expenses: $${median(finalExpenses).toLocaleString()}`);
log(`  salary:   $${median(finalSalary).toLocaleString()}`);
log(`  cash:     $${median(finalCash).toLocaleString()}`);
log(`  debt:     $${median(finalDebt).toLocaleString()}`);
log(`  peak stress observed (median across runs): ${median(peakStressArr)}`);
log(`  END-of-foundation stress (median):          ${median(finalStress)}`);
log('');
log('');
log('## Stress trajectory: does it decay across the full run (18 → 60)?');
const fullRunFinalStress: number[] = [];
const fullRunFinalHealth: number[] = [];
const fullRunFinalCash: number[] = [];
const fullRunFinalDebt: number[] = [];
const fullRunFinalNetWorth: number[] = [];
for (const seed of SEEDS) {
  for (let p = 0; p < POLICIES.length; p++) {
    const player = driveFullRun(seed, p);
    fullRunFinalStress.push(Math.round(player.stress));
    fullRunFinalHealth.push(Math.round(player.health));
    fullRunFinalCash.push(Math.round(player.cash));
    fullRunFinalDebt.push(Math.round(player.debt));
    fullRunFinalNetWorth.push(
      Math.round(player.cash + player.assets + player.investments - player.debt),
    );
  }
}
log(`  age-60 stress (median across runs):  ${median(fullRunFinalStress)}`);
log(`  age-60 health (median):              ${median(fullRunFinalHealth)}`);
log(`  age-60 cash (median):                $${median(fullRunFinalCash).toLocaleString()}`);
log(`  age-60 debt (median):                $${median(fullRunFinalDebt).toLocaleString()}`);
log(`  age-60 net worth (median):           $${median(fullRunFinalNetWorth).toLocaleString()}`);
log('');
log('## Verdict');
// What we actually care about: did the player END foundation in a state
// they can grow from, and does the FULL RUN reach 60 with viable
// economics? Foundation stress is allowed to spike — events stress the
// player narratively — as long as it decays before grade time.
const bankruptedRuns = results.filter(
  (r) => r.player.debt > 200_000 && r.player.cash < 5_000,
).length;
const runEndCollapsed = fullRunFinalStress.filter((s) => s >= 70).length;
const runEndHealthy = fullRunFinalHealth.filter((h) => h <= 35).length;
log(`  ended foundation truly bankrupt (debt > $200k AND cash < $5k): ${bankruptedRuns}/${n}`);
log(`  age 60 stress ≥ 70: ${runEndCollapsed}/${fullRunFinalStress.length}`);
log(`  age 60 health ≤ 35: ${runEndHealthy}/${fullRunFinalHealth.length}`);
if (bankruptedRuns / n < 0.2 && runEndCollapsed / fullRunFinalStress.length < 0.5) {
  log('  → Foundation plays survivable: stress spikes in-chapter, but most runs reach 60 viable.');
} else {
  log('  ⚠ Foundation chapter shows persistent distress — scale may need adjustment.');
}
