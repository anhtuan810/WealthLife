import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../../theme';
import { PENDING_DECISIONS_CAP } from '../../data/constants';
import type { LifeDirection } from '../../game/player';
import type { GameEvent } from '../../types/events';
import { effectiveDeferWindow } from '../../types/events';
import { resolveEventText, type Profile } from '../../personalization';
import { ArtSlot, CATEGORY_TINT } from '../visual/ArtSlot';
import { ChoiceButton } from './ChoiceButton';
import { glyphForEffects } from './choiceIcon';

type Props = {
  event: GameEvent;
  onChoose: (choiceId: string) => void;
  // Park the decision without applying effects. Only invoked when the event's
  // effective defer window is > 0. Absent → "Decide later" is hidden.
  onDefer?: (eventId: string) => void;
  // Number of decisions already parked. When at the cap, "Decide later" is
  // replaced with a subdued note so the absence reads as intentional.
  pendingCount?: number;
  // Soft direction signal from accumulated leaning_* flags. When a choice's
  // setsDirection matches this, the card highlights it as "your leaning" —
  // context only, the player can still pick anything.
  leaning?: LifeDirection;
  // Personalization profile (spec §2). PURE TEXT — fed into resolveEventText
  // for {slot} substitution in title / fallbackText / choice.label. Undefined
  // → render the neutral default for every slot. Either way the engine still
  // reads the raw event, so identity of the run is unaffected.
  profile?: Profile;
};

// Full-screen decision overlay. Mounted at HomeScreen level so the backdrop
// covers everything (including AmbientGlow and the dashboard header padding).
// MVP: deterministic event.fallbackText only — AI narrative is FUTURE (§19).
export function EventCard({
  event,
  onChoose,
  onDefer,
  pendingCount = 0,
  leaning,
  profile,
}: Props) {
  // pack is undefined in this slice — v2 narrative override drops in here
  // without touching the engine or this call site.
  const rendered = resolveEventText(event, profile, undefined);
  const isDeferrable = effectiveDeferWindow(event) > 0 && !!onDefer;
  const atCap = pendingCount >= PENDING_DECISIONS_CAP;
  const canDefer = isDeferrable && !atCap;
  // Show the "already parked" note only when the event WOULD be deferrable —
  // otherwise we'd render an explanation for an affordance that was never on
  // offer for this decision.
  const showAtCapNote = isDeferrable && atCap;
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

  const categoryAccent = CATEGORY_TINT[event.category];

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
            <ArtSlot assetKey={event.art} category={event.category} aspect={3 / 2} />
            <Text style={[styles.eyebrow, { color: categoryAccent }]}>DECISION</Text>
            <Text style={styles.title}>{rendered.title}</Text>
            {rendered.fallbackText ? (
              <ScrollView
                style={styles.bodyScroll}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.body}>{rendered.fallbackText}</Text>
              </ScrollView>
            ) : null}

            <View style={styles.choices}>
              {event.choices.map((c, i) => (
                <ChoiceButton
                  key={c.id}
                  label={rendered.choices[i].label}
                  onPress={() => onChoose(c.id)}
                  aligned={
                    !!leaning && c.setsDirection === leaning
                  }
                  icon={glyphForEffects(c.effects)}
                  accent={categoryAccent}
                />
              ))}
            </View>

            {canDefer ? (
              <Pressable
                onPress={() => onDefer?.(event.id)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deferButton,
                  pressed && styles.deferButtonPressed,
                ]}
              >
                <Text style={styles.deferLabel}>Decide later</Text>
              </Pressable>
            ) : showAtCapNote ? (
              <Text style={styles.deferNote}>
                {PENDING_DECISIONS_CAP} decisions already parked
              </Text>
            ) : null}
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
    maxHeight: '90%',
  },
  card: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    flexShrink: 1,
  },
  cardBody: {
    padding: spacing.xl,
    gap: spacing.lg,
    flexShrink: 1,
  },
  bodyScroll: {
    flexShrink: 1,
    minHeight: 0,
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
  deferButton: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  deferButtonPressed: {
    opacity: 0.5,
  },
  deferLabel: {
    ...typography.body,
    color: colors.textSecondary,
    opacity: 0.7,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  // Plain text — NOT a button. Mirrors deferLabel's subdued-but-readable
  // treatment (textSecondary + opacity, NOT textFaint, which is unreadable).
  // Centered so it visually replaces the "Decide later" button rather than
  // mimicking its press shape.
  deferNote: {
    ...typography.body,
    color: colors.textSecondary,
    opacity: 0.7,
    fontSize: 13,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },
});
