import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import { STRENGTH_FIELDS, type Player } from '../../game/player';
import { colors } from '../../theme';

type Props = {
  player: Player;
  size?: number;
};

// Concentric guide rings, as fractions of the polygon's full radius. The
// outermost (1.0) reads as the 100% guide hexagon; the inner three give the
// graph a proper radar grid instead of a single floating shape.
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1.0] as const;

/**
 * Procedural strength-hexagon sigil. Six 0–100 stats plotted as a radar
 * polygon over a concentric emerald grid. The grid + axis spokes give the
 * graph the texture of a real radar plot; per-vertex labels live on the
 * IdentityMedallion that wraps this, where there's room for full strength
 * names without clipping the inner canvas.
 */
export function StrengthSigil({ player, size = 200 }: Props) {
  const { polygon, vertices, rings, spokes } = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;

    const polygon = Skia.Path.Make();
    const vertices: { x: number; y: number }[] = [];
    const spokes = Skia.Path.Make();

    // Concentric grid hexagons. Outer fraction (1.0) replaces the previous
    // single guide hex; inner fractions build out the radar texture.
    const rings = RING_FRACTIONS.map((frac) => {
      const ring = Skia.Path.Make();
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 3;
        const x = cx + Math.cos(a) * radius * frac;
        const y = cy + Math.sin(a) * radius * frac;
        if (i === 0) ring.moveTo(x, y);
        else ring.lineTo(x, y);
      }
      ring.close();
      return { path: ring, frac };
    });

    STRENGTH_FIELDS.forEach((field, i) => {
      // First axis points up; remaining axes every 60° clockwise.
      const angle = -Math.PI / 2 + (i * Math.PI) / 3;
      const raw = player[field.key] as number;
      const v = Math.max(0, Math.min(100, raw));
      const r = (v / 100) * radius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) polygon.moveTo(x, y);
      else polygon.lineTo(x, y);
      vertices.push({ x, y });

      // Spoke from center to the full-extent guide vertex on this axis.
      const gx = cx + Math.cos(angle) * radius;
      const gy = cy + Math.sin(angle) * radius;
      spokes.moveTo(cx, cy);
      spokes.lineTo(gx, gy);
    });
    polygon.close();

    return { polygon, vertices, rings, spokes };
  }, [player, size]);

  const center = size / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        {/* Concentric guide hexagons — innermost faintest, outer guide a
            touch more present so the 100% boundary still reads. */}
        {rings.map((r, i) => (
          <Path
            key={i}
            path={r.path}
            style="stroke"
            strokeWidth={r.frac === 1 ? 1 : 0.6}
            strokeJoin="round"
            color={colors.emerald}
            opacity={r.frac === 1 ? 0.22 : 0.1 + r.frac * 0.06}
          />
        ))}

        {/* Axis spokes — center → each outer vertex. Very faint, just
            enough to anchor the grid radially. */}
        <Path
          path={spokes}
          style="stroke"
          strokeWidth={0.6}
          color={colors.emerald}
          opacity={0.12}
        />

        {/* Soft halo behind the polygon fill — gives the player's shape a
            warm glow rather than reading as flat geometry. */}
        <Path
          path={polygon}
          style="fill"
          color={colors.accent}
          opacity={0.18}
        >
          <BlurMask blur={10} style="solid" />
        </Path>

        {/* Translucent gold fill */}
        <Path
          path={polygon}
          style="fill"
          color={colors.accent}
          opacity={0.28}
        />

        {/* Crisp gold outline */}
        <Path
          path={polygon}
          style="stroke"
          strokeWidth={1.5}
          strokeJoin="round"
          color={colors.accentBright}
          opacity={0.9}
        />

        {/* Emerald vertex dots with a soft halo each so they read as
            value-markers, not just polygon corners. */}
        {vertices.map((v, i) => (
          <React.Fragment key={i}>
            <Circle
              cx={v.x}
              cy={v.y}
              r={5}
              color={colors.emeraldBright}
              opacity={0.4}
            >
              <BlurMask blur={4} style="solid" />
            </Circle>
            <Circle
              cx={v.x}
              cy={v.y}
              r={2.2}
              color={colors.emeraldBright}
              opacity={0.95}
            />
          </React.Fragment>
        ))}

        {/* Center pip — subtle anchor so the grid has a clear origin. */}
        <Circle
          cx={center}
          cy={center}
          r={1.6}
          color={colors.accent}
          opacity={0.55}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
