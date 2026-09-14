import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const SPRING = { damping: 16, stiffness: 170 };

export function usePressAnimation(pressedScale = 0.98, glow = false) {
  const scale = useSharedValue(1);
  const glowOp = useSharedValue(0.28);

  const animatedStyle = useAnimatedStyle(() => {
    if (!glow) {
      return { transform: [{ scale: scale.value }] };
    }
    return {
      transform: [{ scale: scale.value }],
      shadowOpacity: glowOp.value,
    };
  });

  const onPressIn = useCallback(() => {
    scale.value = withSpring(pressedScale, SPRING);
    if (glow) glowOp.value = withSpring(0.48, SPRING);
  }, [glow, glowOp, pressedScale, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING);
    if (glow) glowOp.value = withSpring(0.28, SPRING);
  }, [glow, glowOp, scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
