import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export function GoogleSheet({
  mock,
  googleEmail,
  onChangeEmail,
  onGoogle,
  onDevComplete,
  busy,
  error,
  status,
}) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>Scaler Hub</Text>
      <Text style={styles.title}>Sign in with Google</Text>
      <Text style={styles.sub}>Scaler accounts only · @sst.scaler.com or @scaler.com</Text>

      {mock ? (
        <>
          <Text style={styles.fieldLabel}>Mock Scaler email</Text>
          <TextInput
            value={googleEmail}
            onChangeText={onChangeEmail}
            placeholder="name.25bcs10115@sst.scaler.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />
        </>
      ) : null}

      <Pressable
        style={[styles.googleBtn, busy && styles.disabled]}
        onPress={onGoogle}
        disabled={busy}
        accessibilityRole="button"
      >
        <Text style={styles.googleLabel}>
          {mock ? 'Sign in with Google (mock)' : 'Sign in with Google'}
        </Text>
      </Pressable>

      {__DEV__ ? (
        <Pressable style={styles.devBtn} onPress={onDevComplete} disabled={busy}>
          <Text style={styles.devLabel}>Dev: complete profile → Hub</Text>
        </Pressable>
      ) : null}

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {mock ? <Text style={styles.caption}>Mock auth on · OTP 123456 after the card flips</Text> : null}
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
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  googleBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  disabled: { opacity: 0.55 },
  devBtn: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devLabel: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
  },
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
  caption: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.45,
    textAlign: 'center',
  },
});
