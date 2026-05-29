import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { DetailSheet } from '../../screens/dashboard/DetailSheet';

type LapsedEntry = { eventId: string; resultText?: string };

type Props = {
  lapsed: LapsedEntry[];
  onDismiss: () => void;
};

// Read-only acknowledgment for parked decisions that expired. Reuses
// DetailSheet (the existing read-only overlay shell — close × / backdrop tap)
// rather than the blocking EventCard pattern. Entries without resultText
// are silent-vanish opportunities and produce no line; if EVERY entry this
// step was silent, the caller suppresses mount so nothing shows at all.
export function LapsedOverlay({ lapsed, onDismiss }: Props) {
  const visibleLines = lapsed.filter(
    (l): l is LapsedEntry & { resultText: string } => !!l.resultText,
  );
  return (
    <DetailSheet
      visible={true}
      onClose={onDismiss}
      eyebrow="LAPSED"
      title={
        visibleLines.length === 1
          ? 'A decision you let pass'
          : 'Decisions you let pass'
      }
    >
      <View style={styles.list}>
        {visibleLines.map((l) => (
          <Text key={l.eventId} style={styles.line}>
            {l.resultText}
          </Text>
        ))}
      </View>
    </DetailSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  line: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
