import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FreedomMeter } from '../components/FreedomMeter';
import { NetWorthChart } from '../components/NetWorthChart';
import { PrimaryButton } from '../components/PrimaryButton';
import { LifeFigure } from '../components/visual/LifeFigure';
import {
  StatGlyph,
  type StatGlyphName,
} from '../components/visual/StatGlyph';
import { colors, radii, spacing, typography } from '../theme';
import { FOUNDATION_PATH_BY_ID } from '../data/foundationPaths';
import { identityTitle } from '../data/directions';
import { freedomPct, leaningFromFlags, netWorth, type Player } from '../game/player';
import { useGameStore } from '../state/gameStore';
import { CashFlowDetail } from './dashboard/CashFlowDetail';
import { DebtDetail } from './dashboard/DebtDetail';
import { DetailSheet } from './dashboard/DetailSheet';
import { projectedCashFlow } from '../game/cashFlow';
import { ALL_EVENTS } from '../content';
import { PENDING_DECISIONS_CAP } from '../data/constants';

const fmtMoney = (n: number) => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

// Cash flow shows an explicit sign even when positive ("+$600" / "−$420").
// Uses the same minus glyph as fmtMoney so signed-money formatting stays
// visually consistent across the dashboard.
const fmtSigned = (n: number) => {
  const rounded = Math.round(n);
  if (rounded === 0) return '$0';
  const sign = rounded < 0 ? '-' : '+';
  return `${sign}$${Math.abs(rounded).toLocaleString('en-US')}`;
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// projectedCashFlow lives in ./dashboard/cashFlow.ts so this screen and the
// detail sheet read from the same source — the NET row in the sheet always
// reconciles with the value shown here. See that module for the formula and
// the open follow-up about the missing prior-month snapshot for trend arrows.

// Six strength pips arranged around the hero. Left column reads top-to-bottom
// as SKILL / DISCIPLINE / RISK; right as NETWORK / REP / AMBITION. Icons are
// drawn in Skia (see StatGlyph) so we don't depend on an icon library.
type StrengthPip = {
  key: keyof Player;
  label: string;
  glyph: StatGlyphName;
};
const LEFT_STRENGTHS: ReadonlyArray<StrengthPip> = [
  { key: 'skill', label: 'SKILL', glyph: 'wrench' },
  { key: 'discipline', label: 'DISCIPLINE', glyph: 'target' },
  { key: 'riskTolerance', label: 'RISK', glyph: 'bolt' },
];
const RIGHT_STRENGTHS: ReadonlyArray<StrengthPip> = [
  { key: 'network', label: 'NETWORK', glyph: 'network' },
  { key: 'reputation', label: 'REP', glyph: 'star' },
  { key: 'ambition', label: 'AMBITION', glyph: 'trendingUp' },
];

export function DashboardLayer() {
  const { width } = useWindowDimensions();
  const player = useGameStore((s) => s.player);
  const freedomPulse = useGameStore((s) => s.freedomPulse);
  const advanceMonth = useGameStore((s) => s.advanceMonth);
  const skipToNextDecision = useGameStore((s) => s.skipToNextDecision);
  const currentEvent = useGameStore((s) => s.currentEvent);
  const openPendingDecision = useGameStore((s) => s.openPendingDecision);

  // Which money-row detail sheet is open. Null = none. Local state on the
  // dashboard since these views are informational, not part of game flow.
  const [sheet, setSheet] = useState<'cashflow' | 'debt' | null>(null);
  // Pending-decisions tray. Local UI state; the list itself lives on the
  // player. Closed by tapping the backdrop, the close glyph, or any entry.
  const [pendingOpen, setPendingOpen] = useState(false);

  // Transient milestone beat for <LifeFigure>. We watch month advances here
  // (engine layer would also work, but the dashboard is the consumer) and
  // light up `celebrate` for ~1.8s after a real crossing. The figure stays
  // presentational — see celebrate prop on LifeFigure.
  const [celebrate, setCelebrate] = useState(false);
  const milestoneRef = useRef<{
    netWorth: number;
    freedom: number;
    month: number;
  } | null>(null);

  useEffect(() => {
    if (!player) return;
    const curNet = netWorth(player);
    const curFreedom = freedomPct(player);
    const prev = milestoneRef.current;
    // First snapshot — record baseline, no beat. Avoids spurious celebration
    // on mount from a player that's already past a threshold.
    if (prev === null) {
      milestoneRef.current = {
        netWorth: curNet,
        freedom: curFreedom,
        month: player.month,
      };
      return;
    }
    if (prev.month !== player.month) {
      const crossedZero = prev.netWorth < 0 && curNet >= 0;
      const crossedFF = [25, 50, 100].some(
        (t) => prev.freedom < t && curFreedom >= t,
      );
      if (crossedZero || crossedFF) setCelebrate(true);
      milestoneRef.current = {
        netWorth: curNet,
        freedom: curFreedom,
        month: player.month,
      };
    }
  }, [player]);

  // Auto-clear the beat so the figure returns to its normal stress/freedom-
  // driven expression. ~1.8s feels like a nod, not a confetti spray.
  useEffect(() => {
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(false), 1800);
    return () => clearTimeout(id);
  }, [celebrate]);

  if (!player) return null;

  const path = FOUNDATION_PATH_BY_ID[player.foundationPath];
  const advanceDisabled = !!currentEvent;

  // Committed direction wins; fall back to flag-derived leaning so the figure
  // outfit can hint at the player's tilt even before they take the
  // choose_direction beat.
  const direction = player.direction ?? leaningFromFlags(player.flags);
  // Identity title under the figure reads from the committed direction only —
  // pre-commit career players show the muted "Finding your direction" state
  // even when a leaning flag has already tilted the figure's outfit.
  const identity = identityTitle(player.phase, player.direction);
  // Figure's stress prop is 0–5; engine stores 0–100.
  const figureStress = clamp(player.stress / 20, 0, 5);
  const figureFreedom =
    player.expenses > 0
      ? clamp(player.passiveIncome / player.expenses, 0, 1)
      : 0;
  // Smaller hero than v1 so the 3 flanking stat pips on each side get
  // breathing room without crowding the halo.
  const figureSize = clamp(Math.round(width * 0.46), 156, 196);

  const cashFlow = projectedCashFlow(player);
  const debt = Math.max(0, Math.round(player.debt));
  const hasDebt = debt > 0;

  // Pending-decisions tray data. Resolves each parked id to its event title
  // (intentionally no per-row countdown — urgency is signalled by the pill's
  // urgent treatment instead). Capped so the list never grows unbounded.
  const pendingItems = player.pendingDecisions
    .slice(0, PENDING_DECISIONS_CAP)
    .map((p) => {
      const event = ALL_EVENTS.find((e) => e.id === p.eventId);
      return event ? { eventId: p.eventId, title: event.title } : null;
    })
    .filter((x): x is { eventId: string; title: string } => x !== null);
  const pendingCount = pendingItems.length;
  // Urgent = at least one parked decision lapses this month or next. The pill
  // escalates its tint in this state; we deliberately don't introduce a new
  // ambient line for the nudge.
  const anyUrgent = player.pendingDecisions.some(
    (d) => d.expiryMonth - player.month <= 1,
  );

  // ↑/↓ vs last month's projection. Suppressed when there's no prior value
  // (fresh player, before any month advance) or the rounded delta is zero so
  // the user never sees an arrow that doesn't match a visible number change.
  const lastFlow = player.lastProjectedFlow;
  const cashFlowTrend: 'up' | 'down' | null = (() => {
    if (lastFlow === undefined) return null;
    const delta = Math.round(cashFlow) - Math.round(lastFlow);
    if (delta > 0) return 'up';
    if (delta < 0) return 'down';
    return null;
  })();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Drop the trailing phase segment when the pill is on screen — the
              path title below already names the phase, so this is the only
              redundant element and trimming it removes the collision at the
              source instead of padding around it. */}
          <Text style={styles.eyebrow} numberOfLines={1}>
            {pendingCount > 0
              ? `AGE ${player.age} · MONTH ${player.month}`
              : `AGE ${player.age} · MONTH ${player.month} · ${player.phase.toUpperCase()}`}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {path.title}
          </Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.strengthCol}>
            {LEFT_STRENGTHS.map((pip) => (
              <StrengthPipView
                key={pip.key}
                align="left"
                glyph={pip.glyph}
                label={pip.label}
                value={String(player[pip.key] as number)}
              />
            ))}
          </View>

          <View
            style={[
              styles.figureWrap,
              { width: figureSize, height: figureSize },
            ]}
          >
            <LifeFigure
              phase={player.phase}
              direction={direction}
              stress={figureStress}
              freedomRatio={figureFreedom}
              size={figureSize}
              celebrate={celebrate}
            />
          </View>

          <View style={styles.strengthCol}>
            {RIGHT_STRENGTHS.map((pip) => (
              <StrengthPipView
                key={pip.key}
                align="right"
                glyph={pip.glyph}
                label={pip.label}
                value={String(player[pip.key] as number)}
              />
            ))}
          </View>
        </View>

        <Text
          style={[
            styles.identityTitle,
            identity.muted && styles.identityTitleMuted,
          ]}
          numberOfLines={1}
        >
          {identity.label}
        </Text>

        <View style={styles.moneyRow}>
          <MoneyCell label="CASH" value={fmtMoney(player.cash)} />
          <MoneyCell
            label="CASH FLOW"
            value={fmtSigned(cashFlow)}
            valueColor={cashFlow >= 0 ? colors.emerald : colors.warmDebt}
            trend={cashFlowTrend}
            tappable
            onPress={() => setSheet('cashflow')}
          />
          {hasDebt && (
            <MoneyCell
              label="DEBT"
              value={fmtMoney(-debt)}
              valueColor={colors.warmDebt}
              tappable
              onPress={() => setSheet('debt')}
            />
          )}
        </View>

        <Stress level={player.stress} />

        <FreedomMeter value={freedomPct(player)} pulse={freedomPulse} />

        <View style={styles.spark}>
          <View style={styles.sparkHeader}>
            <Text style={styles.sparkEyebrow}>NET WORTH · TRACK</Text>
            <Text style={styles.sparkMuted}>
              {player.netWorthHistory.length} mo
            </Text>
          </View>
          <View style={styles.sparkArea}>
            <NetWorthChart history={player.netWorthHistory} compact />
          </View>
        </View>
      </ScrollView>

      {/* Next Month + Skip pinned to the bottom of the dashboard frame so the
          primary action is always reachable without scrolling. scrollContent's
          paddingBottom keeps the sparkline clear of this stack on short
          devices. */}
      <View style={styles.cta} pointerEvents="box-none">
        <PrimaryButton
          label={advanceDisabled ? 'Decision pending' : 'Next Month'}
          onPress={advanceDisabled ? () => {} : advanceMonth}
        />
        <SkipLink disabled={advanceDisabled} onPress={skipToNextDecision} />
      </View>

      {/* Pending-decisions pill. Absolute so it doesn't add header padding;
          only renders when the player has parked decisions. The header above
          has paddingRight reserved so its eyebrow text can't slide under it. */}
      {pendingCount > 0 ? (
        <PendingPill
          count={pendingCount}
          urgent={anyUrgent}
          onPress={() => setPendingOpen(true)}
        />
      ) : null}

      {/* Detail sheets sit above the scroll content but inside the dashboard
          frame. They render nothing when closed, and dismiss on backdrop tap
          or close button. */}
      <CashFlowDetail
        player={player}
        visible={sheet === 'cashflow'}
        onClose={() => setSheet(null)}
      />
      <DebtDetail
        player={player}
        visible={sheet === 'debt'}
        onClose={() => setSheet(null)}
      />

      <DetailSheet
        visible={pendingOpen}
        onClose={() => setPendingOpen(false)}
        eyebrow="PARKED"
        title="Pending decisions"
      >
        <View style={styles.pendingList}>
          {pendingItems.map((item) => (
            <Pressable
              key={item.eventId}
              onPress={() => {
                Haptics.selectionAsync();
                setPendingOpen(false);
                openPendingDecision(item.eventId);
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.pendingRow,
                pressed && styles.pendingRowPressed,
              ]}
            >
              <Text style={styles.pendingRowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.pendingRowChevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </DetailSheet>
    </View>
  );
}

// Small count badge in the top-right corner. Low emphasis — surface color +
// hairline border, no chrome — so it never competes with the path title. Sits
// above the scroll so it stays visible as the user scrolls. When `urgent` is
// set (at least one parked decision lapses this month or next) the pill
// escalates to a warm/gold tint to act as the nudge — no separate surface.
function PendingPill({
  count,
  urgent,
  onPress,
}: {
  count: number;
  urgent: boolean;
  onPress: () => void;
}) {
  // Glyph + label color tracks state so both update in lockstep; the badge
  // inverts on urgent for a strong color shift, not just a fill swap.
  const accentTone = urgent ? colors.accentBright : colors.accent;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.pendingPill,
        urgent && styles.pendingPillUrgent,
        pressed && styles.pendingPillPressed,
      ]}
      accessibilityLabel={
        urgent
          ? `${count} pending decision${count === 1 ? '' : 's'}, one lapses soon`
          : `${count} pending decision${count === 1 ? '' : 's'}`
      }
    >
      <StatGlyph name="clock" size={12} color={accentTone} />
      <Text
        style={[
          styles.pendingPillLabel,
          urgent && styles.pendingPillLabelUrgent,
        ]}
      >
        PARKED
      </Text>
      <View
        style={[
          styles.pendingPillCountWrap,
          urgent && styles.pendingPillCountWrapUrgent,
        ]}
      >
        <Text
          style={[
            styles.pendingPillCount,
            urgent && styles.pendingPillCountUrgent,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

// Subtle secondary control — present, but visually quiet so it never competes
// with the primary "Next Month" button (§10 — UX lever for the beat system).
function SkipLink({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync();
        onPress();
      }}
      hitSlop={10}
      style={styles.skipPress}
    >
      <Text style={[styles.skipText, disabled && styles.skipTextDisabled]}>
        Skip to next decision ›
      </Text>
    </Pressable>
  );
}

// Compact strength pip drawn alongside the hero. Icon + label sit on one
// row, value drops underneath in a pulse-aware text node so live changes
// still get the same subtle flash treatment as the money row.
function StrengthPipView({
  align,
  glyph,
  label,
  value,
}: {
  align: 'left' | 'right';
  glyph: StatGlyphName;
  label: string;
  value: string;
}) {
  const alignStyle = align === 'right' ? styles.pipRight : styles.pipLeft;
  return (
    <View style={[styles.strengthPip, alignStyle]}>
      <View
        style={[
          styles.strengthHead,
          align === 'right' && styles.strengthHeadRight,
        ]}
      >
        <StatGlyph name={glyph} size={14} color={colors.accent} />
        <Text style={styles.strengthLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <PulseValue style={styles.strengthValue}>{value}</PulseValue>
    </View>
  );
}

// Money row cell. Tappable cells get a faint chevron next to the label so the
// affordance reads without shouting. The cell itself becomes the press target
// only when `tappable` is set — CASH stays inert by design. Optional `trend`
// adds a small ↑/↓ glyph next to the value (used by CASH FLOW).
function MoneyCell({
  label,
  value,
  valueColor,
  trend,
  tappable,
  onPress,
}: {
  label: string;
  value: string;
  valueColor?: string;
  trend?: 'up' | 'down' | null;
  tappable?: boolean;
  onPress?: () => void;
}) {
  const trendColor = trend === 'up' ? colors.emerald : colors.warmDebt;
  const inner = (
    <View style={styles.moneyCell}>
      <View style={styles.moneyHead}>
        <Text style={styles.moneyLabel} numberOfLines={1}>
          {label}
        </Text>
        {tappable && <Text style={styles.moneyChevron}>›</Text>}
      </View>
      <View style={styles.moneyValueRow}>
        <PulseValue
          style={[
            styles.moneyValue,
            styles.moneyValueFlex,
            valueColor ? { color: valueColor } : null,
          ]}
        >
          {value}
        </PulseValue>
        {trend && (
          <Text style={[styles.moneyTrend, { color: trendColor }]}>
            {trend === 'up' ? '↑' : '↓'}
          </Text>
        )}
      </View>
    </View>
  );

  if (!tappable) return inner;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      hitSlop={6}
      style={({ pressed }) => [styles.moneyPress, pressed && { opacity: 0.6 }]}
    >
      {inner}
    </Pressable>
  );
}

// Subtle flash + scale bump whenever the displayed value string changes. The
// underlying Text shrinks-to-fit on one line so big numbers (e.g. seven-digit
// net worth) never wrap mid-figure.
function PulseValue({
  children,
  style,
}: {
  children: string;
  style: object | (object | null | undefined)[];
}) {
  const pulse = useSharedValue(0);
  const prev = useRef(children);

  useEffect(() => {
    if (prev.current !== children) {
      pulse.value = withSequence(
        withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 460, easing: Easing.out(Easing.quad) }),
      );
      prev.current = children;
    }
  }, [children, pulse]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 1 - pulse.value * 0.35,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  return (
    <Animated.Text
      style={[style, animStyle]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.55}
    >
      {children}
    </Animated.Text>
  );
}

const STRESS_LABEL = [
  'Calm',
  'Easy',
  'Light',
  'Moderate',
  'Heavy',
  'Critical',
] as const;

// Stress is 0–100 (§27). Map to 5 bars (each ≈ 20 pts) for the existing visual.
function Stress({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(100, level));
  const bars = Math.min(5, Math.round(clamped / 20));
  const labelIdx = Math.min(5, Math.floor(clamped / 17));
  return (
    <View style={styles.stressWrap}>
      <View style={styles.stressHeader}>
        <Text style={styles.stressLabel}>STRESS</Text>
        <Text style={styles.stressQual}>{STRESS_LABEL[labelIdx]}</Text>
      </View>
      <View style={styles.stressBars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stressBar,
              i < bars ? styles.stressBarOn : styles.stressBarOff,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    // Keep the sparkline clear of the bottom-pinned CTA stack (button +
    // skip-link + breathing room). If you change the CTA height, tune this
    // to match so short devices don't overlap.
    paddingBottom: 132,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 34,
    marginTop: spacing.xs,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  strengthCol: {
    flex: 1,
    justifyContent: 'space-between',
    // Match the figure's vertical extent so the three pips sit evenly along
    // its halo rather than clustering near one edge.
    alignSelf: 'stretch',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minWidth: 0,
  },
  figureWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTitle: {
    ...typography.eyebrow,
    color: colors.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    // Pull the line tight under the hero row so it reads as a caption on the
    // figure rather than a standalone block — scrollContent's gap would
    // otherwise space it like a separate section.
    marginTop: -spacing.sm,
  },
  identityTitleMuted: {
    opacity: 0.55,
  },
  strengthPip: {
    gap: 2,
    minWidth: 0,
  },
  pipLeft: {
    alignItems: 'flex-start',
  },
  pipRight: {
    alignItems: 'flex-end',
  },
  strengthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  strengthHeadRight: {
    flexDirection: 'row-reverse',
  },
  strengthLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 9,
    letterSpacing: 1.3,
  },
  strengthValue: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 17,
  },
  moneyRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  moneyPress: {
    flex: 1,
    minWidth: 0,
  },
  moneyCell: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  moneyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moneyLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  moneyChevron: {
    color: colors.textFaint,
    fontSize: 13,
    lineHeight: 13,
    marginTop: 1,
  },
  moneyValue: {
    ...typography.stat,
    color: colors.textPrimary,
    fontSize: 22,
  },
  moneyValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 0,
  },
  moneyValueFlex: {
    flex: 1,
    minWidth: 0,
  },
  moneyTrend: {
    fontSize: 14,
    lineHeight: 16,
    fontWeight: '600',
  },
  stressWrap: {
    gap: spacing.sm,
  },
  stressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stressLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  stressQual: {
    ...typography.label,
    color: colors.pressure,
    fontSize: 12,
  },
  stressBars: {
    flexDirection: 'row',
    gap: 6,
  },
  stressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stressBarOn: {
    backgroundColor: colors.pressure,
  },
  stressBarOff: {
    backgroundColor: colors.borderSoft,
  },
  spark: {
    gap: spacing.xs,
  },
  sparkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sparkEyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  sparkMuted: {
    ...typography.caption,
    color: colors.textFaint,
    letterSpacing: 1.2,
    fontSize: 10,
  },
  sparkArea: {
    height: 48,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  skipPress: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.4,
  },
  skipTextDisabled: {
    color: colors.textFaint,
  },
  // Calm but legible: dark surface tile with a 1px accent border, gold glyph
  // and label, and a count badge filled with low-alpha accent so the number
  // reads as a chip-within-a-chip. Stays clearly secondary to the gold
  // "Next Month" CTA — no solid-gold fill on the chip body.
  pendingPill: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingLeft: 9,
    paddingRight: 6,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'rgba(20, 23, 28, 0.72)',
  },
  // Urgent = at least one parked decision lapses this month or next. Flips
  // to a soft-accent fill + brighter border so it reads as escalation, not a
  // new surface. Count badge fully inverts below for the strongest contrast.
  pendingPillUrgent: {
    borderColor: colors.accentBright,
    backgroundColor: colors.accentSoft,
  },
  pendingPillPressed: {
    opacity: 0.6,
  },
  pendingPillLabel: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
  },
  pendingPillLabelUrgent: {
    color: colors.accentBright,
  },
  // Filled badge — accentSoft tile with gold numeric so the count reads at a
  // glance without flipping the whole chip to gold.
  pendingPillCountWrap: {
    minWidth: 18,
    paddingHorizontal: 5,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Urgent inverts: solid bright-accent fill with dark text — the visual
  // payoff that distinguishes urgent from the calm non-urgent state now that
  // non-urgent itself reads more present than before.
  pendingPillCountWrapUrgent: {
    backgroundColor: colors.accentBright,
  },
  pendingPillCount: {
    ...typography.statSmall,
    color: colors.accent,
    fontSize: 12,
    lineHeight: 13,
    fontWeight: '700',
  },
  pendingPillCountUrgent: {
    color: colors.bg,
  },
  pendingList: {
    gap: spacing.xs,
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(20, 23, 28, 0.4)',
  },
  pendingRowPressed: {
    opacity: 0.6,
  },
  pendingRowTitle: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    flexShrink: 1,
  },
  pendingRowChevron: {
    color: colors.textFaint,
    fontSize: 18,
    lineHeight: 18,
  },
});
