import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { colors, radii, spacing, typography } from '../theme';
import { FOUNDATION_PATH_BY_ID } from '../data/foundationPaths';
import { freedomPct, netWorth, type Player } from '../game/player';
import { useGameStore } from '../state/gameStore';

const fmtMoney = (n: number) => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

export function DashboardLayer() {
  const player = useGameStore((s) => s.player);
  const freedomPulse = useGameStore((s) => s.freedomPulse);
  const advanceMonth = useGameStore((s) => s.advanceMonth);
  const skipToNextDecision = useGameStore((s) => s.skipToNextDecision);
  const currentEvent = useGameStore((s) => s.currentEvent);

  if (!player) return null;

  const path = FOUNDATION_PATH_BY_ID[player.foundationPath];
  const advanceDisabled = !!currentEvent;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          AGE {player.age} · MONTH {player.month} · {player.phase.toUpperCase()}
        </Text>
        <Text style={styles.title}>{path.title}</Text>
      </View>

      <View style={styles.statRow}>
        <Stat label="CASH" value={fmtMoney(player.cash)} />
        <View style={styles.statDivider} />
        <Stat label="NET WORTH" value={fmtMoney(netWorth(player))} />
      </View>

      <Stress level={player.stress} />

      <FreedomMeter value={freedomPct(player)} pulse={freedomPulse} />

      <Strengths player={player} />

      <View style={styles.chart}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartEyebrow}>NET WORTH · TRACK</Text>
          <Text style={styles.chartMuted}>{player.netWorthHistory.length} mo</Text>
        </View>
        <View style={styles.chartArea}>
          <NetWorthChart history={player.netWorthHistory} />
        </View>
      </View>

      <View style={styles.cta}>
        <PrimaryButton
          label={advanceDisabled ? 'Decision pending' : 'Next Month'}
          onPress={advanceDisabled ? () => {} : advanceMonth}
        />
        <SkipLink disabled={advanceDisabled} onPress={skipToNextDecision} />
      </View>
    </View>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <PulseValue style={styles.statValue}>{value}</PulseValue>
    </View>
  );
}

// Subtle flash + scale bump whenever the displayed value string changes.
function PulseValue({
  children,
  style,
}: {
  children: string;
  style: object;
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

  return <Animated.Text style={[style, animStyle]}>{children}</Animated.Text>;
}

const STRESS_LABEL = ['Calm', 'Easy', 'Light', 'Moderate', 'Heavy', 'Critical'] as const;

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

// Compact strengths grid — the §9 profile starting to form. Subtle, not a spreadsheet.
const STRENGTH_FIELDS: ReadonlyArray<{ key: keyof Player; label: string }> = [
  { key: 'skill', label: 'SKILL' },
  { key: 'network', label: 'NETWORK' },
  { key: 'reputation', label: 'REP' },
  { key: 'discipline', label: 'DISCIPLINE' },
  { key: 'riskTolerance', label: 'RISK' },
  { key: 'ambition', label: 'AMBITION' },
];

function Strengths({ player }: { player: Player }) {
  return (
    <View style={styles.strengthsWrap}>
      <Text style={styles.strengthsHeader}>STRENGTH PROFILE</Text>
      <View style={styles.strengthsGrid}>
        {STRENGTH_FIELDS.map(({ key, label }) => (
          <View key={key} style={styles.strengthCell}>
            <Text style={styles.strengthLabel}>{label}</Text>
            <PulseValue style={styles.strengthValue}>
              {String(player[key] as number)}
            </PulseValue>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: spacing.xl,
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
  statRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  statBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  statValue: {
    ...typography.stat,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: spacing.xs,
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
  strengthsWrap: {
    gap: spacing.sm,
  },
  strengthsHeader: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  strengthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  strengthCell: {
    width: '33.333%',
    paddingVertical: 2,
    gap: 2,
  },
  strengthLabel: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  strengthValue: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 16,
  },
  chart: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
    height: 130,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartEyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  chartMuted: {
    ...typography.caption,
    color: colors.textFaint,
    letterSpacing: 1.2,
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
  },
  cta: {
    marginTop: 'auto',
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
});
