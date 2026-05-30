import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../theme';
import type { StartPointDirection } from '../data/startPoints';

type Props = {
  direction: StartPointDirection;
  title: string;
  blurb: string;
  selected: boolean;
  onSelect: () => void;
};

// Sub-pick after a non-university start point — commits the player's
// direction (corporate / founder / freelancer) before the run begins.
// Visual language deliberately matches StartPointCard so it reads as the
// same picker surface, just narrower scope.
export function DirectionCard({
  title,
  blurb,
  selected,
  onSelect,
}: Props) {
  const sel = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    sel.value = withTiming(selected ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [selected, sel]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + sel.value * 0.015 - press.value * 0.01 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: sel.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: sel.value * 0.55 }));

  return (
    <Pressable
      onPressIn={() => {
        press.value = withTiming(1, { duration: 90 });
        Haptics.selectionAsync();
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 180 });
      }}
      onPress={onSelect}
    >
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
      <Animated.View style={[styles.wrap, wrapStyle]}>
        <LinearGradient
          colors={[colors.surfaceElev, colors.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.body}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.vibe}>{blurb}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.xs,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  vibe: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  glow: {
    position: 'absolute',
    top: 6,
    left: 10,
    right: 10,
    bottom: -6,
    borderRadius: radii.lg,
    backgroundColor: colors.accentGlow,
  },
});
