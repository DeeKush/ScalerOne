import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import Svg, { Ellipse } from 'react-native-svg';
import { colors } from '@/src/theme/tokens';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

function DriftingBlob({ size, cx, cy, opacity, style }) {
  return (
    <Animated.View style={[styles.blobWrap, { width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Ellipse
          cx={size * cx}
          cy={size * cy}
          rx={size * 0.48}
          ry={size * 0.38}
          fill={colors.accent}
          opacity={opacity}
        />
      </Svg>
    </Animated.View>
  );
}

export function AmbientBackground() {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const a = useSharedValue(0);
  const b = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    a.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    b.value = withRepeat(
      withTiming(0, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduced, a, b]);

  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: a.value * 36 - 18 },
      { translateY: a.value * 28 - 14 },
    ],
  }));

  const blobB = useAnimatedStyle(() => ({
    transform: [
      { translateX: b.value * -40 + 20 },
      { translateY: b.value * 32 - 16 },
    ],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.bgWash, colors.bg]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <DriftingBlob
        size={width * 0.92}
        cx={0.42}
        cy={0.48}
        opacity={0.14}
        style={[blobA, { top: height * 0.02, left: -width * 0.22 }]}
      />
      <DriftingBlob
        size={width * 0.84}
        cx={0.55}
        cy={0.52}
        opacity={0.1}
        style={[blobB, { bottom: height * 0.08, right: -width * 0.24 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blobWrap: {
    position: 'absolute',
  },
});
