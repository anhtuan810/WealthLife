import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ART, hasArt } from '../../assets/art';
import { motion } from '../../theme';

type Props = {
  assetKey?: string;
  visible?: boolean;
};

/**
 * Full-bleed hero art layer with legibility scrim. Renders nothing when the
 * asset isn't registered, so AmbientGlow shows through unchanged.
 */
export function HeroBackdrop({ assetKey, visible = true }: Props) {
  const v = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    v.value = withTiming(visible ? 1 : 0, {
      duration: motion.slow,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [visible, v]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: v.value }));

  if (!hasArt(assetKey)) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.clip, fadeStyle]}
    >
      {/* Anchored bottom-aligned so the subject (figure + skyline + sun,
          which sit in the lower-middle of the source) lands in the readable
          band of the screen instead of being darkened by the bottom scrim.
          height >100% pushes the top of the image off-screen; cover then
          fills the wider-than-image overflow on the sides. */}
      <Image
        source={ART[assetKey!]}
        resizeMode="cover"
        style={styles.image}
      />
      {/* Top readability scrim — seats the eyebrow + hero headline over
          bright art, fading out before the luminous midband so the image
          still reads as open and premium. */}
      <LinearGradient
        colors={[
          'rgba(8, 9, 11, 0.68)',
          'rgba(8, 9, 11, 0.32)',
          'transparent',
        ]}
        locations={[0, 0.22, 0.42]}
        style={StyleSheet.absoluteFill}
      />
      {/* Bottom scrim — protects the CTA + footnote. */}
      <LinearGradient
        colors={['transparent', 'rgba(8, 9, 11, 0.85)']}
        locations={[0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '120%',
  },
});
