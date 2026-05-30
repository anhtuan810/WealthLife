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
  | 'clock'
  | 'mortarboard'
  | 'sprout'
  | 'columns'
  | 'mountain'
  | 'book'
  | 'compass'
  | 'briefcase';

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
      case 'mortarboard': {
        // Flat parallelogram board on top + small cap dome + tassel with bead.
        // Reads as a graduation cap — used for the University start point.
        const board = Skia.Path.Make();
        board.moveTo(8 * s, 3 * s);
        board.lineTo(14.5 * s, 6 * s);
        board.lineTo(8 * s, 9 * s);
        board.lineTo(1.5 * s, 6 * s);
        board.close();
        const cap = Skia.Path.Make();
        cap.moveTo(5 * s, 7.5 * s);
        cap.quadTo(8 * s, 11.5 * s, 11 * s, 7.5 * s);
        const tassel = Skia.Path.Make();
        tassel.moveTo(12.5 * s, 6.8 * s);
        tassel.lineTo(12.5 * s, 12 * s);
        return (
          <>
            <Path path={board} style="stroke" strokeWidth={stroke} strokeJoin="round" color={color} />
            <Path path={cap} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
            <Path path={tassel} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
            <Circle cx={12.5 * s} cy={12.8 * s} r={1.1 * s} color={color} />
          </>
        );
      }
      case 'sprout': {
        // Central stem with two arched leaves — early-career "just out of the
        // gate" symbol for the Early Career start point.
        const stem = Skia.Path.Make();
        stem.moveTo(8 * s, 14 * s);
        stem.lineTo(8 * s, 8 * s);
        const leafL = Skia.Path.Make();
        leafL.moveTo(8 * s, 9 * s);
        leafL.quadTo(2.5 * s, 6.5 * s, 4.5 * s, 3.5 * s);
        leafL.quadTo(7.5 * s, 5.5 * s, 8 * s, 8 * s);
        leafL.close();
        const leafR = Skia.Path.Make();
        leafR.moveTo(8 * s, 8 * s);
        leafR.quadTo(8.5 * s, 5.5 * s, 11.5 * s, 3.5 * s);
        leafR.quadTo(13.5 * s, 6.5 * s, 8 * s, 9 * s);
        leafR.close();
        return (
          <>
            <Path path={leafL} style="fill" color={color} opacity={0.85} />
            <Path path={leafR} style="fill" color={color} opacity={0.85} />
            <Path path={stem} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
          </>
        );
      }
      case 'columns': {
        // Greek-temple silhouette — three columns under a cap, on a base.
        // "Habits and salary already shaping the curve" for Established.
        const top = Skia.Path.Make();
        top.moveTo(1.5 * s, 4 * s);
        top.lineTo(14.5 * s, 4 * s);
        const base = Skia.Path.Make();
        base.moveTo(1.5 * s, 13 * s);
        base.lineTo(14.5 * s, 13 * s);
        const cols = Skia.Path.Make();
        cols.moveTo(4.5 * s, 5 * s);
        cols.lineTo(4.5 * s, 12 * s);
        cols.moveTo(8 * s, 5 * s);
        cols.lineTo(8 * s, 12 * s);
        cols.moveTo(11.5 * s, 5 * s);
        cols.lineTo(11.5 * s, 12 * s);
        return (
          <>
            <Path path={top} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
            <Path path={base} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
            <Path path={cols} style="stroke" strokeWidth={stroke * 0.9} strokeCap="round" color={color} />
          </>
        );
      }
      case 'mountain': {
        // Triangular peak with a small snow notch near the summit.
        // "Halfway in, runway is shorter, lever arm longer" for Mid-life.
        const peak = Skia.Path.Make();
        peak.moveTo(1.5 * s, 13.5 * s);
        peak.lineTo(8 * s, 2.5 * s);
        peak.lineTo(14.5 * s, 13.5 * s);
        peak.close();
        const snow = Skia.Path.Make();
        snow.moveTo(5.6 * s, 7.5 * s);
        snow.lineTo(8 * s, 3.5 * s);
        snow.lineTo(10.4 * s, 7.5 * s);
        snow.close();
        return (
          <>
            <Path path={peak} style="stroke" strokeWidth={stroke} strokeJoin="round" color={color} />
            <Path path={snow} style="fill" color={color} opacity={0.75} />
          </>
        );
      }
      case 'book': {
        // Open book seen face-on — two pages meeting at a central spine.
        // "Bet four years and real debt on a higher ceiling" for University.
        const pages = Skia.Path.Make();
        pages.moveTo(2 * s, 5 * s);
        pages.lineTo(8 * s, 4 * s);
        pages.lineTo(14 * s, 5 * s);
        pages.lineTo(14 * s, 12.5 * s);
        pages.lineTo(8 * s, 13.5 * s);
        pages.lineTo(2 * s, 12.5 * s);
        pages.close();
        const spine = Skia.Path.Make();
        spine.moveTo(8 * s, 4 * s);
        spine.lineTo(8 * s, 13.5 * s);
        return (
          <>
            <Path path={pages} style="stroke" strokeWidth={stroke} strokeJoin="round" color={color} />
            <Path path={spine} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
          </>
        );
      }
      case 'compass': {
        // Outer circle + N-S needle (diamond) with the north half filled.
        // "Skip the system and outlearn it on your own terms" for Self-Taught.
        const northHalf = Skia.Path.Make();
        northHalf.moveTo(8 * s, 3 * s);
        northHalf.lineTo(10 * s, 8 * s);
        northHalf.lineTo(6 * s, 8 * s);
        northHalf.close();
        const southHalf = Skia.Path.Make();
        southHalf.moveTo(6 * s, 8 * s);
        southHalf.lineTo(10 * s, 8 * s);
        southHalf.lineTo(8 * s, 13 * s);
        southHalf.close();
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
            <Path path={northHalf} style="fill" color={color} />
            <Path path={southHalf} style="stroke" strokeWidth={stroke * 0.85} strokeJoin="round" color={color} />
          </>
        );
      }
      case 'briefcase': {
        // Body rectangle with a small handle arch on top + a clasp notch.
        // "Trade the long game for a paycheck and independence today" —
        // Straight to Work.
        const body = Skia.Path.Make();
        body.moveTo(2.5 * s, 6.5 * s);
        body.lineTo(13.5 * s, 6.5 * s);
        body.lineTo(13.5 * s, 13 * s);
        body.lineTo(2.5 * s, 13 * s);
        body.close();
        const handle = Skia.Path.Make();
        handle.moveTo(6 * s, 6.5 * s);
        handle.lineTo(6 * s, 4 * s);
        handle.lineTo(10 * s, 4 * s);
        handle.lineTo(10 * s, 6.5 * s);
        const clasp = Skia.Path.Make();
        clasp.moveTo(7 * s, 9.5 * s);
        clasp.lineTo(9 * s, 9.5 * s);
        return (
          <>
            <Path path={handle} style="stroke" strokeWidth={stroke} strokeJoin="round" color={color} />
            <Path path={body} style="stroke" strokeWidth={stroke} strokeJoin="round" color={color} />
            <Path path={clasp} style="stroke" strokeWidth={stroke} strokeCap="round" color={color} />
          </>
        );
      }
    }
  }, [name, s, stroke, color]);

  return (
    <Canvas style={{ width: size, height: size }}>{content}</Canvas>
  );
}
