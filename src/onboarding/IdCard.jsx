import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { radii } from '@/src/theme/tokens';
import { IdCardFront } from '@/src/onboarding/IdCardFront';
import { IdCardBack } from '@/src/onboarding/IdCardBack';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

export function IdCard({ width, height, flip, data, motionDamp }) {
  const reduced = useReducedMotion();
  const float = useSharedValue(0.5);

  useEffect(() => {
    if (reduced) return;
    float.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [reduced, float]);

  const bobStyle = useAnimatedStyle(() => {
    const damp = motionDamp ? motionDamp.value : 1;
    const y = interpolate(float.value, [0, 1], [-6, 6]) * damp;
    const rot = interpolate(float.value, [0, 1], [-0.6, 0.6]) * damp;
    return {
      transform: [{ translateY: y }, { rotateZ: `${rot}deg` }],
    };
  });

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ width, height }, bobStyle]}>
      <View style={[styles.shell, { width, height }]}>
        <Animated.View style={[styles.face, frontStyle]}>
          <IdCardFront data={data} />
        </Animated.View>
        <Animated.View style={[styles.face, styles.backFace, backStyle]}>
          <IdCardBack data={data} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.card,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
    borderRadius: radii.card,
    overflow: 'hidden',
    shadowColor: '#0B1220',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    backgroundColor: '#FFFFFF',
  },
  backFace: {
    zIndex: 1,
  },
});
