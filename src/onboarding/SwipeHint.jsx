import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/src/theme/tokens';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

function Chevron({ delay, reduced }) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      )
    );
  }, [delay, reduced, t]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.25 + t.value * 0.75,
    transform: [{ translateY: -t.value * 6 }],
  }));

  return (
    <Animated.View style={[styles.chevron, style]}>
      <Svg width={22} height={12} viewBox="0 0 22 12">
        <Path
          d="M2 10 L11 3 L20 10"
          stroke={colors.accent}
          strokeWidth={2.4}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Animated.View>
  );
}

export function SwipeHint() {
  const reduced = useReducedMotion();
  return (
    <View style={styles.wrap} accessibilityLabel="Swipe up">
      <Chevron delay={0} reduced={reduced} />
      <Chevron delay={160} reduced={reduced} />
      <Chevron delay={320} reduced={reduced} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chevron: {
    marginTop: -6,
  },
});
