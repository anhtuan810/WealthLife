import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AmbientGlow } from '../components/AmbientGlow';
import { PrimaryButton } from '../components/PrimaryButton';
import { ArchetypeCard } from '../components/ArchetypeCard';
import { DashboardLayer } from './DashboardLayer';
import { ARCHETYPES } from '../game/archetypes';
import { useGameStore } from '../state/gameStore';
import { colors, spacing, typography } from '../theme';

type Stage = 'title' | 'archetypes' | 'dashboard';
const STAGE_INDEX: Record<Stage, number> = { title: 0, archetypes: 1, dashboard: 2 };

export function HomeScreen() {
  const [stage, setStage] = useState<Stage>('title');
  const selectedId = useGameStore((s) => s.selectedId);
  const player = useGameStore((s) => s.player);
  const selectArchetype = useGameStore((s) => s.selectArchetype);
  const startGame = useGameStore((s) => s.startGame);

  const enter = useSharedValue(0);
  const stageV = useSharedValue(0);
  const continueV = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      80,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter]);

  useEffect(() => {
    stageV.value = withTiming(STAGE_INDEX[stage], {
      duration: 480,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [stage, stageV]);

  useEffect(() => {
    continueV.value = withTiming(selectedId ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedId, continueV]);

  const titleLayerStyle = useAnimatedStyle(() => ({
    opacity:
      enter.value *
      interpolate(stageV.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY:
          (1 - enter.value) * 14 +
          interpolate(stageV.value, [0, 1], [0, -18], Extrapolation.CLAMP),
      },
    ],
  }));

  const titleCtaStyle = useAnimatedStyle(() => ({
    opacity:
      enter.value *
      interpolate(stageV.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY:
          (1 - enter.value) * 22 +
          interpolate(stageV.value, [0, 1], [0, -18], Extrapolation.CLAMP),
      },
    ],
  }));

  const archLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stageV.value, [0, 1, 2], [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          stageV.value,
          [0, 1, 2],
          [22, 0, -18],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueV.value,
    transform: [{ translateY: (1 - continueV.value) * 14 }],
  }));

  const dashLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stageV.value, [1, 2], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          stageV.value,
          [1, 2],
          [22, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleContinue = () => {
    startGame();
    setStage('dashboard');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <AmbientGlow />

      <View style={styles.frame}>
        {/* Title layer */}
        <Animated.View
          style={[styles.layer, styles.titleLayer]}
          pointerEvents={stage === 'title' ? 'auto' : 'none'}
        >
          <Animated.View style={[styles.heroBlock, titleLayerStyle]}>
            <Text style={styles.eyebrow}>WEALTHLIFE</Text>
            <Text style={styles.hero}>Build your{'\n'}freedom.</Text>
            <Text style={styles.sub}>
              A strategic wealth journey — escape the rat race, one decision at a time.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.ctaBlock, titleCtaStyle]}>
            <PrimaryButton label="Begin" onPress={() => setStage('archetypes')} />
            <Text style={styles.footnote}>Dev build · v0.1</Text>
          </Animated.View>
        </Animated.View>

        {/* Archetype selection layer */}
        <Animated.View
          style={[styles.layer, styles.archLayer, archLayerStyle]}
          pointerEvents={stage === 'archetypes' ? 'auto' : 'none'}
        >
          <View style={styles.archHeader}>
            <Text style={styles.eyebrow}>CHOOSE YOUR PATH</Text>
            <Text style={styles.archTitle}>Who are you,{'\n'}today?</Text>
          </View>

          <View style={styles.cardStack}>
            {ARCHETYPES.map((a) => (
              <ArchetypeCard
                key={a.id}
                archetype={a}
                selected={selectedId === a.id}
                onSelect={() => selectArchetype(a.id)}
              />
            ))}
          </View>

          <Animated.View
            style={[styles.continueWrap, continueStyle]}
            pointerEvents={selectedId ? 'auto' : 'none'}
          >
            <PrimaryButton label="Continue" onPress={handleContinue} />
          </Animated.View>
        </Animated.View>

        {/* Dashboard layer */}
        <Animated.View
          style={[styles.layer, styles.dashLayer, dashLayerStyle]}
          pointerEvents={stage === 'dashboard' ? 'auto' : 'none'}
        >
          {player && <DashboardLayer />}
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
  },
  layer: {
    ...StyleSheet.absoluteFill,
    paddingTop: 96,
    paddingBottom: 56,
    paddingHorizontal: spacing.xl,
  },
  titleLayer: {
    justifyContent: 'space-between',
  },
  archLayer: {
    justifyContent: 'flex-start',
    gap: spacing.xl,
  },
  dashLayer: {
    paddingTop: 72,
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
  archHeader: {
    gap: spacing.md,
  },
  archTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  cardStack: {
    gap: spacing.md,
  },
  continueWrap: {
    marginTop: 'auto',
  },
});
