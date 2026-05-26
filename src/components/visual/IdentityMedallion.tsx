import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { ART, hasArt } from '../../assets/art';
import { colors } from '../../theme';
import type { Player } from '../../game/player';
import { StrengthSigil } from './StrengthSigil';

type Props = {
  player: Player;
  assetKey?: string;
  size?: number;
};

/**
 * Run-end identity medallion. Always renders the procedural StrengthSigil
 * inside; the optional `identity_medallion` PNG is a hollow frame composed
 * on top. With no art, a restrained procedural ring stands in.
 */
export function IdentityMedallion({ player, assetKey, size = 240 }: Props) {
  const framed = hasArt(assetKey);
  // Inside-the-frame target; tuned so the hexagon clears the hollow art.
  const inner = Math.round(size * (framed ? 0.66 : 0.78));

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }]}
    >
      {!framed && <ProceduralRing size={size} />}
      <StrengthSigil player={player} size={inner} />
      {framed && (
        <Image
          source={ART[assetKey!]}
          resizeMode="contain"
          style={StyleSheet.absoluteFill}
        />
      )}
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
});
