import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePressAnimation } from '@/src/hooks/usePressAnimation';
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
}) {
  const phoneReady = phone.length === 10;
  const otpReady = phoneReady && otp.length === 6;
  const sendPress = usePressAnimation(0.97, true);
  const verifyPress = usePressAnimation(0.97, true);

  return (
    <View style={styles.sheet}>
      <Text style={styles.kicker}>Almost there</Text>
      <Text style={styles.title}>Verify your phone</Text>
      <Text style={styles.sub}>
        Required after Google — not an alternate login. Send OTP is optional for test numbers.
      </Text>

      <Text style={styles.fieldLabel}>Phone</Text>
      <View style={styles.row}>
        <TextInput
          value={phone}
          onChangeText={(value) => onChangePhone(value.replace(/\D/g, '').slice(0, 10))}
          placeholder="10-digit mobile"
          placeholderTextColor={colors.textSoft}
          style={[styles.input, styles.flex]}
          keyboardType="number-pad"
          maxLength={10}
          textContentType="telephoneNumber"
        />
        <Animated.View style={sendPress.animatedStyle}>
          <Pressable
            style={[styles.accentBtn, (busy || !phoneReady) && styles.disabled]}
            onPress={onSendOtp}
            onPressIn={busy || !phoneReady ? undefined : sendPress.onPressIn}
            onPressOut={sendPress.onPressOut}
            disabled={busy || !phoneReady}
          >
            <Text style={styles.accentLabel}>Send OTP</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Text style={styles.fieldLabel}>OTP</Text>
      <View style={styles.row}>
        <TextInput
          value={otp}
          onChangeText={(value) => onChangeOtp(value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6-digit code"
          placeholderTextColor={colors.textSoft}
          style={[styles.input, styles.flex]}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
        />
        <Animated.View style={verifyPress.animatedStyle}>
          <Pressable
            style={[styles.accentBtn, (busy || !otpReady) && styles.disabled]}
            onPress={onVerifyOtp}
            onPressIn={busy || !otpReady ? undefined : verifyPress.onPressIn}
            onPressOut={verifyPress.onPressOut}
            disabled={busy || !otpReady}
          >
            <Text style={styles.accentLabel}>Submit OTP</Text>
          </Pressable>
        </Animated.View>
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
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.body.fontFamily,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
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
    borderRadius: radii.lg,
    shadowColor: colors.accent,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  accentLabel: {
    color: colors.white,
    fontFamily: typography.headline.fontFamily,
    fontSize: 13,
  },
  disabled: { opacity: 0.45, shadowOpacity: 0, elevation: 0 },
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
