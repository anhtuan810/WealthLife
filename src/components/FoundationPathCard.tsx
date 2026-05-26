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
import type { FoundationPath } from '../data/foundationPaths';

type Props = {
  path: FoundationPath;
  selected: boolean;
  onSelect: () => void;
};

// Premium dark surface card for the §7 foundation-path picker.
// Frames a starting CONTEXT, never a class.
export function FoundationPathCard({ path, selected, onSelect }: Props) {
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
          <Text style={styles.name}>{path.title}</Text>
          <Text style={styles.vibe}>{path.subtitle}</Text>
          <View style={styles.tagRow}>
            {path.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>
        <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      </Animated.View>
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
    gap: spacing.sm,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
  },
  vibe: {
    ...typography.body,
    color: colors.textSecondary,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(245, 242, 234, 0.04)',
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1,
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
