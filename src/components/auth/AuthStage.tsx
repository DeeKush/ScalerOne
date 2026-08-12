import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import {
  completeMockGoogle,
  confirmPhoneCode,
  saveFullName,
  signInWithGoogleIdToken,
  startPhoneVerification,
  useGoogleAuthRequest,
} from '@/src/lib/auth';
import { useMockAuth } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/store/authStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

const SPRING = { damping: 18, stiffness: 160, mass: 0.9 };

export function AuthStage() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [stage, setStage] = useState<'info' | 'auth'>('info');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState('ariyan.25bcs10115@sst.scaler.com');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setError = useAuthStore((s) => s.setError);
  const error = useAuthStore((s) => s.error);
  const mock = useMockAuth();

  const [request, response, promptAsync] = useGoogleAuthRequest();

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken =
      response.authentication?.idToken ??
      (response.params as { id_token?: string }).id_token;
    if (!idToken) {
      setError('Google sign-in did not return an ID token');
      return;
    }
    (async () => {
      try {
        setBusy(true);
        const profile = await signInWithGoogleIdToken(idToken);
        if (fullName.trim()) {
          const updated = await saveFullName(fullName);
          setProfile(updated);
        } else {
          setProfile(profile);
        }
        setStatus(`Signed in as ${profile.email}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
      } finally {
        setBusy(false);
      }
    })();
  }, [response]);

  const goAuth = () => {
    setStage('auth');
    if (reducedMotion) {
      progress.value = 1;
    } else {
      progress.value = withSpring(1, SPRING);
    }
  };

  const infoStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      height: height * (1 - 0.75 * p),
      opacity: 1,
    };
  });

  const authStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      transform: [{ translateY: (1 - p) * height * 0.75 }],
      opacity: p > 0.02 ? 1 : 0,
    };
  });

  const nextStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value < 0.2 ? 1 : 0, {
      duration: reducedMotion ? 0 : 160,
      easing: Easing.out(Easing.quad),
    }),
    transform: [{ translateY: progress.value * 40 }],
  }));

  const onGoogle = async () => {
    setError(null);
    if (mock) {
      try {
        setBusy(true);
        if (!fullName.trim()) throw new Error('Enter your full name');
        const profile = await completeMockGoogle(googleEmail, fullName.trim());
        setProfile(profile);
        setStatus(`Mock Google OK · ${profile.accountType}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mock Google failed');
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!request) {
      setError('Google OAuth is not configured. Set EXPO_PUBLIC_GOOGLE_* client IDs.');
      return;
    }
    await promptAsync();
  };

  const onSendOtp = async () => {
    setError(null);
    try {
      setBusy(true);
      if (!phone.trim()) throw new Error('Enter phone number');
      const { verificationId: id } = await startPhoneVerification(phone.trim());
      setVerificationId(id);
      setStatus(mock ? 'OTP sent (mock). Use 123456' : 'OTP sent');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async () => {
    setError(null);
    try {
      setBusy(true);
      if (!verificationId) throw new Error('Send OTP first');
      const profile = await confirmPhoneCode(verificationId, otp, fullName);
      setProfile(profile);
      if (profile.profileComplete) {
        router.replace('/(hub)');
      } else {
        setStatus('Phone verified — finish Google + name to continue');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  };

  const onDevComplete = async () => {
    if (!__DEV__) return;
    try {
      setBusy(true);
      const profile = await completeMockGoogle(
        googleEmail || 'ariyan.25bcs10115@sst.scaler.com',
        fullName.trim() || 'Dev User'
      );
      const verified = await confirmPhoneCode(
        (await startPhoneVerification(phone.trim() || '+919999999999')).verificationId,
        '123456',
        profile.fullName
      );
      setProfile(verified);
      router.replace('/(hub)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dev complete failed');
    } finally {
      setBusy(false);
    }
  };

  const redirectUri = useMemo(() => AuthSession.makeRedirectUri(), []);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.infoPane, infoStyle]}>
        <View style={styles.infoInner}>
          <Text style={styles.kicker}>Scaler Hub</Text>
          <Text style={styles.title}>Welcome to the Hub</Text>
          <Text style={styles.sub}>
            Your central platform for all things Scaler — campus tools in one fluid place.
          </Text>
          {stage === 'auth' ? (
            <Text style={styles.hint}>Use your Scaler Google email to continue.</Text>
          ) : null}
        </View>
      </Animated.View>

      <Animated.View style={[styles.nextWrap, nextStyle]} pointerEvents={stage === 'info' ? 'auto' : 'none'}>
        <Pressable style={styles.nextBtn} onPress={goAuth} accessibilityRole="button">
          <Text style={styles.nextLabel}>Next</Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={[styles.authPane, { height: height * 0.75 }, authStyle]}>
        <View style={styles.authSheet}>
          <Text style={styles.authTitle}>Sign in</Text>
          <Text style={styles.authSub}>Scaler users only · @sst.scaler.com or @scaler.com</Text>

          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Phone</Text>
          <View style={styles.row}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
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
              onChangeText={setOtp}
              placeholder={mock ? '123456' : '6-digit code'}
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.flex]}
              keyboardType="number-pad"
            />
            <Pressable style={styles.secondaryBtn} onPress={onVerifyOtp} disabled={busy}>
              <Text style={styles.secondaryLabel}>Verify</Text>
            </Pressable>
          </View>

          {mock ? (
            <>
              <Text style={styles.fieldLabel}>Mock Scaler email</Text>
              <TextInput
                value={googleEmail}
                onChangeText={setGoogleEmail}
                placeholder="name.25bcs10115@sst.scaler.com"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          ) : null}

          <Pressable style={styles.googleBtn} onPress={onGoogle} disabled={busy}>
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
          {!mock ? (
            <Text style={styles.caption}>Redirect: {redirectUri}</Text>
          ) : (
            <Text style={styles.caption}>Mock auth on · OTP 123456</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  infoPane: {
    width: '100%',
    backgroundColor: colors.bg,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  infoInner: {
    gap: spacing.sm,
  },
  kicker: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  sub: {
    ...typography.body,
    color: colors.text,
    opacity: 0.72,
    maxWidth: 340,
  },
  hint: {
    ...typography.caption,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  nextWrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xxl,
    zIndex: 2,
  },
  nextBtn: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextLabel: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  authPane: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  authSheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  authTitle: {
    ...typography.headline,
    color: colors.text,
  },
  authSub: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.6,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.bg,
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
  googleBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  devBtn: {
    marginTop: spacing.sm,
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
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  caption: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.45,
    marginTop: spacing.sm,
  },
});
