import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../theme';

type Props = {
  value: number; // 0–100. Source of truth for BOTH bar width and % label.
  pulse?: number; // increment to trigger a one-shot visual pulse without changing value
};

export function FreedomMeter({ value, pulse: pulseSignal }: Props) {
  const clamped = Math.max(0, Math.min(100, value));

  const progress = useSharedValue(0);
  const breath = useSharedValue(0);
  const spike = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breath]);

  useEffect(() => {
    if (pulseSignal === undefined || pulseSignal === 0) return;
    spike.value = withSequence(
      withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 520, easing: Easing.out(Easing.quad) }),
    );
  }, [pulseSignal, spike]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    transform: [{ scaleY: 1 + spike.value * 0.22 }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    opacity: 0.55 + breath.value * 0.35 + spike.value * 0.4,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + breath.value * 0.15,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>FINANCIAL FREEDOM</Text>
        <Animated.Text style={[styles.percent, labelStyle]}>
          {Math.round(clamped)}%
        </Animated.Text>
      </View>

      <View style={styles.barShell}>
        <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none">
          <LinearGradient
            colors={[colors.emeraldGlow, 'rgba(91, 224, 160, 0.05)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View style={styles.track} />

        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={[colors.emeraldDeep, colors.emerald, colors.emeraldBright]}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.fillHighlight} />
        </Animated.View>
      </View>

      <Text style={styles.footnote}>The slow climb to your runway.</Text>
    </View>
  );
}

const BAR_HEIGHT = 14;

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  percent: {
    ...typography.statSmall,
    color: colors.emeraldBright,
    fontSize: 22,
    letterSpacing: -0.6,
  },
  barShell: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    left: -6,
    height: BAR_HEIGHT + 18,
    top: -9,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  track: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  fill: {
    height: BAR_HEIGHT,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  fillHighlight: {
    position: 'absolute',
    top: 1,
    left: 6,
    right: 6,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  footnote: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
});
