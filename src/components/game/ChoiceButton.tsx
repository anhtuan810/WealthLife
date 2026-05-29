import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, radii, spacing, typography } from '../../theme';
import { StatGlyph, type StatGlyphName } from '../visual/StatGlyph';

type Props = {
  label: string;
  onPress: () => void;
  // When true, the button gets a gold "Your leaning" badge + a softly tinted
  // border to surface that this option lines up with the player's past
  // direction signal. Doesn't change behavior — the player can still pick
  // any other option.
  aligned?: boolean;
  // Leading procedural icon representing the choice's dominant stat effect.
  icon?: StatGlyphName | null;
  // Category-derived accent applied to the icon and trailing chevron so the
  // whole card reads as one event; the per-choice signal is in the icon shape.
  accent?: string;
};

// Secondary-style decision button — quieter than PrimaryButton so the event
// itself remains the focus. Stacks 2–4 per EventCard.
export function ChoiceButton({ label, onPress, aligned, icon, accent }: Props) {
  const press = useSharedValue(0);
  const tint = accent ?? colors.accent;

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.012 }],
    opacity: 1 - press.value * 0.18,
  }));

  return (
    <Pressable
      onPressIn={() => {
        press.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        press.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
      }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <Animated.View style={[styles.wrap, aligned && styles.wrapAligned, wrapStyle]}>
        <View style={styles.body}>
          {icon ? (
            <View style={styles.iconSlot}>
              <StatGlyph name={icon} size={18} color={tint} />
            </View>
          ) : null}
          <View style={styles.labelCol}>
            <Text style={styles.label}>{label}</Text>
            {aligned && (
              <Text style={styles.alignedHint}>YOUR LEANING</Text>
            )}
          </View>
          <Text style={[styles.chev, { color: tint }]}>›</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElev,
  },
  wrapAligned: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  iconSlot: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelCol: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  alignedHint: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  chev: {
    ...typography.title,
    color: colors.accent,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -2,
  },
});
