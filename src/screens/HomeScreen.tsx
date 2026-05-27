import React, { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
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
import { HeroBackdrop } from '../components/visual/HeroBackdrop';
import { PrimaryButton } from '../components/PrimaryButton';
import { FoundationPathCard } from '../components/FoundationPathCard';
import { EventCard } from '../components/game/EventCard';
import { PhaseTransitionOverlay } from '../components/game/PhaseTransitionOverlay';
import { DashboardLayer } from './DashboardLayer';
import { RunSummaryScreen } from './RunSummaryScreen';
import { DevMenu } from '../dev/DevMenu';
import { FOUNDATION_PATHS } from '../data/foundationPaths';
import { useGameStore } from '../state/gameStore';
import { colors, spacing, typography } from '../theme';

type Stage = 'title' | 'paths' | 'dashboard';
const STAGE_INDEX: Record<Stage, number> = { title: 0, paths: 1, dashboard: 2 };

export function HomeScreen() {
  const [stage, setStage] = useState<Stage>('title');
  const selectedPath = useGameStore((s) => s.selectedPath);
  const player = useGameStore((s) => s.player);
  const selectFoundationPath = useGameStore((s) => s.selectFoundationPath);
  const startGame = useGameStore((s) => s.startGame);
  const currentEvent = useGameStore((s) => s.currentEvent);
  const chooseOption = useGameStore((s) => s.chooseOption);
  const gameOver = useGameStore((s) => s.gameOver);
  const phaseTransition = useGameStore((s) => s.phaseTransition);
  const dismissPhaseTransition = useGameStore((s) => s.dismissPhaseTransition);

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
    continueV.value = withTiming(selectedPath ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedPath, continueV]);

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

  const pathsLayerStyle = useAnimatedStyle(() => ({
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
      <HeroBackdrop assetKey="start_hero" visible={stage === 'title'} />

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
            <PrimaryButton label="Begin" onPress={() => setStage('paths')} />
            <Text style={styles.footnote}>Dev build · v0.1</Text>
          </Animated.View>
        </Animated.View>

        {/* Foundation path selection layer */}
        <Animated.View
          style={[styles.layer, styles.pathsLayer, pathsLayerStyle]}
          pointerEvents={stage === 'paths' ? 'auto' : 'none'}
        >
          <View style={styles.pathsHeader}>
            <Text style={styles.eyebrow}>AGE 18 · CHOOSE YOUR FOUNDATION</Text>
            <Text style={styles.pathsTitle}>How you{'\n'}start.</Text>
            <Text style={styles.pathsLede}>
              Not who you become. Just where you stand the day you become an adult.
            </Text>
          </View>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardStack}
            showsVerticalScrollIndicator={false}
          >
            {FOUNDATION_PATHS.map((p) => (
              <FoundationPathCard
                key={p.id}
                path={p}
                selected={selectedPath === p.id}
                onSelect={() => selectFoundationPath(p.id)}
              />
            ))}
          </ScrollView>

          <Animated.View
            style={[styles.continueWrap, continueStyle]}
            pointerEvents={selectedPath ? 'auto' : 'none'}
          >
            <PrimaryButton label="Continue" onPress={handleContinue} />
          </Animated.View>
        </Animated.View>

        {/* Dashboard / run-summary layer. The summary takes over once
            gameOver flips; resetSelection (called by Play Again) clears it. */}
        <Animated.View
          style={[styles.layer, styles.dashLayer, dashLayerStyle]}
          pointerEvents={stage === 'dashboard' ? 'auto' : 'none'}
        >
          {player ? (
            gameOver ? (
              <RunSummaryScreen onPlayAgain={() => setStage('title')} />
            ) : (
              <DashboardLayer />
            )
          ) : null}
        </Animated.View>

        {/* Decision overlay — rendered at root so the backdrop covers the
            full screen, escaping the dashLayer's padding. Suppressed once
            the run ends so it can't appear behind the summary. */}
        {stage === 'dashboard' && currentEvent && !gameOver ? (
          <EventCard event={currentEvent} onChoose={chooseOption} />
        ) : null}

        {/* Phase-transition ack — rendered after EventCard so it sits on top
            if both ever coexist. The store guarantees they don't, but the
            stacking is still correct. */}
        {stage === 'dashboard' && phaseTransition && !gameOver ? (
          <PhaseTransitionOverlay
            phase={phaseTransition}
            onDismiss={dismissPhaseTransition}
          />
        ) : null}

        {__DEV__ ? <DevMenu /> : null}
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
  pathsLayer: {
    justifyContent: 'flex-start',
    gap: spacing.lg,
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
  pathsHeader: {
    gap: spacing.sm,
  },
  pathsTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  pathsLede: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  cardScroll: {
    flex: 1,
  },
  cardStack: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  continueWrap: {
    marginTop: spacing.sm,
  },
});
