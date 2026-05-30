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
import { StartPointCard } from '../components/StartPointCard';
import { DirectionCard } from '../components/DirectionCard';
import { EventCard } from '../components/game/EventCard';
import { LapsedOverlay } from '../components/game/LapsedOverlay';
import { PhaseTransitionOverlay } from '../components/game/PhaseTransitionOverlay';
import { DashboardLayer } from './DashboardLayer';
import { RunSummaryScreen } from './RunSummaryScreen';
import { DevMenu } from '../dev/DevMenu';
import { FOUNDATION_PATHS } from '../data/foundationPaths';
import {
  START_POINTS,
  START_POINT_BY_ID,
  type StartPointDirection,
} from '../data/startPoints';
import { leaningFromFlags } from '../game/player';
import { useGameStore } from '../state/gameStore';
import { colors, spacing, typography } from '../theme';

type Stage = 'title' | 'startPoint' | 'paths' | 'direction' | 'dashboard';
const STAGE_INDEX: Record<Stage, number> = {
  title: 0,
  startPoint: 1,
  paths: 2,
  direction: 2, // peer of paths — only one renders per run
  dashboard: 3,
};

// Direction copy used by the sub-pick that follows any non-university start.
// One-liners frame the long-arc shape of each direction so the choice carries
// weight without leaning on stat numbers.
const DIRECTION_OPTIONS: ReadonlyArray<{
  id: StartPointDirection;
  title: string;
  blurb: string;
}> = [
  {
    id: 'corporate',
    title: 'Corporate Climber',
    blurb: 'Commit to the ladder. Title, package, brand — the path is well-lit.',
  },
  {
    id: 'founder',
    title: 'Startup Founder',
    blurb: "Commit to building. The path is dim; the ceiling isn't drawn.",
  },
  {
    id: 'freelancer',
    title: 'Freelancer',
    blurb: 'Commit to independence. You trade ceiling for control.',
  },
];

export function HomeScreen() {
  const [stage, setStage] = useState<Stage>('title');
  const selectedStartPoint = useGameStore((s) => s.selectedStartPoint);
  const selectedPath = useGameStore((s) => s.selectedPath);
  const selectedDirection = useGameStore((s) => s.selectedDirection);
  const player = useGameStore((s) => s.player);
  const selectStartPoint = useGameStore((s) => s.selectStartPoint);
  const selectFoundationPath = useGameStore((s) => s.selectFoundationPath);
  const selectDirection = useGameStore((s) => s.selectDirection);
  const startGame = useGameStore((s) => s.startGame);
  const currentEvent = useGameStore((s) => s.currentEvent);
  const chooseOption = useGameStore((s) => s.chooseOption);
  const deferDecision = useGameStore((s) => s.deferDecision);
  const gameOver = useGameStore((s) => s.gameOver);
  const phaseTransition = useGameStore((s) => s.phaseTransition);
  const dismissPhaseTransition = useGameStore((s) => s.dismissPhaseTransition);
  const lapsedThisStep = useGameStore((s) => s.lapsedThisStep);
  const dismissLapses = useGameStore((s) => s.dismissLapses);

  const enter = useSharedValue(0);
  const stageV = useSharedValue(0);
  const startPointCtaV = useSharedValue(0);
  const pathsCtaV = useSharedValue(0);
  const directionCtaV = useSharedValue(0);

  // Auto-clear silent-only lapses (same logic as before — opportunities with
  // no resultText shouldn't block the EventCard / phase overlay queue).
  const hasVisibleLapses = lapsedThisStep.some((l) => !!l.resultText);
  const hasSilentOnlyLapses =
    lapsedThisStep.length > 0 && !hasVisibleLapses;
  useEffect(() => {
    if (hasSilentOnlyLapses) dismissLapses();
  }, [hasSilentOnlyLapses, dismissLapses]);

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
    startPointCtaV.value = withTiming(selectedStartPoint ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedStartPoint, startPointCtaV]);

  useEffect(() => {
    pathsCtaV.value = withTiming(selectedPath ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedPath, pathsCtaV]);

  useEffect(() => {
    directionCtaV.value = withTiming(selectedDirection ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedDirection, directionCtaV]);

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

  const startPointLayerStyle = useAnimatedStyle(() => ({
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

  const pathsLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stageV.value, [1, 2, 3], [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          stageV.value,
          [1, 2, 3],
          [22, 0, -18],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const directionLayerStyle = pathsLayerStyle; // identical curve; peer of paths

  const startPointCtaStyle = useAnimatedStyle(() => ({
    opacity: startPointCtaV.value,
    transform: [{ translateY: (1 - startPointCtaV.value) * 14 }],
  }));
  const pathsCtaStyle = useAnimatedStyle(() => ({
    opacity: pathsCtaV.value,
    transform: [{ translateY: (1 - pathsCtaV.value) * 14 }],
  }));
  const directionCtaStyle = useAnimatedStyle(() => ({
    opacity: directionCtaV.value,
    transform: [{ translateY: (1 - directionCtaV.value) * 14 }],
  }));

  const dashLayerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(stageV.value, [2, 3], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          stageV.value,
          [2, 3],
          [22, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handleStartPointContinue = () => {
    if (!selectedStartPoint) return;
    if (selectedStartPoint === 'university') setStage('paths');
    else setStage('direction');
  };

  const handlePathContinue = () => {
    startGame();
    setStage('dashboard');
  };

  const handleDirectionContinue = () => {
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
            <PrimaryButton label="Begin" onPress={() => setStage('startPoint')} />
            <Text style={styles.footnote}>Dev build · v0.1</Text>
          </Animated.View>
        </Animated.View>

        {/* Start-point picker — the new entry-machinery layer. Replaces the
            old target-age "choose your finish" stage. */}
        <Animated.View
          style={[styles.layer, styles.stackLayer, startPointLayerStyle]}
          pointerEvents={stage === 'startPoint' ? 'auto' : 'none'}
        >
          <View style={styles.stackHeader}>
            <Text style={styles.eyebrow}>CHOOSE WHERE YOU START</Text>
            <Text style={styles.stackTitle}>
              When does{'\n'}your story{'\n'}begin?
            </Text>
            <Text style={styles.stackLede}>
              Less runway means harder choices; more runway means a gentler arc.
              All four runs target freedom by 60.
            </Text>
          </View>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardStack}
            showsVerticalScrollIndicator={false}
          >
            {START_POINTS.map((sp) => (
              <StartPointCard
                key={sp.id}
                startPoint={sp}
                selected={selectedStartPoint === sp.id}
                onSelect={() => selectStartPoint(sp.id)}
              />
            ))}
          </ScrollView>

          {selectedStartPoint ? (
            <Animated.View style={startPointCtaStyle} pointerEvents="auto">
              <PrimaryButton label="Continue" onPress={handleStartPointContinue} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Foundation path selection layer — only for University·18. */}
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

          {selectedPath ? (
            <Animated.View style={pathsCtaStyle} pointerEvents="auto">
              <PrimaryButton label="Begin" onPress={handlePathContinue} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Direction sub-pick — only for non-university starts. */}
        <Animated.View
          style={[styles.layer, styles.directionLayer, directionLayerStyle]}
          pointerEvents={stage === 'direction' ? 'auto' : 'none'}
        >
          <View style={styles.stackHeader}>
            <Text style={styles.eyebrow}>
              {selectedStartPoint
                ? `AGE ${START_POINT_BY_ID[selectedStartPoint].startAge} · COMMIT YOUR DIRECTION`
                : 'COMMIT YOUR DIRECTION'}
            </Text>
            <Text style={styles.stackTitle}>The shape{'\n'}of your{'\n'}years.</Text>
            <Text style={styles.stackLede}>
              You're skipping foundation. That means committing now — your past
              has already tilted somewhere.
            </Text>
          </View>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardStack}
            showsVerticalScrollIndicator={false}
          >
            {DIRECTION_OPTIONS.map((opt) => (
              <DirectionCard
                key={opt.id}
                direction={opt.id}
                title={opt.title}
                blurb={opt.blurb}
                selected={selectedDirection === opt.id}
                onSelect={() => selectDirection(opt.id)}
              />
            ))}
          </ScrollView>

          {selectedDirection ? (
            <Animated.View style={directionCtaStyle} pointerEvents="auto">
              <PrimaryButton label="Begin" onPress={handleDirectionContinue} />
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Dashboard / run-summary layer. */}
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

        {/* Lapse ack — surfaced before the EventCard / phase-transition stack. */}
        {stage === 'dashboard' && hasVisibleLapses && !gameOver ? (
          <LapsedOverlay lapsed={lapsedThisStep} onDismiss={dismissLapses} />
        ) : null}

        {stage === 'dashboard' &&
        currentEvent &&
        !gameOver &&
        !hasVisibleLapses ? (
          <EventCard
            event={currentEvent}
            onChoose={chooseOption}
            onDefer={deferDecision}
            pendingCount={player ? player.pendingDecisions.length : 0}
            leaning={player ? leaningFromFlags(player.flags) : null}
          />
        ) : null}

        {stage === 'dashboard' &&
        phaseTransition &&
        !gameOver &&
        !hasVisibleLapses ? (
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
  stackLayer: {
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pathsLayer: {
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  directionLayer: {
    justifyContent: 'flex-start',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stackHeader: {
    gap: spacing.sm,
  },
  stackTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    marginTop: spacing.xs,
  },
  stackLede: {
    ...typography.body,
    color: colors.textSecondary,
    maxWidth: 320,
    marginTop: spacing.xs,
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
    color: colors.textSecondary,
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
    paddingBottom: spacing.xl,
  },
});
