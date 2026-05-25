import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { ARCHETYPES } from '../game/archetypes';
import { freedomPct, netWorth } from '../game/player';
import { useGameStore } from '../state/gameStore';

const fmtMoney = (n: number) => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

export function DashboardLayer() {
  const player = useGameStore((s) => s.player);
  const freedomPulse = useGameStore((s) => s.freedomPulse);
  const nextMonth = useGameStore((s) => s.nextMonth);

  if (!player) return null;

  const archetype = ARCHETYPES.find((a) => a.id === player.archetypeId);
  if (!archetype) return null;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          AGE {player.age} · MONTH {player.month}
        </Text>
        <Text style={styles.title}>{archetype.name}</Text>
      </View>

      <View style={styles.statRow}>
        <Stat label="CASH" value={fmtMoney(player.cash)} />
        <View style={styles.statDivider} />
        <Stat label="NET WORTH" value={fmtMoney(netWorth(player))} />
      </View>

      <Stress level={player.stress} />

      <FreedomMeter value={freedomPct(player)} pulse={freedomPulse} />

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
        <PrimaryButton label="Next Month" onPress={nextMonth} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <PulseValue>{value}</PulseValue>
    </View>
  );
}

// Subtle flash + scale bump whenever the displayed value string changes.
function PulseValue({ children }: { children: string }) {
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
    <Animated.Text style={[styles.statValue, animStyle]}>{children}</Animated.Text>
  );
}

const STRESS_LABEL = ['Calm', 'Easy', 'Light', 'Moderate', 'Heavy', 'Critical'] as const;

function Stress({ level }: { level: number }) {
  const clamped = Math.max(0, Math.min(5, level));
  return (
    <View style={styles.stressWrap}>
      <View style={styles.stressHeader}>
        <Text style={styles.stressLabel}>STRESS</Text>
        <Text style={styles.stressQual}>{STRESS_LABEL[clamped]}</Text>
      </View>
      <View style={styles.stressBars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.stressBar,
              i < clamped ? styles.stressBarOn : styles.stressBarOff,
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
  },
});
