import React, { useMemo } from 'react';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../theme';

export type StatGlyphName =
  | 'wrench'
  | 'network'
  | 'star'
  | 'target'
  | 'bolt'
  | 'trendingUp'
  | 'clock';

type Props = {
  name: StatGlyphName;
  size?: number;
  color?: string;
};

// Monoline 16-grid icons. Drawn in Skia so they share the figure's render
// pipeline — no extra dependency for a one-off icon set.
export function StatGlyph({ name, size = 16, color = colors.accent }: Props) {
  const s = size / 16;

  const stroke = Math.max(1.25, size * 0.1);

  const content = useMemo(() => {
    switch (name) {
      case 'wrench': {
        // Open-end jaw at top-left, handle running to bottom-right.
        const jaw = Skia.Path.Make();
        jaw.moveTo(6 * s, 2.5 * s);
        jaw.lineTo(2.5 * s, 6 * s);
        jaw.lineTo(6 * s, 9.5 * s);
        const handle = Skia.Path.Make();
        handle.moveTo(6 * s, 9.5 * s);
        handle.lineTo(13.5 * s, 13.5 * s);
        return (
          <>
            <Path
              path={jaw}
              style="stroke"
              strokeWidth={stroke}
              strokeJoin="round"
              strokeCap="round"
              color={color}
            />
            <Path
              path={handle}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={color}
            />
          </>
        );
      }
      case 'network': {
        // Three nodes in a Y; the upper node feeds two lower nodes.
        const lines = Skia.Path.Make();
        lines.moveTo(8 * s, 4 * s);
        lines.lineTo(3.5 * s, 12.5 * s);
        lines.moveTo(8 * s, 4 * s);
        lines.lineTo(12.5 * s, 12.5 * s);
        return (
          <>
            <Path
              path={lines}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={color}
            />
            <Circle cx={8 * s} cy={4 * s} r={1.7 * s} color={color} />
            <Circle cx={3.5 * s} cy={12.5 * s} r={1.7 * s} color={color} />
            <Circle cx={12.5 * s} cy={12.5 * s} r={1.7 * s} color={color} />
          </>
        );
      }
      case 'star': {
        // 5-point star, outer r=6 inner r=2.6, centered (8, 8).
        const cx = 8 * s;
        const cy = 8.2 * s;
        const outer = 6.2 * s;
        const inner = 2.7 * s;
        const p = Skia.Path.Make();
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) p.moveTo(x, y);
          else p.lineTo(x, y);
        }
        p.close();
        return (
          <Path
            path={p}
            style="stroke"
            strokeWidth={stroke}
            strokeJoin="round"
            color={color}
          />
        );
      }
      case 'target': {
        // Concentric rings + center pip.
        return (
          <>
            <Circle
              cx={8 * s}
              cy={8 * s}
              r={6 * s}
              style="stroke"
              strokeWidth={stroke}
              color={color}
            />
            <Circle
              cx={8 * s}
              cy={8 * s}
              r={3 * s}
              style="stroke"
              strokeWidth={stroke}
              color={color}
            />
            <Circle cx={8 * s} cy={8 * s} r={1 * s} color={color} />
          </>
        );
      }
      case 'bolt': {
        // Lightning Z — filled for visual mass at small sizes.
        const p = Skia.Path.Make();
        p.moveTo(9.5 * s, 2 * s);
        p.lineTo(3.5 * s, 9 * s);
        p.lineTo(7.5 * s, 9 * s);
        p.lineTo(5 * s, 14 * s);
        p.lineTo(12.5 * s, 7 * s);
        p.lineTo(8.5 * s, 7 * s);
        p.lineTo(11 * s, 2 * s);
        p.close();
        return <Path path={p} style="fill" color={color} />;
      }
      case 'trendingUp': {
        // Diagonal line up-right with a small arrowhead at the tip.
        const line = Skia.Path.Make();
        line.moveTo(2.5 * s, 13.5 * s);
        line.lineTo(13.5 * s, 3.5 * s);
        const head = Skia.Path.Make();
        head.moveTo(8.5 * s, 3.5 * s);
        head.lineTo(13.5 * s, 3.5 * s);
        head.lineTo(13.5 * s, 8.5 * s);
        return (
          <>
            <Path
              path={line}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={color}
            />
            <Path
              path={head}
              style="stroke"
              strokeWidth={stroke}
              strokeJoin="round"
              strokeCap="round"
              color={color}
            />
          </>
        );
      }
      case 'clock': {
        // Outline circle + two hands meeting at center. Minute hand straight
        // up, hour hand pointing to the 4 — distinct silhouette from `target`
        // (no inner ring) and from `star` (no points).
        const hands = Skia.Path.Make();
        hands.moveTo(8 * s, 8 * s);
        hands.lineTo(8 * s, 4 * s);
        hands.moveTo(8 * s, 8 * s);
        hands.lineTo(10.6 * s, 10.6 * s);
        return (
          <>
            <Circle
              cx={8 * s}
              cy={8 * s}
              r={6 * s}
              style="stroke"
              strokeWidth={stroke}
              color={color}
            />
            <Path
              path={hands}
              style="stroke"
              strokeWidth={stroke}
              strokeCap="round"
              color={color}
            />
          </>
        );
      }
    }
  }, [name, s, stroke, color]);

  return (
    <Canvas style={{ width: size, height: size }}>{content}</Canvas>
  );
}
