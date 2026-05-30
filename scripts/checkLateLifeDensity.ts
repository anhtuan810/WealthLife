// Quick density probe for the late-life content expansion.
// Drives a single 18→60 (university) and 38→60 (midlife corporate) run
// per policy, recording when each decision fires and on which event id.
// Reports growth + freedom phase counts and the gaps between decisions,
// plus a per-id histogram for the new content.
//
// Run with: tsc -p tsconfig.sim.json && node .sim-build/scripts/checkLateLifeDensity.js

declare const console: { log: (...args: unknown[]) => void };

import {
  DIRECTIONAL_FLAGS,
  FOUNDATION_END_AGE,
  FOUNDATION_SAFETY_AGE,
  PHASE_START_AGES,
  RUN_TARGET_AGE_DEFAULT,
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
  evaluateEndings,
  getEligibleEvents,
  pickEvent,
} from '../src/systems/eventEngine';
import { decideBeat } from '../src/systems/pacingController';
import { POLICIES } from '../src/sim/policies';
import { mulberry32, withMathRandom } from '../src/sim/rng';
import type { GameEvent } from '../src/types/events';
import type { StartPointId } from '../src/data/startPoints';

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
  const currentIdx = LATER_PHASE_ORDER.indexOf(
    p.phase as Exclude<Phase, 'foundation'>,
  );
  const targetIdx = LATER_PHASE_ORDER.indexOf(target);
  if (targetIdx <= currentIdx) return p;
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
  let next: Player = { ...player, pendingDecisions: surviving, firedEventIds: Array.from(firedSet) };
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

type Decision = { month: number; age: number; phase: Phase; id: string };

function driveRun(
  startPoint: StartPointId,
  direction: 'corporate' | 'founder' | 'freelancer' | undefined,
  seed: number,
  policyIdx: number,
): Decision[] {
  const rng = mulberry32(seed);
  return withMathRandom(rng, () => {
    let player =
      startPoint === 'university'
        ? createPlayerFromStartPoint(startPoint)
        : createPlayerFromStartPoint(startPoint, direction);
    const policy = POLICIES[policyIdx];
    let monthsSinceLastEvent = 0;
    const decisions: Decision[] = [];
    const monthCap = (RUN_TARGET_AGE_DEFAULT - player.age) * 12 + 200;

    for (let mc = 0; mc < monthCap; mc++) {
      player = expirePending(tick(player));
      player = maybeAdvancePhase(maybeTransitionToCareer(player));
      monthsSinceLastEvent += 1;
      if (player.age >= player.targetAge) break;
      const eligible = getEligibleEvents(player, ALL_EVENTS);
      const hasPriority = eligible.some((e) => (e.priority ?? 0) > 0);
      const beat = decideBeat({
        phase: player.phase,
        monthsSinceLastEvent,
        hasPriorityEligible: hasPriority,
      });
      if (beat === 'quiet') continue;
      const event = pickEvent(eligible, beat);
      if (!event) continue;
      const idx = policy.pickIndex(event, rng);
      const choice = event.choices[idx] ?? event.choices[0];
      if (!choice) continue;
      player = applyChoice(player, event, choice);
      monthsSinceLastEvent = 0;
      decisions.push({ month: player.month, age: player.age, phase: player.phase, id: event.id });
    }
    return decisions;
  });
}

function summarize(label: string, decisions: Decision[]) {
  const byPhase: Record<string, Decision[]> = {};
  for (const d of decisions) {
    (byPhase[d.phase] ??= []).push(d);
  }
  log(`### ${label}`);
  log(`  total decisions: ${decisions.length}`);
  for (const phase of ['foundation', 'career', 'growth', 'freedom']) {
    const list = byPhase[phase] ?? [];
    if (list.length === 0) {
      log(`  ${phase.padEnd(10)} 0 decisions`);
      continue;
    }
    // mean gap in months
    let prevMonth = list[0].month;
    let totalGap = 0;
    let maxGap = 0;
    for (let i = 1; i < list.length; i++) {
      const gap = list[i].month - prevMonth;
      totalGap += gap;
      if (gap > maxGap) maxGap = gap;
      prevMonth = list[i].month;
    }
    const meanGap = list.length > 1 ? totalGap / (list.length - 1) : 0;
    log(
      `  ${phase.padEnd(10)} ${String(list.length).padStart(3)} decisions   mean-gap ${meanGap.toFixed(1)}mo  max-gap ${maxGap}mo`,
    );
  }
  // new-content firings
  const NEW_IDS = new Set([
    'growth_family_milestone',
    'growth_windfall',
    'growth_layoff',
    'growth_second_stream',
    'growth_payoff_vs_invest',
    'growth_bad_bet',
    'growth_peak_earning',
    'growth_burnout_fork',
    'growth_market_drift',
    'growth_market_drift_mid',
    'growth_market_drift_late',
    'freedom_healthcare',
    'freedom_help_family',
    'freedom_encore',
    'freedom_legacy',
    'freedom_late_scare',
    'freedom_enough',
    'freedom_quiet_season',
    'freedom_quiet_season_late',
  ]);
  const newHits = decisions.filter((d) => NEW_IDS.has(d.id));
  const counts = new Map<string, number>();
  for (const d of newHits) counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
  log(`  new-content firings: ${newHits.length}`);
  for (const id of Array.from(counts.keys()).sort()) {
    log(`    ${id.padEnd(32)} ${counts.get(id)}`);
  }
  log('');
}

log('# LATE-LIFE DENSITY PROBE');
log('');

// 18→60 (university), policy 0 across a couple of seeds.
const SEEDS = [11, 47, 131];
for (const seed of SEEDS) {
  for (const policyIdx of [0, 1, 2]) {
    const decs = driveRun('university', undefined, seed, policyIdx);
    summarize(`18→60  university  seed=${seed}  policy=${POLICIES[policyIdx].id}`, decs);
  }
}
// 38→60 (midlife corporate)
for (const seed of SEEDS) {
  for (const policyIdx of [0, 1, 2]) {
    const decs = driveRun('midlife', 'corporate', seed, policyIdx);
    summarize(`38→60  midlife-corp seed=${seed}  policy=${POLICIES[policyIdx].id}`, decs);
  }
}
log('# END OF PROBE');
