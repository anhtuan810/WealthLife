import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { colors, typography } from '../../theme';
import { STRENGTH_FIELDS, type Player } from '../../game/player';
import { StrengthSigil } from './StrengthSigil';

type Props = {
  player: Player;
  size?: number;
};

// Per-vertex label box. Width is generous (the longest labels — REPUTATION
// and DISCIPLINE — are 10 chars at fontSize 9, ≈ 65px). Rendered in the
// outer wrap so the box can comfortably hold full strength names without
// clipping against the sigil canvas.
const LABEL_W = 92;
const LABEL_H = 14;
// Distance past the polygon's full radius for the label center. Keeps the
// label clear of the gold outline without bleeding into the procedural ring.
const LABEL_OFFSET = 14;

/**
 * Run-end identity medallion. Procedural thin-ring + warm halo around the
 * StrengthSigil, with per-vertex axis labels rendered in the outer wrap
 * (more room than inside the sigil canvas, so full strength names fit).
 */
export function IdentityMedallion({ player, size = 240 }: Props) {
  // Sigil canvas footprint inside the outer medallion wrap.
  const inner = Math.round(size * 0.78);
  // Polygon math — duplicated from StrengthSigil so labels can be placed
  // exactly on each axis without piping geometry up through props. Outer
  // wrap is `size × size`; the sigil's polygon center coincides with the
  // outer wrap's center, and the polygon radius is `inner × 0.42`.
  const center = size / 2;
  const polygonRadius = inner * 0.42;
  const labelRadius = polygonRadius + LABEL_OFFSET;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }]}
    >
      <ProceduralRing size={size} />
      <StrengthSigil player={player} size={inner} />

      {STRENGTH_FIELDS.map((field, i) => {
        const angle = -Math.PI / 2 + (i * Math.PI) / 3;
        const lx = center + Math.cos(angle) * labelRadius;
        const ly = center + Math.sin(angle) * labelRadius;
        return (
          <View
            key={field.key}
            style={[
              styles.label,
              {
                left: lx - LABEL_W / 2,
                top: ly - LABEL_H / 2,
              },
            ]}
          >
            <Text style={styles.labelText} numberOfLines={1}>
              {field.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function ProceduralRing({ size }: { size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;
  return (
    <Canvas
      style={[StyleSheet.absoluteFill, { width: size, height: size }]}
    >
      {/* Soft warm halo behind the sigil */}
      <Rect x={0} y={0} width={size} height={size}>
        <RadialGradient
          c={vec(cx, cy)}
          r={r}
          colors={[colors.accentSoft, 'transparent']}
        />
      </Rect>
      {/* Outer gold hairline */}
      <Circle
        cx={cx}
        cy={cy}
        r={r}
        style="stroke"
        strokeWidth={1}
        color={colors.accent}
        opacity={0.4}
      />
      {/* Inner emerald whisper */}
      <Circle
        cx={cx}
        cy={cy}
        r={r - 6}
        style="stroke"
        strokeWidth={0.75}
        color={colors.emerald}
        opacity={0.18}
      />
    </Canvas>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    width: LABEL_W,
    height: LABEL_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: 'center',
  },
});
