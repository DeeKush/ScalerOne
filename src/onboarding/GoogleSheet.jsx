import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-7.8 19.7-20 0-1.2-.1-2.3-.3-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.2-4.2 5.6l.1.1 6.2 5.2C39.2 37.3 43.7 31.5 43.7 24c0-1.2-.1-2.3-.3-3.5z"
      />
    </Svg>
  );
}

export function GoogleSheet({ onGoogle, busy, error, status }) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>ScalerOne</Text>
      <Text style={styles.title}>Sign in with Google</Text>
      <Text style={styles.sub}>Scaler accounts only · @sst.scaler.com or @scaler.com</Text>

      <Pressable
        style={[styles.googleBtn, busy && styles.disabled]}
        onPress={onGoogle}
        disabled={busy}
        accessibilityRole="button"
      >
        <GoogleMark />
        <Text style={styles.googleLabel}>Sign in with Google</Text>
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  kicker: {
    ...typography.label,
    color: colors.accent,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    ...typography.caption,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  googleBtn: {
    marginTop: spacing.sm,
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleLabel: {
    ...typography.label,
    color: colors.text,
    fontSize: 16,
    fontFamily: typography.headline.fontFamily,
  },
  disabled: { opacity: 0.55 },
  status: {
    ...typography.caption,
    color: colors.success,
    textAlign: 'center',
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
  },
});
