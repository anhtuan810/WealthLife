import React, { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';
import type { StartPointId } from '../data/startPoints';
import { resolveOpening, type Profile } from '../personalization';

type Props = {
  startPointId: StartPointId;
  profile: Profile | undefined;
  onContinue: () => void;
};

// Personalized opening moment — runs after onboarding + start-point selection,
// before the first beat. Three lines, framework §2 order: PLACE → DESIRE
// → QUESTION. All slot-filled. Single "Begin" CTA hands off to the dashboard.
export function OpeningMomentScreen({ startPointId, profile, onContinue }: Props) {
  const opening = useMemo(
    () => resolveOpening(startPointId, profile),
    [startPointId, profile],
  );

  // Staggered reveal so each beat lands separately — reads cinematic, not
  // a wall of text. Three values share the same easing/duration; only the
  // delay shifts.
  const place = useSharedValue(0);
  const desire = useSharedValue(0);
  const question = useSharedValue(0);
  const cta = useSharedValue(0);

  useEffect(() => {
    const cfg = { duration: 720, easing: Easing.out(Easing.cubic) };
    place.value = withDelay(120, withTiming(1, cfg));
    desire.value = withDelay(640, withTiming(1, cfg));
    question.value = withDelay(1240, withTiming(1, cfg));
    cta.value = withDelay(1760, withTiming(1, cfg));
  }, [place, desire, question, cta]);

  const placeStyle = useAnimatedStyle(() => ({
    opacity: place.value,
    transform: [{ translateY: (1 - place.value) * 14 }],
  }));
  const desireStyle = useAnimatedStyle(() => ({
    opacity: desire.value,
    transform: [{ translateY: (1 - desire.value) * 14 }],
  }));
  const questionStyle = useAnimatedStyle(() => ({
    opacity: question.value,
    transform: [{ translateY: (1 - question.value) * 14 }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({
    opacity: cta.value,
    transform: [{ translateY: (1 - cta.value) * 14 }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bg, colors.bgElev]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={placeStyle}>
          <Text style={styles.eyebrow}>THE OPENING</Text>
          <Text style={styles.place}>{opening.place}</Text>
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View style={desireStyle}>
          <Text style={styles.desire}>{opening.desire}</Text>
        </Animated.View>

        <View style={styles.divider} />

        <Animated.View style={questionStyle}>
          <Text style={styles.question}>{opening.question}</Text>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.cta, ctaStyle]}>
        <PrimaryButton label="Begin" onPress={onContinue} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 120,
    paddingHorizontal: spacing.xl,
    paddingBottom: 140,
    gap: spacing.xl,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  place: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSoft,
    width: 48,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  desire: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: -0.1,
  },
  question: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  cta: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
  },
});
