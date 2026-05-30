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
import type { FoundationPath, FoundationPathId } from '../data/foundationPaths';
import { StatGlyph, type StatGlyphName } from './visual/StatGlyph';

type Props = {
  path: FoundationPath;
  selected: boolean;
  onSelect: () => void;
};

// One thematic glyph per foundation path — same Skia icon set the
// start-point picker uses, so the two surfaces feel of a piece.
const GLYPH_FOR_PATH: Record<FoundationPathId, StatGlyphName> = {
  university: 'book',
  vocational: 'wrench',
  self_taught: 'compass',
  straight_to_work: 'briefcase',
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
          <View style={styles.avatar}>
            <StatGlyph
              name={GLYPH_FOR_PATH[path.id]}
              size={32}
              color={colors.accent}
            />
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{path.title}</Text>
            <Text style={styles.vibe}>{path.subtitle}</Text>
            {/* Tags collapsed into a single muted line — same visual weight
                as the StartPointCard's runwayHint caption. Keeps three
                tradeoff signals in view without the chip row's
                vertical/wrap cost. */}
            <Text style={styles.tagLine}>{path.tags.join('  ·  ')}</Text>
          </View>
        </View>
      </Animated.View>
      {/* Sibling of wrap (not a child) so the ring's stroke isn't clipped by
          wrap's overflow: 'hidden'. Renders after wrap → draws on top of its
          1px gray border, replacing it with the gold accent when selected. */}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  // Soft accent-tinted disc behind the glyph — matches StartPointCard.
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    ...typography.title,
    color: colors.textPrimary,
    fontSize: 19,
  },
  vibe: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 2,
  },
  tagLine: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1.2,
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
