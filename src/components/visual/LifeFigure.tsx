import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Path,
  RadialGradient,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { colors } from '../../theme';

export type LifePhase = 'foundation' | 'career' | 'growth' | 'freedom';
export type LifeDirection = 'corporate' | 'founder' | 'freelancer' | null;

export type LifeFigureProps = {
  phase?: LifePhase;
  direction?: LifeDirection;
  stress?: number; // 0–5
  freedomRatio?: number; // 0–1
  size?: number;
  // Optional, transient. When true the figure briefly reads as celebrating
  // (smile up, posture lifts, aura brightens). Crossing detection lives in
  // the dashboard — this prop is presentational and snaps back the moment the
  // caller clears it. Default false → exact pre-existing behavior.
  celebrate?: boolean;
};

// Pure presentational full-body stylized figure. All props are defended so any
// missing/invalid combo still renders the same valid base character. State
// affects three layers: aura (phase), outfit (direction), face + posture
// (stress + freedom). Mood is a continuous response curve — no discrete
// emotion states.

const PHASES: readonly LifePhase[] = [
  'foundation',
  'career',
  'growth',
  'freedom',
];
const DIRECTIONS: readonly Exclude<LifeDirection, null>[] = [
  'corporate',
  'founder',
  'freelancer',
];

const PHASE_AURA: Record<LifePhase, string> = {
  foundation: colors.capital, // cool dawn-blue
  career: colors.accent, // gold
  growth: colors.emerald, // emerald-tinged
  freedom: colors.accentBright, // bright warm gold bloom
};

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const safeNum = (n: unknown, f: number): number =>
  typeof n === 'number' && Number.isFinite(n) ? n : f;

// ────────────────────────────────────────────────────────────────────────────
// Outfit registry
// ────────────────────────────────────────────────────────────────────────────
// To add a new outfit later:
//   1. Write a renderer function (ctx: OutfitCtx) => React.ReactNode that
//      returns a small bundle of Skia shapes scaled by ctx.size.
//   2. Register it in OUTFITS under a new key.
//   3. Map a direction to it in DIRECTION_OUTFIT (or extend LifeDirection
//      to add a new value, then map).
// Outfits draw OVER the torso silhouette; arms, legs, head and face are
// drawn by the figure itself.

type OutfitCtx = {
  size: number;
  cx: number;
  shoulderY: number;
  shoulderHalf: number;
  waistY: number;
  waistHalf: number;
  hipY: number;
  hipHalf: number;
  neckBottomY: number;
};

type OutfitRenderer = (ctx: OutfitCtx) => React.ReactNode;

type OutfitKey = 'casual' | 'corporate' | 'founder' | 'freelancer';

const OUTFITS: Record<OutfitKey, OutfitRenderer> = {
  casual: renderCasual,
  corporate: renderCorporate,
  founder: renderFounder,
  freelancer: renderFreelancer,
};

const DIRECTION_OUTFIT: Record<Exclude<LifeDirection, null>, OutfitKey> = {
  corporate: 'corporate',
  founder: 'founder',
  freelancer: 'freelancer',
};

const outfitFor = (direction: LifeDirection): OutfitRenderer =>
  direction ? OUTFITS[DIRECTION_OUTFIT[direction]] : OUTFITS.casual;

// Re-usable torso outline (shoulders → waist → hip) with a parametric neck
// dip. Outfits use this as their base shape.
function torsoOutline(
  ctx: OutfitCtx,
  opts: { neckDip?: number; vTipY?: number } = {},
) {
  const { size, cx, shoulderY, shoulderHalf, waistY, waistHalf, hipY, hipHalf, neckBottomY } = ctx;
  const neckDip = opts.neckDip ?? 0.025;
  const neckY = neckBottomY + size * neckDip;
  const p = Skia.Path.Make();
  p.moveTo(cx - shoulderHalf, shoulderY);
  if (opts.vTipY != null) {
    // V neckline: down to a tip then back up to the right shoulder.
    p.lineTo(cx - size * 0.012, opts.vTipY);
    p.lineTo(cx + size * 0.012, opts.vTipY);
    p.lineTo(cx + shoulderHalf, shoulderY);
  } else {
    // Rounded neckline dip.
    p.quadTo(cx - shoulderHalf * 0.4, neckY, cx, neckY);
    p.quadTo(cx + shoulderHalf * 0.4, neckY, cx + shoulderHalf, shoulderY);
  }
  p.quadTo(cx + waistHalf * 1.06, waistY, cx + hipHalf, hipY);
  p.lineTo(cx - hipHalf, hipY);
  p.quadTo(cx - waistHalf * 1.06, waistY, cx - shoulderHalf, shoulderY);
  p.close();
  return p;
}

function renderCasual(ctx: OutfitCtx): React.ReactNode {
  const { size, cx, shoulderHalf, neckBottomY } = ctx;
  // Soft cream tee: a warm-tinted wash over the off-white body silhouette,
  // not a dark fill. The body still reads as a clean off-white person; the
  // tee adds a hint of fabric. A thin neckline crease anchors the collar so
  // the garment reads even at small sizes.
  const tee = torsoOutline(ctx, { neckDip: 0.045 });

  const crease = Skia.Path.Make();
  const creaseHalfW = shoulderHalf * 0.42;
  const creaseY = neckBottomY + size * 0.05;
  const creaseEndY = neckBottomY + size * 0.012;
  crease.moveTo(cx - creaseHalfW, creaseEndY);
  crease.quadTo(cx, creaseY, cx + creaseHalfW, creaseEndY);

  return (
    <React.Fragment key="casual">
      <Path path={tee} style="fill" color={colors.accent} opacity={0.18} />
      <Path
        path={crease}
        style="stroke"
        strokeWidth={1}
        strokeCap="round"
        color={colors.border}
        opacity={0.5}
      />
    </React.Fragment>
  );
}

function renderCorporate(ctx: OutfitCtx): React.ReactNode {
  const { size, cx, hipY, neckBottomY } = ctx;
  // Suit jacket with a shallow V.
  const vTipY = neckBottomY + size * 0.075;
  const jacket = torsoOutline(ctx, { vTipY });

  // White shirt triangle filling the V.
  const shirt = Skia.Path.Make();
  shirt.moveTo(cx - size * 0.045, neckBottomY + size * 0.012);
  shirt.lineTo(cx, vTipY + size * 0.012);
  shirt.lineTo(cx + size * 0.045, neckBottomY + size * 0.012);
  shirt.close();

  // Gold tie hanging down to mid-torso.
  const tieTopY = vTipY + size * 0.005;
  const tieBotY = (vTipY + hipY) / 2 + size * 0.02;
  const topHalf = size * 0.012;
  const botHalf = size * 0.018;
  const tie = Skia.Path.Make();
  tie.moveTo(cx - topHalf, tieTopY);
  tie.lineTo(cx + topHalf, tieTopY);
  tie.lineTo(cx + botHalf, tieBotY);
  tie.lineTo(cx, tieBotY + size * 0.018);
  tie.lineTo(cx - botHalf, tieBotY);
  tie.close();

  return (
    <React.Fragment key="corporate">
      <Path path={jacket} style="fill" color={colors.surfaceElev} opacity={1} />
      <Path path={shirt} style="fill" color={colors.textPrimary} opacity={0.92} />
      <Path path={tie} style="fill" color={colors.accent} opacity={0.96} />
    </React.Fragment>
  );
}

function renderFounder(ctx: OutfitCtx): React.ReactNode {
  const { size, neckBottomY } = ctx;
  // Tee underneath — capital-soft tint reads as a casual shirt.
  const tee = torsoOutline(ctx, { neckDip: 0.045 });
  // Blazer over it: same outline but with a deep V revealing the tee.
  const vTipY = neckBottomY + size * 0.16;
  const blazer = torsoOutline(ctx, { vTipY });

  return (
    <React.Fragment key="founder">
      <Path path={tee} style="fill" color={colors.capitalSoft} opacity={1} />
      <Path path={blazer} style="fill" color={colors.border} opacity={0.96} />
    </React.Fragment>
  );
}

function renderFreelancer(ctx: OutfitCtx): React.ReactNode {
  const { size, cx, shoulderY, shoulderHalf, neckBottomY, waistY } = ctx;
  // Hoodie: slightly wider and looser than the base shoulders.
  const hoodieCtx: OutfitCtx = {
    ...ctx,
    shoulderHalf: shoulderHalf * 1.05,
  };
  const hoodie = torsoOutline(hoodieCtx, { neckDip: 0.06 });

  // Soft "hood" lump behind the neck, just rising above the shoulder line.
  const hood = Skia.Path.Make();
  const hoodHalf = shoulderHalf * 0.55;
  const hoodTopY = neckBottomY - size * 0.005;
  hood.moveTo(cx - hoodHalf, shoulderY + size * 0.012);
  hood.quadTo(cx, hoodTopY - size * 0.008, cx + hoodHalf, shoulderY + size * 0.012);
  hood.quadTo(cx, hoodTopY + size * 0.022, cx - hoodHalf, shoulderY + size * 0.012);
  hood.close();

  // Drawstrings hanging down from the neckline.
  const stringTopY = neckBottomY + size * 0.07;
  const stringBotY = stringTopY + size * 0.11;
  const strings = Skia.Path.Make();
  strings.moveTo(cx - size * 0.018, stringTopY);
  strings.lineTo(cx - size * 0.022, stringBotY);
  strings.moveTo(cx + size * 0.018, stringTopY);
  strings.lineTo(cx + size * 0.022, stringBotY);

  // Subtle kangaroo-pocket seam at the waist.
  const pocket = Skia.Path.Make();
  pocket.moveTo(cx - size * 0.075, waistY + size * 0.01);
  pocket.lineTo(cx + size * 0.075, waistY + size * 0.01);

  return (
    <React.Fragment key="freelancer">
      <Path path={hood} style="fill" color={colors.border} opacity={0.92} />
      <Path path={hoodie} style="fill" color={colors.surfaceElev} opacity={0.98} />
      <Path
        path={pocket}
        style="stroke"
        strokeWidth={1}
        color={colors.border}
        opacity={0.7}
      />
      <Path
        path={strings}
        style="stroke"
        strokeWidth={1.4}
        strokeCap="round"
        color={colors.capital}
        opacity={0.75}
      />
    </React.Fragment>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────

export function LifeFigure({
  phase,
  direction,
  stress,
  freedomRatio,
  size = 240,
  celebrate = false,
}: LifeFigureProps) {
  const safeSize = Math.max(48, safeNum(size, 240));
  const safePhase: LifePhase = PHASES.includes(phase as LifePhase)
    ? (phase as LifePhase)
    : 'foundation';
  const safeDirection: LifeDirection =
    direction && DIRECTIONS.includes(direction as Exclude<LifeDirection, null>)
      ? direction
      : null;
  const safeStress = clamp(safeNum(stress, 0), 0, 5);
  const safeFreedom = clamp(safeNum(freedomRatio, 0), 0, 1);
  const safeCelebrate = celebrate === true;

  // 0 calm → 1 maxed. Drives posture, aura dimming, face tension.
  let tension = safeStress / 5;
  // mood 0 sad → 1 happy. Low stress + high freedom → happiest. Continuous,
  // so stress 3.5 and 4 produce distinguishable faces.
  let mood = clamp((1 - tension) * 0.7 + safeFreedom * 0.3, 0, 1);
  if (safeCelebrate) {
    // Transient milestone beat: dampen tension so shoulders lift + aura
    // brightens, and bias mood upward so the mouth curve reads as a smile.
    // The caller clears the flag after a second or two and the figure returns
    // to its normal stress/freedom-driven expression.
    tension = tension * 0.35;
    mood = clamp(mood + 0.5, 0, 1);
  }
  const moodSigned = mood * 2 - 1; // -1 frown → +1 smile

  const cx = safeSize / 2;
  const cy = safeSize / 2;

  // ── Body anchors (all proportional, so the figure stays inscribed at
  //    every size and inside the halo at every prop combo) ──
  const headRadius = safeSize * 0.105;
  const headCy = safeSize * 0.19;
  const neckBottomY = safeSize * 0.285;

  const baseShoulderHalf = safeSize * 0.19;
  // Direction tweaks the silhouette breadth.
  const directionSpread =
    safeDirection === 'corporate'
      ? 1.12
      : safeDirection === 'freelancer'
        ? 0.94
        : safeDirection === 'founder'
          ? 1.0
          : 0.97;
  // Stress narrows the shoulders (drawing inward).
  const shoulderHalf = baseShoulderHalf * directionSpread * (1 - tension * 0.10);
  const shoulderY = safeSize * 0.32 + tension * safeSize * 0.008;

  const waistY = safeSize * 0.52;
  const waistHalf = safeSize * 0.14;
  const hipY = safeSize * 0.58;
  const hipHalf = safeSize * 0.16;

  const armOffsetX = safeSize * 0.165;
  const wristOffsetX = safeSize * 0.18;
  const armTopY = shoulderY + safeSize * 0.018;
  const wristY = safeSize * 0.6;
  const armStrokeW = safeSize * 0.05;

  const legOffsetXHip = safeSize * 0.075;
  const legOffsetXAnkle = safeSize * 0.085;
  const ankleY = safeSize * 0.92;
  const legStrokeW = safeSize * 0.085;

  // ── Aura / halo ──
  const auraColor = PHASE_AURA[safePhase];
  const auraOpacity = 0.55 - tension * 0.28;
  const auraRadius = safeSize * (0.5 - tension * 0.03);

  const haloRadius = safeSize * 0.46;
  const haloGuide = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, haloRadius);
    return p;
  }, [cx, cy, haloRadius]);

  const haloArc = useMemo(() => {
    const p = Skia.Path.Make();
    if (safeFreedom <= 0) return p;
    const rect = Skia.XYWHRect(
      cx - haloRadius,
      cy - haloRadius,
      haloRadius * 2,
      haloRadius * 2,
    );
    p.addArc(rect, -90, safeFreedom * 360);
    return p;
  }, [cx, cy, haloRadius, safeFreedom]);

  // ── Body paths ──
  const torsoPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - shoulderHalf, shoulderY);
    p.quadTo(
      cx - shoulderHalf * 0.45,
      shoulderY - safeSize * 0.015,
      cx - safeSize * 0.06,
      neckBottomY,
    );
    p.lineTo(cx + safeSize * 0.06, neckBottomY);
    p.quadTo(
      cx + shoulderHalf * 0.45,
      shoulderY - safeSize * 0.015,
      cx + shoulderHalf,
      shoulderY,
    );
    p.quadTo(cx + waistHalf * 1.06, waistY, cx + hipHalf, hipY);
    p.lineTo(cx - hipHalf, hipY);
    p.quadTo(cx - waistHalf * 1.06, waistY, cx - shoulderHalf, shoulderY);
    p.close();
    return p;
  }, [cx, shoulderHalf, shoulderY, neckBottomY, waistHalf, waistY, hipHalf, hipY, safeSize]);

  const leftArm = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - armOffsetX, armTopY);
    p.lineTo(cx - wristOffsetX, wristY);
    return p;
  }, [cx, armOffsetX, wristOffsetX, armTopY, wristY]);

  const rightArm = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx + armOffsetX, armTopY);
    p.lineTo(cx + wristOffsetX, wristY);
    return p;
  }, [cx, armOffsetX, wristOffsetX, armTopY, wristY]);

  const leftLeg = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - legOffsetXHip, hipY);
    p.lineTo(cx - legOffsetXAnkle, ankleY);
    return p;
  }, [cx, legOffsetXHip, legOffsetXAnkle, hipY, ankleY]);

  const rightLeg = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx + legOffsetXHip, hipY);
    p.lineTo(cx + legOffsetXAnkle, ankleY);
    return p;
  }, [cx, legOffsetXHip, legOffsetXAnkle, hipY, ankleY]);

  // ── Outfit ──
  const outfitCtx: OutfitCtx = {
    size: safeSize,
    cx,
    shoulderY,
    shoulderHalf,
    waistY,
    waistHalf,
    hipY,
    hipHalf,
    neckBottomY,
  };
  const renderOutfit = outfitFor(safeDirection);

  // ── Face: continuous parametric features driven by `mood` and `tension`.
  //    All coordinates inside the head circle so the face always reads. ──
  const eyeY = headCy - headRadius * 0.08;
  const eyeOffsetX = headRadius * 0.38;
  const eyeHalfW = headRadius * 0.16;
  // Eye height shrinks under stress (narrowed/tired) but never disappears.
  const eyeHalfH = headRadius * (0.16 - tension * 0.115);

  const leftEye = useMemo(() => {
    const p = Skia.Path.Make();
    p.addOval(
      Skia.XYWHRect(
        cx - eyeOffsetX - eyeHalfW,
        eyeY - eyeHalfH,
        eyeHalfW * 2,
        eyeHalfH * 2,
      ),
    );
    return p;
  }, [cx, eyeOffsetX, eyeY, eyeHalfW, eyeHalfH]);
  const rightEye = useMemo(() => {
    const p = Skia.Path.Make();
    p.addOval(
      Skia.XYWHRect(
        cx + eyeOffsetX - eyeHalfW,
        eyeY - eyeHalfH,
        eyeHalfW * 2,
        eyeHalfH * 2,
      ),
    );
    return p;
  }, [cx, eyeOffsetX, eyeY, eyeHalfW, eyeHalfH]);

  // Eyebrows: gentle upward arch when calm (relaxed/content read), inner ends
  // sink toward the bridge of the nose as tension rises (furrowed). Both
  // brows are constructed as mirror images across x = cx at every tension,
  // so there's no asymmetric "raised outer corner" that would read as a
  // smirk against a neutral mouth.
  const browBaseY = eyeY - headRadius * 0.32;
  const browHalfLen = headRadius * 0.22;
  const browArch = (1 - tension) * headRadius * 0.06;
  const browInnerDrop = tension * headRadius * 0.18;
  const leftBrow = useMemo(() => {
    const p = Skia.Path.Make();
    // outer end (further from centre) → arched control point → inner end.
    p.moveTo(cx - eyeOffsetX - browHalfLen, browBaseY);
    p.quadTo(
      cx - eyeOffsetX,
      browBaseY - browArch + browInnerDrop * 0.3,
      cx - eyeOffsetX + browHalfLen,
      browBaseY + browInnerDrop,
    );
    return p;
  }, [cx, eyeOffsetX, browHalfLen, browBaseY, browArch, browInnerDrop]);
  const rightBrow = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx + eyeOffsetX + browHalfLen, browBaseY);
    p.quadTo(
      cx + eyeOffsetX,
      browBaseY - browArch + browInnerDrop * 0.3,
      cx + eyeOffsetX - browHalfLen,
      browBaseY + browInnerDrop,
    );
    return p;
  }, [cx, eyeOffsetX, browHalfLen, browBaseY, browArch, browInnerDrop]);

  // Mouth: quadratic curve whose control-Y maps directly to mood. Smooth
  // smile → flat → frown as mood drops.
  const mouthY = headCy + headRadius * 0.45;
  const mouthHalfW = headRadius * 0.26;
  const mouthCurve = moodSigned * headRadius * 0.24;
  const mouth = useMemo(() => {
    const p = Skia.Path.Make();
    p.moveTo(cx - mouthHalfW, mouthY);
    p.quadTo(cx, mouthY + mouthCurve, cx + mouthHalfW, mouthY);
    return p;
  }, [cx, mouthHalfW, mouthY, mouthCurve]);

  // ── Misc visual ──
  const figureOpacity = 0.94;
  const tenseEdgeOpacity = tension * 0.55;
  const tenseEdgeR = auraRadius * 0.85;

  return (
    <View style={[styles.wrap, { width: safeSize, height: safeSize }]}>
      <Canvas style={{ width: safeSize, height: safeSize }}>
        {/* Phase aura: soft radial bloom. */}
        <Rect x={0} y={0} width={safeSize} height={safeSize} opacity={auraOpacity}>
          <RadialGradient
            c={vec(cx, cy)}
            r={auraRadius}
            colors={[auraColor, 'transparent']}
          />
        </Rect>

        {/* Warm tense edge — fades in at high stress. */}
        {tenseEdgeOpacity > 0.02 && (
          <Circle
            cx={cx}
            cy={cy}
            r={tenseEdgeR}
            style="stroke"
            strokeWidth={1}
            color={colors.pressure}
            opacity={tenseEdgeOpacity}
          />
        )}

        {/* Freedom halo: faint full guide + filled progress arc. */}
        <Path
          path={haloGuide}
          style="stroke"
          strokeWidth={1}
          color={colors.textFaint}
          opacity={0.5}
        />
        {safeFreedom > 0 && (
          <Path
            path={haloArc}
            style="stroke"
            strokeWidth={2.5}
            strokeCap="round"
            color={auraColor}
            opacity={0.9}
          />
        )}

        {/* Body: limbs first (back), then torso (covers their attachments). */}
        <Path
          path={leftArm}
          style="stroke"
          strokeWidth={armStrokeW}
          strokeCap="round"
          color={colors.textPrimary}
          opacity={figureOpacity}
        />
        <Path
          path={rightArm}
          style="stroke"
          strokeWidth={armStrokeW}
          strokeCap="round"
          color={colors.textPrimary}
          opacity={figureOpacity}
        />
        <Path
          path={leftLeg}
          style="stroke"
          strokeWidth={legStrokeW}
          strokeCap="round"
          color={colors.textPrimary}
          opacity={figureOpacity}
        />
        <Path
          path={rightLeg}
          style="stroke"
          strokeWidth={legStrokeW}
          strokeCap="round"
          color={colors.textPrimary}
          opacity={figureOpacity}
        />
        <Path
          path={torsoPath}
          style="fill"
          color={colors.textPrimary}
          opacity={figureOpacity}
        />

        {/* Outfit over torso. */}
        {renderOutfit(outfitCtx)}

        {/* Head + face. */}
        <Circle
          cx={cx}
          cy={headCy}
          r={headRadius}
          color={colors.textPrimary}
          opacity={figureOpacity}
        />
        <Path
          path={leftBrow}
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          color={colors.bg}
          opacity={0.88}
        />
        <Path
          path={rightBrow}
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          color={colors.bg}
          opacity={0.88}
        />
        <Path path={leftEye} style="fill" color={colors.bg} opacity={0.95} />
        <Path path={rightEye} style="fill" color={colors.bg} opacity={0.95} />
        <Path
          path={mouth}
          style="stroke"
          strokeWidth={1.6}
          strokeCap="round"
          color={colors.bg}
          opacity={0.9}
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
