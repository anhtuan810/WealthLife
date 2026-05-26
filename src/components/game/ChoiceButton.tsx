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

type Props = {
  label: string;
  onPress: () => void;
};

// Secondary-style decision button — quieter than PrimaryButton so the event
// itself remains the focus. Stacks 2–4 per EventCard.
export function ChoiceButton({ label, onPress }: Props) {
  const press = useSharedValue(0);

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
      <Animated.View style={[styles.wrap, wrapStyle]}>
        <View style={styles.body}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.chev}>›</Text>
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
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  chev: {
    ...typography.title,
    color: colors.accent,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -2,
  },
});
