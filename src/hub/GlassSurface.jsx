import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { colors, radii } from '@/src/theme/tokens';

/** Glass surface with Android solid fallback (Decision 8 degrade path). */
export function GlassSurface({ children, style, intensity = 40 }) {
  if (Platform.OS === 'android') {
    return <View style={[styles.fallback, style]}>{children}</View>;
  }
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.blur, style]}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blur: {
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderColor: colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
  },
  fallback: {
    backgroundColor: colors.glassAndroid,
    borderColor: colors.glassBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
  },
});
