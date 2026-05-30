import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { NetWorthChart } from '../components/NetWorthChart';
import { PrimaryButton } from '../components/PrimaryButton';
import { IdentityMedallion } from '../components/visual/IdentityMedallion';
import { colors, radii, spacing, typography } from '../theme';
import { START_POINT_BY_ID } from '../data/startPoints';
import {
  STRENGTH_FIELDS,
  freedomPct,
  netWorth,
  type Player,
} from '../game/player';
import { useGameStore } from '../state/gameStore';
import { resolveWhyEnding } from '../personalization';

const fmtMoney = (n: number) => {
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
};

type Props = {
  onPlayAgain: () => void;
};

export function RunSummaryScreen({ onPlayAgain }: Props) {
  const player = useGameStore((s) => s.player);
  const endingResult = useGameStore((s) => s.endingResult);
  const grade = useGameStore((s) => s.grade);
  const profile = useGameStore((s) => s.profile);
  const resetSelection = useGameStore((s) => s.resetSelection);

  const { width } = useWindowDimensions();
  // Medallion footprint. Previously bumped to 0.92 to compensate for the
  // ornate PNG's internal padding; now that we render the procedural ring
  // (which fills its footprint without internal whitespace) the same box
  // reads ~15% larger on screen than it did framed, plus the per-vertex
  // axis labels extend the perceived bulk further. Dialled back to ~0.7 of
  // screen width so the medallion fits the lower half without clipping
  // labels or pushing the chart/strengths/CTA off-screen.
  const medallionSize = Math.max(240, Math.min(320, Math.round(width * 0.7)));

  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = withDelay(
      80,
      withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) }),
    );
  }, [enter]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 18 }],
  }));

  const gradeStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.92 + enter.value * 0.08 }],
  }));

  if (!player || !endingResult || !grade) return null;

  const freedom = freedomPct(player);
  const nw = netWorth(player);

  // Net-worth chart annotations — frame the curve so it narrates the run.
  // startAge now reads from the player's actual entry into the arc (set by
  // createPlayerFromStartPoint) rather than the previously-hardcoded 18.
  // Legacy/dev saves without startPointId fall back to 'university', which
  // resolves to startAge 18 — the prior behavior is preserved by default.
  const startPoint = START_POINT_BY_ID[player.startPointId ?? 'university'];
  const startAge = startPoint.startAge;
  const endAge = player.targetAge;
  const startNetWorth = player.netWorthHistory[0] ?? 0;
  const endNetWorth =
    player.netWorthHistory[player.netWorthHistory.length - 1] ?? 0;

  const handlePlayAgain = () => {
    resetSelection();
    onPlayAgain();
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, headerStyle]}>
          <Text style={styles.eyebrow}>
            AGE {startAge} → {endAge}
          </Text>
          <Text style={styles.endingTitle}>{endingResult.title}</Text>
          <Text style={styles.endingCopy}>{endingResult.copy}</Text>
          {/* why × outcome-band reflection (framework §3). PURE READ over
              grade + ending — band derivation must not alter either. ADDS
              to the grade-keyed copy above; never replaces it. */}
          <Text style={styles.whyEnding}>
            {resolveWhyEnding(
              profile ?? undefined,
              grade.letter,
              endingResult,
            )}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.gradeBlock, gradeStyle]}>
          <Text style={styles.gradeEyebrow}>RUN GRADE</Text>
          <Text style={styles.gradeLetter}>{grade.letter}</Text>
          <Text style={styles.gradeScore}>{grade.score} / 100</Text>
          <View style={styles.componentsRow}>
            <Component
              label="FREEDOM"
              value={grade.components.freedom}
              max={50}
            />
            <Component
              label="SUSTAIN"
              value={grade.components.sustainability}
              max={30}
            />
            <Component
              label="GROWTH"
              value={grade.components.growth}
              max={20}
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.medallionBlock, gradeStyle]}>
          <Text style={styles.medallionEyebrow}>WHO YOU BECAME</Text>
          <IdentityMedallion player={player} size={medallionSize} />
        </Animated.View>

        <View style={styles.statRow}>
          <Stat label="FREEDOM" value={`${freedom}%`} />
          <View style={styles.statDivider} />
          <Stat label="NET WORTH" value={fmtMoney(nw)} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.cardEyebrow}>NET WORTH · FULL HISTORY</Text>
            {/* Age range frames the x-span so the curve reads as a life arc
                rather than a month count. */}
            <Text style={styles.chartMuted}>
              AGE {startAge} → {endAge}
            </Text>
          </View>
          <View style={styles.chartArea}>
            <NetWorthChart history={player.netWorthHistory} />
          </View>
          {/* Endpoint values anchor the curve so it reads as "from $X to $Y."
              Padded to roughly align with the chart's PAD_X (6) inset. */}
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterValue}>
              {fmtMoney(startNetWorth)}
            </Text>
            <Text style={styles.chartFooterValueEnd}>
              {fmtMoney(endNetWorth)}
            </Text>
          </View>
        </View>

        <View style={styles.strengthsCard}>
          <Text style={styles.cardEyebrow}>STRENGTH PROFILE · DETAIL</Text>
          <StrengthsGrid player={player} />
        </View>
      </ScrollView>

      {/* Soft fade hints there's content scrolling beyond the visible area —
          sits just above the sticky CTA, transparent → bg, pointer-disabled
          so scroll gestures still pass through. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(8, 9, 11, 0)', colors.bg]}
        style={styles.scrollFade}
      />

      {/* Sticky CTA — Play Again is the only action and was being buried
          below the medallion + stats + chart + strengths card. Pinning it
          keeps it reachable at every scroll position. */}
      <View style={styles.cta}>
        <PrimaryButton label="Play Again" onPress={handlePlayAgain} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Component({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  return (
    <View style={styles.componentCell}>
      <Text style={styles.componentLabel}>{label}</Text>
      <Text style={styles.componentValue}>
        {value}
        <Text style={styles.componentMax}> /{max}</Text>
      </Text>
    </View>
  );
}

function StrengthsGrid({ player }: { player: Player }) {
  return (
    <View style={styles.strengthsGrid}>
      {STRENGTH_FIELDS.map(({ key, label }) => (
        <View key={key} style={styles.strengthCell}>
          <Text style={styles.strengthLabel}>{label}</Text>
          <Text style={styles.strengthValue}>
            {String(player[key] as number)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    // Clears the sticky CTA + fade overlay below: button (~56) + outer
    // margins + breathing room. Tune in lockstep with `cta` / `scrollFade`.
    paddingBottom: 120,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  endingTitle: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 42,
    marginTop: spacing.xs,
  },
  endingCopy: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  // Slightly lifted treatment to mark it as a separate beat — same family
  // as endingCopy, brighter color + small top divider via margin so the
  // reflection reads as a closing line, not a continuation.
  whyEnding: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  gradeBlock: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
  },
  gradeEyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.8,
  },
  // Was 96/100 — dominant. 64/68 keeps the letter as the headline number
  // without towering over the components row + glosses underneath.
  gradeLetter: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -2,
    lineHeight: 68,
  },
  gradeScore: {
    ...typography.label,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  medallionBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    // Pull hard up against the grade card (was -spacing.md) so the medallion
    // sits close under it rather than floating in a big empty zone. Bottom
    // margin stays tight too so the stat row reads as a related cap to the
    // medallion section.
    marginTop: -spacing.lg,
    marginBottom: -spacing.md,
  },
  medallionEyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.8,
  },
  componentsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    // Span the card so each cell gets a third of the width — keeps the
    // glosses aligned and lets longer copy wrap nicely.
    alignSelf: 'stretch',
    paddingHorizontal: spacing.md,
  },
  componentCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  componentLabel: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  componentValue: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 18,
  },
  componentMax: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  statBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  statValue: {
    ...typography.stat,
    color: colors.textPrimary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.borderSoft,
    marginVertical: spacing.xs,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    // Bumped from 150 to fit the new endpoint-value footer below the curve.
    height: 188,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardEyebrow: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  chartMuted: {
    ...typography.caption,
    color: colors.textFaint,
    letterSpacing: 1.2,
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // PAD_X on the NetWorthChart Skia canvas is 6 — match so the labels sit
    // roughly under the curve's start and end points.
    paddingHorizontal: 6,
  },
  chartFooterValue: {
    ...typography.statSmall,
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  chartFooterValueEnd: {
    ...typography.statSmall,
    color: colors.emeraldBright,
    fontSize: 13,
    letterSpacing: -0.2,
  },
  strengthsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  strengthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  strengthCell: {
    width: '33.333%',
    paddingVertical: 2,
    gap: 2,
  },
  strengthLabel: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  strengthValue: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 18,
  },
  // Sticky footer. Sits below the ScrollView in the column layout. Solid bg
  // backing means content scrolling underneath isn't visible through the
  // button itself; the fade above handles the transition.
  cta: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  // Fade gradient ABOVE the sticky CTA — visual cue that more content is
  // below the visible scroll viewport. Absolute so it overlays the scroll
  // content but doesn't take layout space; pointerEvents off so scrolling
  // through the fade still works.
  scrollFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Sits directly above the cta's top edge (cta height ≈ button + paddings).
    bottom: 70,
    height: 48,
  },
});
