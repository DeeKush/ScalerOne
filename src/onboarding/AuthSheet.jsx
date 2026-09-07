import { useEffect } from 'react';
import { Keyboard, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/src/hub/GlassSurface';
import { colors, radii, shadows, spacing } from '@/src/theme/tokens';

export function AuthSheet({ children, height }) {
  const insets = useSafeAreaInsets();
  const lift = useSharedValue(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvent, (event) => {
      const next = event.endCoordinates?.height ?? 0;
      lift.value = withTiming(next, { duration: Platform.OS === 'ios' ? 250 : 180 });
    });
    const onHide = Keyboard.addListener(hideEvent, () => {
      lift.value = withTiming(0, { duration: Platform.OS === 'ios' ? 250 : 180 });
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [lift]);

  const sheetMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: -lift.value }],
  }));

  return (
    <Animated.View style={[styles.avoid, sheetMotion]}>
      <Animated.View entering={FadeInDown.duration(400)} style={shadows.sheet}>
        <GlassSurface
          intensity={18}
          style={[
            styles.panel,
            { minHeight: height, paddingBottom: Math.max(insets.bottom, spacing.md) },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.body}>{children}</View>
        </GlassSurface>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avoid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    backgroundColor: colors.sheetFill,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.line,
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    flexGrow: 1,
  },
});
