import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AmbientGlow } from '../components/AmbientGlow';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export function HomeScreen() {
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      80,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 14 }],
  }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 22 }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <AmbientGlow />

      <View style={styles.frame}>
        <Animated.View style={[styles.heroBlock, heroStyle]}>
          <Text style={styles.eyebrow}>WEALTHLIFE</Text>
          <Text style={styles.hero}>Build your{'\n'}freedom.</Text>
          <Text style={styles.sub}>
            A strategic wealth journey — escape the rat race, one decision at a time.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaBlock, ctaStyle]}>
          <PrimaryButton label="Begin" />
          <Text style={styles.footnote}>Dev build · v0.1</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  frame: {
    flex: 1,
    paddingTop: 96,
    paddingBottom: 56,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  heroBlock: {
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  hero: {
    ...typography.hero,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  sub: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 320,
  },
  ctaBlock: {
    gap: spacing.lg,
    alignItems: 'stretch',
  },
  footnote: {
    ...typography.caption,
    color: colors.textFaint,
    textAlign: 'center',
    letterSpacing: 2.4,
  },
});
