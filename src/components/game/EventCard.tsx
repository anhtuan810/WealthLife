import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../../theme';
import type { GameEvent } from '../../types/events';
import { ChoiceButton } from './ChoiceButton';

type Props = {
  event: GameEvent;
  onChoose: (choiceId: string) => void;
};

// Full-screen decision overlay. Mounted at HomeScreen level so the backdrop
// covers everything (including AmbientGlow and the dashboard header padding).
// MVP: deterministic event.fallbackText only — AI narrative is FUTURE (§19).
export function EventCard({ event, onChoose }: Props) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = 0;
    v.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
  }, [event.id, v]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: v.value * 0.88,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 28 }],
  }));

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="auto" />

      <View style={styles.cardWrap}>
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={[colors.surfaceElev, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardBody}>
            <Text style={styles.eyebrow}>DECISION</Text>
            <Text style={styles.title}>{event.title}</Text>
            {event.fallbackText ? (
              <Text style={styles.body}>{event.fallbackText}</Text>
            ) : null}

            <View style={styles.choices}>
              {event.choices.map((c) => (
                <ChoiceButton
                  key={c.id}
                  label={c.label}
                  onPress={() => onChoose(c.id)}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 5, 8, 0.78)',
  },
  cardWrap: {
    paddingHorizontal: spacing.xl,
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  cardBody: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 26,
    lineHeight: 30,
    marginTop: -spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
  },
  choices: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
});
