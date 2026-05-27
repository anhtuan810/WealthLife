import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { hasArt } from '../assets/art';
import { HeroBackdrop } from '../components/visual/HeroBackdrop';
import { RunSummaryScreen } from '../screens/RunSummaryScreen';
import { useGameStore } from '../state/gameStore';
import type { Phase } from '../game/player';
import { colors, radii, spacing, typography } from '../theme';

// __DEV__-only manual preview/inspection tool. Mounted by HomeScreen behind
// an `if (__DEV__)` guard so it cannot reach release bundles. Lets us pop
// each full-screen art surface, the run summary, and nudge gameStore by hand
// without playing through a real run.

const SCENE_KEYS = ['start_hero', 'phase_career'] as const;

type SceneKey = (typeof SCENE_KEYS)[number];

const PHASES: ReadonlyArray<Phase> = [
  'foundation',
  'career',
  'growth',
  'freedom',
];

const FREEDOM_STEPS = [0, 25, 50, 75, 100] as const;
const AGE_STEPS = [18, 22, 25, 30, 40] as const;

export function DevMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scene, setScene] = useState<SceneKey | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const player = useGameStore((s) => s.player);
  const devSetFreedomPct = useGameStore((s) => s.devSetFreedomPct);
  const devSetPhase = useGameStore((s) => s.devSetPhase);
  const devSetAge = useGameStore((s) => s.devSetAge);
  const devSeedRunSummary = useGameStore((s) => s.devSeedRunSummary);
  const endingResult = useGameStore((s) => s.endingResult);
  const grade = useGameStore((s) => s.grade);

  const openScene = (key: SceneKey) => {
    setMenuOpen(false);
    setScene(key);
  };

  const openSummary = () => {
    if (!player || !endingResult || !grade) devSeedRunSummary();
    setMenuOpen(false);
    setSummaryOpen(true);
  };

  return (
    <>
      <Pressable
        onPress={() => setMenuOpen(true)}
        style={styles.fab}
        hitSlop={8}
      >
        <Text style={styles.fabLabel}>DEV</Text>
      </Pressable>

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.scrim} onPress={() => setMenuOpen(false)}>
          {/* swallow taps inside the sheet so they don't dismiss */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.title}>DEV MENU</Text>
              <Text style={styles.subtle}>
                {player
                  ? `age ${player.age} · ${player.phase}`
                  : 'no active player'}
              </Text>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Section label="PREVIEW SCENE">
                <Grid>
                  {SCENE_KEYS.map((k) => (
                    <Chip key={k} label={k} onPress={() => openScene(k)} />
                  ))}
                  <Chip label="Run Summary" onPress={openSummary} wide />
                </Grid>
              </Section>

              <Section label="SET STATE · FREEDOM%">
                <Grid>
                  {FREEDOM_STEPS.map((pct) => (
                    <Chip
                      key={pct}
                      label={`${pct}%`}
                      disabled={!player}
                      onPress={() => devSetFreedomPct(pct)}
                    />
                  ))}
                </Grid>
              </Section>

              <Section label="SET STATE · PHASE">
                <Grid>
                  {PHASES.map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      disabled={!player}
                      active={player?.phase === p}
                      onPress={() => devSetPhase(p)}
                    />
                  ))}
                </Grid>
              </Section>

              <Section label="SET STATE · AGE">
                <Grid>
                  {AGE_STEPS.map((a) => (
                    <Chip
                      key={a}
                      label={String(a)}
                      disabled={!player}
                      active={player?.age === a}
                      onPress={() => devSetAge(a)}
                    />
                  ))}
                </Grid>
              </Section>
            </ScrollView>

            <Pressable
              onPress={() => setMenuOpen(false)}
              style={styles.close}
              hitSlop={8}
            >
              <Text style={styles.closeLabel}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={scene !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setScene(null)}
      >
        <Pressable style={styles.sceneRoot} onPress={() => setScene(null)}>
          {scene ? <HeroBackdrop assetKey={scene} /> : null}
          <View pointerEvents="none" style={styles.sceneBadge}>
            <Text style={styles.sceneBadgeLabel}>
              {scene}
              {scene && !hasArt(scene) ? ' · (art missing)' : ''} · tap to dismiss
            </Text>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={summaryOpen}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setSummaryOpen(false)}
      >
        <View style={styles.summaryRoot}>
          <RunSummaryScreen onPlayAgain={() => setSummaryOpen(false)} />
          <Pressable
            onPress={() => setSummaryOpen(false)}
            style={styles.summaryClose}
            hitSlop={8}
          >
            <Text style={styles.summaryCloseLabel}>CLOSE</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <View style={styles.grid}>{children}</View>;
}

function Chip({
  label,
  onPress,
  disabled,
  active,
  wide,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        styles.chip,
        wide && styles.chipWide,
        active && styles.chipActive,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          active && styles.chipLabelActive,
          disabled && styles.chipLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 36,
    right: 16,
    minWidth: 48,
    height: 32,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(217, 178, 106, 0.18)',
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  fabLabel: {
    ...typography.caption,
    color: colors.accent,
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgElev,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '85%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.eyebrow,
    color: colors.accent,
    fontSize: 12,
    letterSpacing: 2.6,
  },
  subtle: {
    ...typography.caption,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textFaint,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  chipWide: {
    paddingHorizontal: spacing.lg,
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipDisabled: {
    opacity: 0.35,
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
  chipLabelDisabled: {
    color: colors.textMuted,
  },
  close: {
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  closeLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  sceneRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sceneBadge: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(8, 9, 11, 0.7)',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sceneBadgeLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 1.4,
  },
  summaryRoot: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 72,
    paddingHorizontal: spacing.xl,
  },
  summaryClose: {
    position: 'absolute',
    top: 48,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(8, 9, 11, 0.7)',
  },
  summaryCloseLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
});
