import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export function PhoneOtpSheet({
  phone,
  otp,
  onChangePhone,
  onChangeOtp,
  onSendOtp,
  onVerifyOtp,
  busy,
  error,
  status,
  sent,
}) {
  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>Almost there</Text>
      <Text style={styles.title}>Verify your phone</Text>
      <Text style={styles.sub}>Required after Google — not an alternate login.</Text>

      <Text style={styles.fieldLabel}>Phone</Text>
      <View style={styles.row}>
        <TextInput
          value={phone}
          onChangeText={onChangePhone}
          placeholder="+91…"
          placeholderTextColor={colors.textSoft}
          style={[styles.input, styles.flex]}
          keyboardType="phone-pad"
        />
        <Pressable
          style={[styles.accentBtn, busy && styles.disabled]}
          onPress={onSendOtp}
          disabled={busy}
        >
          <Text style={styles.accentLabel}>Send OTP</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>OTP</Text>
      <View style={styles.row}>
        <TextInput
          value={otp}
          onChangeText={onChangeOtp}
          placeholder="6-digit code"
          placeholderTextColor={colors.textSoft}
          style={[styles.input, styles.flex]}
          keyboardType="number-pad"
        />
        <Pressable
          style={[styles.accentBtn, (busy || !sent) && styles.disabled]}
          onPress={onVerifyOtp}
          disabled={busy || !sent}
        >
          <Text style={styles.accentLabel}>Verify</Text>
        </Pressable>
      </View>

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
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
  fieldLabel: {
    ...typography.label,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  flex: { flex: 1 },
  accentBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  accentLabel: {
    color: '#fff',
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
  },
  disabled: { opacity: 0.45 },
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
