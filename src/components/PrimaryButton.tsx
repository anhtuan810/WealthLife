import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing, typography } from '../theme';

type Props = {
  label: string;
  onPress?: () => void;
};

export function PrimaryButton({ label, onPress }: Props) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.5,
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 90, easing: Easing.out(Easing.quad) });
        glow.value = withTiming(1, { duration: 140 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
        glow.value = withTiming(0, { duration: 260 });
      }}
      onPress={() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onPress?.();
      }}
    >
      <Animated.View style={[styles.shadow, glowStyle]} />
      <Animated.View style={[styles.wrap, containerStyle]}>
        <LinearGradient
          colors={[colors.accentBright, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.inner}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.pill,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  inner: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.title,
    color: '#1A1206',
    fontSize: 17,
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  shadow: {
    position: 'absolute',
    top: 6,
    left: 18,
    right: 18,
    bottom: -10,
    borderRadius: radii.pill,
    backgroundColor: colors.accentGlow,
  },
});
