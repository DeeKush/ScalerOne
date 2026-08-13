import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { radii } from '@/src/theme/tokens';
import { IdCardFront } from '@/src/onboarding/IdCardFront';
import { IdCardBack } from '@/src/onboarding/IdCardBack';

export function IdCard({ width, height, flip, data }) {
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
    <View style={[styles.shell, { width, height }]}>
      <Animated.View style={[styles.face, frontStyle]}>
        <IdCardFront data={data} />
      </Animated.View>
      <Animated.View style={[styles.face, styles.backFace, backStyle]}>
        <IdCardBack data={data} />
      </Animated.View>
    </View>
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
