import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  LifeFigure,
  type LifeDirection,
  type LifePhase,
} from '../components/visual/LifeFigure';
import { colors, radii, spacing, typography } from '../theme';

// __DEV__-only visual harness for <LifeFigure>. Lets us cycle every prop
// state in the simulator without wiring the component into the game yet.

const PHASES: ReadonlyArray<LifePhase> = [
  'foundation',
  'career',
  'growth',
  'freedom',
];

const DIRECTIONS: ReadonlyArray<LifeDirection> = [
  null,
  'corporate',
  'founder',
  'freelancer',
];

const STRESS_STEPS = [0, 1, 2, 3, 4, 5] as const;
const FREEDOM_STEPS = [0, 0.25, 0.5, 0.75, 1] as const;

export function LifeFigurePreview() {
  const [phase, setPhase] = useState<LifePhase>('foundation');
  const [direction, setDirection] = useState<LifeDirection>(null);
  const [stress, setStress] = useState<number>(0);
  const [freedom, setFreedom] = useState<number>(0);

  return (
    <View style={styles.root}>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>LIFE FIGURE · DEV PREVIEW</Text>
      </View>

      <View style={styles.stage}>
        <LifeFigure
          phase={phase}
          direction={direction}
          stress={stress}
          freedomRatio={freedom}
          size={300}
        />
      </View>

      <View style={styles.controls}>
        <Row label="PHASE">
          {PHASES.map((p) => (
            <Chip
              key={p}
              label={p}
              active={phase === p}
              onPress={() => setPhase(p)}
            />
          ))}
        </Row>

        <Row label="DIRECTION">
          {DIRECTIONS.map((d) => (
            <Chip
              key={d ?? 'none'}
              label={d ?? 'none'}
              active={direction === d}
              onPress={() => setDirection(d)}
            />
          ))}
        </Row>

        <Row label="STRESS · 0–5">
          {STRESS_STEPS.map((s) => (
            <Chip
              key={s}
              label={String(s)}
              active={stress === s}
              onPress={() => setStress(s)}
            />
          ))}
        </Row>

        <Row label="FREEDOM · 0–1">
          {FREEDOM_STEPS.map((f) => (
            <Chip
              key={f}
              label={f.toFixed(2)}
              active={freedom === f}
              onPress={() => setFreedom(f)}
            />
          ))}
        </Row>
      </View>
    </View>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowChips}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      hitSlop={4}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 72,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  badge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(8, 9, 11, 0.7)',
    marginBottom: spacing.lg,
  },
  badgeLabel: {
    ...typography.caption,
    color: colors.accent,
    letterSpacing: 2,
    fontSize: 10,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.xs,
  },
  rowLabel: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  rowChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontSize: 11,
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  chipLabelActive: {
    color: colors.accent,
  },
});
