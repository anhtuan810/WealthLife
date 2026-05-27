import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { HeroBackdrop } from '../visual/HeroBackdrop';
import type { Phase } from '../../game/player';
import { colors, motion, spacing, typography } from '../../theme';

type Props = {
  phase: Phase;
  onDismiss: () => void;
};

const PHASE_COPY: Partial<Record<Phase, { eyebrow: string; title: string }>> = {
  career: {
    eyebrow: 'A NEW CHAPTER',
    title: 'Career begins.',
  },
};

// Full-bleed acknowledgement beat: shown the first time a phase boundary is
// crossed. Renders the phase's hero art, a title in the top scrim, and a
// single tap-anywhere dismiss. No game state mutates from inside — the parent
// drives the loop resume via onDismiss.
export function PhaseTransitionOverlay({ phase, onDismiss }: Props) {
  const copy = PHASE_COPY[phase];
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      40,
      withTiming(1, {
        duration: motion.slow,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [enter]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 14 }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: enter.value * 0.7,
  }));

  if (!copy) return null;

  return (
    <Pressable
      style={StyleSheet.absoluteFill}
      onPress={() => {
        Haptics.selectionAsync();
        onDismiss();
      }}
    >
      <HeroBackdrop assetKey={`phase_${phase}`} />

      <View pointerEvents="none" style={styles.titleWrap}>
        <Animated.View style={titleStyle}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
        </Animated.View>
      </View>

      <Animated.View pointerEvents="none" style={[styles.hint, hintStyle]}>
        <Text style={styles.hintLabel}>TAP TO CONTINUE</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  titleWrap: {
    position: 'absolute',
    top: 96,
    left: spacing.xl,
    right: spacing.xl,
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  hint: {
    position: 'absolute',
    bottom: 56,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 2.6,
  },
});
