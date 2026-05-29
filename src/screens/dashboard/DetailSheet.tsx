import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
};

// Generic dashboard detail sheet. Mirrors EventCard's overlay pattern — full-
// screen absoluteFill backdrop + a centered card with a Reanimated rise — but
// adds a close affordance and tap-backdrop-to-dismiss since these sheets are
// informational, not blocking. No modal / nav library involved.
export function DetailSheet({
  visible,
  onClose,
  eyebrow,
  title,
  children,
}: Props) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withTiming(visible ? 1 : 0, {
      duration: visible ? 280 : 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [visible, v]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: v.value * 0.82,
  }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * 24 }],
  }));

  if (!visible) return null;

  const dismiss = () => {
    Haptics.selectionAsync();
    onClose();
  };

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Pressable
        style={styles.backdropPress}
        onPress={dismiss}
        accessibilityLabel="Close"
      >
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <View style={styles.cardWrap} pointerEvents="box-none">
        <Animated.View style={[styles.card, cardStyle]}>
          <LinearGradient
            colors={[colors.surfaceElev, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.cardBody}>
            <View style={styles.headRow}>
              <View style={styles.headText}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Text style={styles.title}>{title}</Text>
              </View>
              <Pressable
                onPress={dismiss}
                hitSlop={10}
                style={styles.close}
                accessibilityLabel="Close"
              >
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

// Shared building blocks for the sheet contents below. Kept colocated so the
// two detail views can stay short and read like a layout, not styling.

export function Row({
  label,
  value,
  valueColor,
  emphasis,
}: {
  label: string;
  value: string;
  valueColor?: string;
  // `total` is the inflow/outflow subtotal row; `net` is the bottom-line.
  emphasis?: 'total' | 'net';
}) {
  return (
    <View style={[styles.row, emphasis === 'total' && styles.rowTotal]}>
      <Text
        style={[
          styles.rowLabel,
          emphasis === 'total' && styles.rowLabelTotal,
          emphasis === 'net' && styles.rowLabelNet,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.rowValue,
          emphasis === 'total' && styles.rowValueTotal,
          emphasis === 'net' && styles.rowValueNet,
          valueColor ? { color: valueColor } : null,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

export function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function Note({ children }: { children: string }) {
  return <Text style={styles.note}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    zIndex: 50,
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(4, 5, 8, 0.78)',
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
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
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headText: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.accent,
  },
  title: {
    ...typography.hero,
    color: colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(20, 23, 28, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 18,
  },
  section: {
    gap: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  sectionBody: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
    paddingVertical: 2,
  },
  // Subtotal rows get a hairline divider above to read like a math reckoning.
  rowTotal: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    marginTop: 4,
    paddingTop: spacing.xs + 2,
  },
  rowLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    flexShrink: 1,
  },
  rowLabelTotal: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowLabelNet: {
    ...typography.caption,
    color: colors.textMuted,
    letterSpacing: 1.6,
  },
  rowValue: {
    ...typography.statSmall,
    color: colors.textPrimary,
    fontSize: 16,
  },
  rowValueTotal: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  rowValueNet: {
    ...typography.stat,
    color: colors.textPrimary,
    fontSize: 26,
  },
  note: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
