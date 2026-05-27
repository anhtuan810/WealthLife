import React, { useMemo, useState } from 'react';
import { Image, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Canvas,
  Group,
  Path,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { ART, hasArt } from '../../assets/art';
import type { EventCategory } from '../../types/events';
import { colors, radii } from '../../theme';

type Props = {
  assetKey?: string;
  category?: EventCategory;
  aspect?: number;
  rounded?: number;
};

const CATEGORY_TINT: Record<EventCategory, string> = {
  foundation: colors.accent,
  career: colors.capital,
  investing: colors.emerald,
  pressure: colors.pressure,
  opportunity: colors.accentBright,
};

export function ArtSlot({
  assetKey,
  category,
  aspect = 3 / 2,
  rounded = radii.lg,
}: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) {
      setSize({ w: width, h: height });
    }
  };

  const tint = category ? CATEGORY_TINT[category] : colors.accent;

  const glyph = useMemo(
    () => (size ? buildGlyph(category, size.w, size.h) : null),
    [category, size],
  );

  if (hasArt(assetKey)) {
    return (
      <View
        style={[styles.wrap, { aspectRatio: aspect, borderRadius: rounded }]}
      >
        <Image
          source={ART[assetKey!]}
          resizeMode="cover"
          style={styles.image}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, { aspectRatio: aspect, borderRadius: rounded }]}
      onLayout={onLayout}
    >
      <LinearGradient
        colors={[colors.bgElev, colors.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {size && glyph && (
        <Canvas style={{ width: size.w, height: size.h }}>
          <Group opacity={0.3}>
            <Rect x={0} y={0} width={size.w} height={size.h}>
              <RadialGradient
                c={vec(size.w / 2, size.h * 0.55)}
                r={Math.max(size.w, size.h) * 0.7}
                colors={[tint, 'transparent']}
              />
            </Rect>
          </Group>

          <Path
            path={glyph}
            style="stroke"
            strokeWidth={1.5}
            strokeJoin="round"
            strokeCap="round"
            color={tint}
            opacity={0.55}
          />
        </Canvas>
      )}
    </View>
  );
}

function buildGlyph(category: EventCategory | undefined, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const u = Math.min(w, h) * 0.16;
  const path = Skia.Path.Make();

  switch (category) {
    case 'career': {
      // Three ascending steps rising right.
      const stepW = u * 0.9;
      const stepH = u * 0.55;
      const x0 = cx - stepW * 1.5;
      const y0 = cy + stepH;
      path.moveTo(x0, y0);
      path.lineTo(x0 + stepW, y0);
      path.lineTo(x0 + stepW, y0 - stepH);
      path.lineTo(x0 + stepW * 2, y0 - stepH);
      path.lineTo(x0 + stepW * 2, y0 - stepH * 2);
      path.lineTo(x0 + stepW * 3, y0 - stepH * 2);
      return path;
    }
    case 'investing': {
      // Smooth upward curve — compounding.
      const x0 = cx - u * 1.6;
      const x1 = cx + u * 1.6;
      const y0 = cy + u * 0.7;
      const y1 = cy - u * 0.9;
      path.moveTo(x0, y0);
      path.cubicTo(cx - u * 0.4, y0, cx, y1 + u * 0.3, x1, y1);
      return path;
    }
    case 'pressure': {
      // Low cloud arc with a tight band of light beneath.
      const r = u * 0.9;
      path.moveTo(cx - r * 1.6, cy);
      path.cubicTo(cx - r * 1.6, cy - r, cx + r * 1.6, cy - r, cx + r * 1.6, cy);
      path.moveTo(cx - r * 1.2, cy + r * 0.65);
      path.lineTo(cx + r * 1.2, cy + r * 0.65);
      return path;
    }
    case 'opportunity': {
      // Narrow arched doorway.
      const halfW = u * 0.55;
      const top = cy - u * 1.1;
      const bottom = cy + u * 1.0;
      path.moveTo(cx - halfW, bottom);
      path.lineTo(cx - halfW, top + u * 0.5);
      path.cubicTo(
        cx - halfW,
        top,
        cx + halfW,
        top,
        cx + halfW,
        top + u * 0.5,
      );
      path.lineTo(cx + halfW, bottom);
      return path;
    }
    case 'foundation':
    default: {
      // A seed (small circle) resting on a low cornerstone line.
      const stoneHalf = u * 1.1;
      const stoneY = cy + u * 0.55;
      const seedR = u * 0.35;
      const seedY = stoneY - seedR - 2;
      const builder = Skia.PathBuilder.Make();
      builder.moveTo(cx - stoneHalf, stoneY);
      builder.lineTo(cx + stoneHalf, stoneY);
      builder.addCircle(cx, seedY, seedR);
      return builder.detach();
    }
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
