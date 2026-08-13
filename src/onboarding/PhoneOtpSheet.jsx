import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export function PhoneOtpSheet({
  mock,
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
      <Text style={styles.sub}>OTP is required after Google. This is not an alternate login.</Text>

      <Text style={styles.fieldLabel}>Phone</Text>
      <View style={styles.row}>
        <TextInput
          value={phone}
          onChangeText={onChangePhone}
          placeholder="+91…"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.flex]}
          keyboardType="phone-pad"
        />
        <Pressable style={styles.secondaryBtn} onPress={onSendOtp} disabled={busy}>
          <Text style={styles.secondaryLabel}>Send OTP</Text>
        </Pressable>
      </View>

      <Text style={styles.fieldLabel}>OTP</Text>
      <View style={styles.row}>
        <TextInput
          value={otp}
          onChangeText={onChangeOtp}
          placeholder={mock ? '123456' : '6-digit code'}
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.flex]}
          keyboardType="number-pad"
        />
        <Pressable style={styles.secondaryBtn} onPress={onVerifyOtp} disabled={busy || !sent}>
          <Text style={styles.secondaryLabel}>Verify</Text>
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  flex: { flex: 1 },
  secondaryBtn: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  secondaryLabel: {
    color: colors.accent,
    fontWeight: '700',
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
});
