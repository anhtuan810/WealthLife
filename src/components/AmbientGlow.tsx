import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, motion } from '../theme';

/**
 * Subtle warm radial-ish glow at the top of the screen.
 * Breathes slowly — premium ambient motion, never distracting.
 */
export function AmbientGlow() {
  const intensity = useSharedValue(0.55);

  useEffect(() => {
    intensity.value = withRepeat(
      withTiming(0.95, { duration: motion.ambient, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [intensity]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: intensity.value }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.bg, colors.bgElev, colors.bg]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, glowStyle]}>
        <LinearGradient
          colors={[colors.accentGlow, 'rgba(217, 178, 106, 0.06)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View style={styles.vignette} pointerEvents="none">
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          locations={[0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -160,
    left: -80,
    right: -80,
    height: 520,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
  },
});
