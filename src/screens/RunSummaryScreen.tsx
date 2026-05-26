import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { NetWorthChart } from '../components/NetWorthChart';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, radii, spacing, typography } from '../theme';
import { FOUNDATION_PATH_BY_ID } from '../data/foundationPaths';
import { freedomPct, netWorth, type Player } from '../game/player';
import { useGameStore } from '../state/gameStore';

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
  const resetSelection = useGameStore((s) => s.resetSelection);

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

  const path = FOUNDATION_PATH_BY_ID[player.foundationPath];
  const freedom = freedomPct(player);
  const nw = netWorth(player);

  const handlePlayAgain = () => {
    resetSelection();
    onPlayAgain();
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={styles.eyebrow}>
          {path.title.toUpperCase()} · AGE {player.age}
        </Text>
        <Text style={styles.endingTitle}>{endingResult.title}</Text>
        <Text style={styles.endingCopy}>{endingResult.copy}</Text>
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

      <View style={styles.statRow}>
        <Stat label="FREEDOM" value={`${freedom}%`} />
        <View style={styles.statDivider} />
        <Stat label="NET WORTH" value={fmtMoney(nw)} />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardEyebrow}>NET WORTH · FULL HISTORY</Text>
          <Text style={styles.chartMuted}>
            {player.netWorthHistory.length} mo
          </Text>
        </View>
        <View style={styles.chartArea}>
          <NetWorthChart history={player.netWorthHistory} />
        </View>
      </View>

      <View style={styles.strengthsCard}>
        <Text style={styles.cardEyebrow}>FINAL STRENGTH PROFILE</Text>
        <StrengthsGrid player={player} />
      </View>

      <View style={styles.cta}>
        <PrimaryButton label="Play Again" onPress={handlePlayAgain} />
      </View>
    </ScrollView>
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

const STRENGTH_FIELDS: ReadonlyArray<{ key: keyof Player; label: string }> = [
  { key: 'skill', label: 'SKILL' },
  { key: 'network', label: 'NETWORK' },
  { key: 'reputation', label: 'REP' },
  { key: 'discipline', label: 'DISCIPLINE' },
  { key: 'riskTolerance', label: 'RISK' },
  { key: 'ambition', label: 'AMBITION' },
];

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
  content: {
    paddingBottom: spacing.xxl,
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
  gradeBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
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
  gradeLetter: {
    fontSize: 96,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: -4,
    lineHeight: 100,
  },
  gradeScore: {
    ...typography.label,
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  componentsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  componentCell: {
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
    gap: spacing.md,
    height: 150,
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
  cta: {
    marginTop: spacing.md,
  },
});
