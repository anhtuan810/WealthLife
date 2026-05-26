import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { STRENGTH_FIELDS, type Player } from '../../game/player';
import { colors } from '../../theme';

type Props = {
  player: Player;
  size?: number;
};

/**
 * Procedural strength-hexagon sigil. Six 0–100 stats plotted as a radar
 * polygon. Always renders — used as the inside of the IdentityMedallion.
 */
export function StrengthSigil({ player, size = 200 }: Props) {
  const { polygon, guide, vertices } = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.42;

    const polygon = Skia.Path.Make();
    const guide = Skia.Path.Make();
    const vertices: { x: number; y: number }[] = [];

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

      const gx = cx + Math.cos(angle) * radius;
      const gy = cy + Math.sin(angle) * radius;
      if (i === 0) guide.moveTo(gx, gy);
      else guide.lineTo(gx, gy);
    });
    polygon.close();
    guide.close();

    return { polygon, guide, vertices };
  }, [player, size]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        {/* Faint full-extent guide hexagon — emerald, restrained */}
        <Path
          path={guide}
          style="stroke"
          strokeWidth={1}
          strokeJoin="round"
          color={colors.emerald}
          opacity={0.18}
        />
        {/* Translucent gold fill */}
        <Path
          path={polygon}
          style="fill"
          color={colors.accent}
          opacity={0.22}
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
        {/* Emerald vertex dots */}
        {vertices.map((v, i) => (
          <Circle
            key={i}
            cx={v.x}
            cy={v.y}
            r={2}
            color={colors.emeraldBright}
            opacity={0.85}
          />
        ))}
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
