import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../theme';

type Props = { history: number[] };

const PAD_X = 6;
const PAD_TOP = 10;
const PAD_BOTTOM = 6;
// Cardinal-spline tension. Lower = gentler curves, higher = more wavy.
const SMOOTHING = 0.18;

export function NetWorthChart({ history }: Props) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) {
      setSize({ w: width, h: height });
    }
  };

  const geom = useMemo(
    () => (size ? buildGeometry(history, size.w, size.h) : null),
    [history, size],
  );

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {size && geom && (
        <Canvas style={{ width: size.w, height: size.h }}>
          {geom.zeroY !== null && (
            <Path
              path={geom.zeroBaseline}
              style="stroke"
              strokeWidth={1}
              color="rgba(245, 242, 234, 0.08)"
            />
          )}

          <Path path={geom.area}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, size.h)}
              colors={['rgba(91, 224, 160, 0.32)', 'rgba(91, 224, 160, 0.00)']}
            />
          </Path>

          {/* Soft halo behind the line */}
          <Path
            path={geom.line}
            style="stroke"
            strokeWidth={3}
            strokeJoin="round"
            strokeCap="round"
            color={colors.emerald}
            opacity={0.55}
          >
            <BlurMask blur={6} style="solid" />
          </Path>

          {/* Crisp line on top */}
          <Path
            path={geom.line}
            style="stroke"
            strokeWidth={1.75}
            strokeJoin="round"
            strokeCap="round"
            color={colors.emeraldBright}
          />

          {/* Glowing dot at latest point */}
          <Circle
            cx={geom.last.x}
            cy={geom.last.y}
            r={7}
            color={colors.emerald}
            opacity={0.55}
          >
            <BlurMask blur={6} style="solid" />
          </Circle>
          <Circle
            cx={geom.last.x}
            cy={geom.last.y}
            r={3}
            color={colors.emeraldBright}
          />
        </Canvas>
      )}
    </View>
  );
}

type Pt = { x: number; y: number };

function buildGeometry(history: number[], w: number, h: number) {
  const x0 = PAD_X;
  const x1 = w - PAD_X;
  const y0 = PAD_TOP;
  const y1 = h - PAD_BOTTOM;
  const innerW = Math.max(1, x1 - x0);
  const innerH = Math.max(1, y1 - y0);

  // Graceful early state: with 0 or 1 points, render a centered flat hint.
  const values =
    history.length === 0
      ? [0, 0]
      : history.length === 1
        ? [history[0], history[0]]
        : history;

  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }

  // If flat, pad the range so the curve sits centered (otherwise division blows up).
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.05);
    min -= pad;
    max += pad;
  }

  const range = max - min;
  const xForIdx = (i: number) =>
    values.length === 1 ? (x0 + x1) / 2 : x0 + (i / (values.length - 1)) * innerW;
  const yForVal = (v: number) => y1 - ((v - min) / range) * innerH;

  const pts: Pt[] = values.map((v, i) => ({ x: xForIdx(i), y: yForVal(v) }));

  const line = Skia.Path.Make();
  buildSmoothPath(line, pts);

  const area = Skia.Path.Make();
  buildSmoothPath(area, pts);
  area.lineTo(pts[pts.length - 1].x, y1);
  area.lineTo(pts[0].x, y1);
  area.close();

  // Faint zero baseline only when the range straddles zero.
  let zeroY: number | null = null;
  let zeroBaseline = Skia.Path.Make();
  if (min < 0 && max > 0) {
    zeroY = yForVal(0);
    zeroBaseline.moveTo(x0, zeroY);
    zeroBaseline.lineTo(x1, zeroY);
  }

  return { line, area, zeroBaseline, zeroY, last: pts[pts.length - 1] };
}

// Cardinal-spline-ish smooth path via cubic beziers, with endpoints duplicated
// so the tangents at the start/end remain well-defined.
function buildSmoothPath(path: ReturnType<typeof Skia.Path.Make>, pts: Pt[]) {
  if (pts.length === 0) return;
  if (pts.length === 1) {
    path.moveTo(pts[0].x, pts[0].y);
    return;
  }
  path.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) {
    path.lineTo(pts[1].x, pts[1].y);
    return;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) * SMOOTHING;
    const c1y = p1.y + (p2.y - p0.y) * SMOOTHING;
    const c2x = p2.x - (p3.x - p1.x) * SMOOTHING;
    const c2y = p2.y - (p3.y - p1.y) * SMOOTHING;
    path.cubicTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
