import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/src/theme/tokens';

export function AuthSheet({ children, height }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.avoid}
    >
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[
          styles.panel,
          { minHeight: height, paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.body}>{children}</View>
      </Animated.View>
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    shadowColor: '#0B1220',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    flexGrow: 1,
  },
});
