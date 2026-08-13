import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  completeMockGoogle,
  confirmPhoneCode,
  signInWithGoogleIdToken,
  startPhoneVerification,
  useGoogleAuthRequest,
} from '@/src/lib/auth';
import { useMockAuth } from '@/src/lib/firebase';
import { useAuthStore } from '@/src/store/authStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { colors, idCard, spacing, typography } from '@/src/theme/tokens';
import { SST_CAMPUS, OPEN_SCROLL } from '@/src/onboarding/campus';
import { IdCard } from '@/src/onboarding/IdCard';
import { GoogleSheet } from '@/src/onboarding/GoogleSheet';
import { PhoneOtpSheet } from '@/src/onboarding/PhoneOtpSheet';

function cardFromProfile(profile) {
  if (!profile) {
    return {
      fullName: '',
      studentId: '',
      photoUrl: '',
      accountType: 'unknown',
      campus: SST_CAMPUS,
    };
  }
  return {
    fullName: profile.fullName,
    studentId: profile.studentId,
    photoUrl: profile.photoUrl,
    accountType: profile.accountType,
    passOutYear: profile.passOutYear,
    campus: SST_CAMPUS,
    phone: profile.phone,
    phoneVerified: profile.phoneVerified,
  };
}

export function OnboardingStage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const mock = useMockAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const setError = useAuthStore((s) => s.setError);
  const error = useAuthStore((s) => s.error);

  const [phase, setPhase] = useState('intro');
  const [card, setCard] = useState(cardFromProfile(null));
  const [googleEmail, setGoogleEmail] = useState('ariyan.25bcs10115@sst.scaler.com');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const currentScroll = useSharedValue(0);
  const initialScroll = useSharedValue(0);
  const locked = useSharedValue(false);
  const flip = useSharedValue(0);
  const reduceMotionSV = useSharedValue(reducedMotion ? 1 : 0);

  const [request, response, promptAsync] = useGoogleAuthRequest();

  const maxCardHeight = height - insets.top - insets.bottom - 150;
  const cardHeight = Math.min(maxCardHeight, (width * 0.9) / idCard.aspect);
  const cardWidth = cardHeight * idCard.aspect;

  const openSheet = () => setPhase((p) => (p === 'otp' ? 'otp' : 'google'));
  const closeSheet = () => setPhase((p) => (p === 'otp' ? 'otp' : 'intro'));

  useEffect(() => {
    reduceMotionSV.value = reducedMotion ? 1 : 0;
  }, [reducedMotion, reduceMotionSV]);

  useAnimatedReaction(
    () => currentScroll.value >= 580,
    (open, prev) => {
      if (open === prev) return;
      if (open) runOnJS(openSheet)();
      else runOnJS(closeSheet)();
    }
  );

  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onBegin(() => {
      initialScroll.value = currentScroll.value;
    })
    .onUpdate((e) => {
      if (locked.value) return;
      currentScroll.value = Math.max(0, initialScroll.value - e.translationY);
    })
    .onEnd(() => {
      if (locked.value) return;
      const instant = reduceMotionSV.value === 1;
      if (currentScroll.value < 300 || initialScroll.value > currentScroll.value) {
        currentScroll.value = withTiming(0, { duration: instant ? 0 : 500 });
      } else {
        currentScroll.value = withTiming(OPEN_SCROLL, {
          duration: instant ? 0 : 1000,
          easing: Easing.inOut(Easing.cubic),
        });
      }
      initialScroll.value = currentScroll.value;
    });

  const cardMotion = useAnimatedStyle(() => {
    const scale = interpolate(
      Easing.inOut(Easing.cubic)(Math.min(currentScroll.value / 300, 1)),
      [0, 1],
      [1, 0.7],
      Extrapolation.CLAMP
    );
    const translation = interpolate(currentScroll.value, [0, 350, 600], [0, -40, -height * 0.22], {
      extrapolateLeft: Extrapolation.CLAMP,
      extrapolateRight: Extrapolation.EXTEND,
    });
    const rotation = interpolate(currentScroll.value, [500, 600], [0, 0.08], {
      extrapolateLeft: Extrapolation.CLAMP,
      extrapolateRight: Extrapolation.EXTEND,
    });
    return {
      transform: [
        { scaleX: scale },
        { scaleY: scale },
        { translateY: translation },
        { rotateZ: `${rotation}rad` },
      ],
    };
  });

  const heroCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(currentScroll.value, [0, 180], [1, 0], Extrapolation.CLAMP),
  }));

  const googleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(currentScroll.value, [380, 560], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(currentScroll.value, [380, 560], [28, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const lockOpen = () => {
    locked.value = true;
    currentScroll.value = withTiming(OPEN_SCROLL, { duration: reducedMotion ? 0 : 400 });
  };

  const flipCard = () => {
    flip.value = withTiming(1, {
      duration: reducedMotion ? 0 : 780,
      easing: Easing.inOut(Easing.cubic),
    });
    setTimeout(() => setPhase('otp'), reducedMotion ? 0 : 820);
  };

  const applyGoogleProfile = (profile) => {
    setProfile(profile);
    setCard(cardFromProfile(profile));
    setStatus(`Signed in as ${profile.email}`);
    lockOpen();
    setTimeout(flipCard, reducedMotion ? 0 : 700);
  };

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken =
      response.authentication?.idToken ??
      response.params?.id_token;
    if (!idToken) {
      setError('Google sign-in did not return an ID token');
      return;
    }
    (async () => {
      try {
        setBusy(true);
        const profile = await signInWithGoogleIdToken(idToken);
        applyGoogleProfile(profile);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Google sign-in failed');
      } finally {
        setBusy(false);
      }
    })();
  }, [response]);

  const onGoogle = async () => {
    setError(null);
    if (mock) {
      try {
        setBusy(true);
        const profile = await completeMockGoogle(googleEmail);
        applyGoogleProfile(profile);
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
      const profile = await confirmPhoneCode(verificationId, otp, card.fullName);
      setProfile(profile);
      setCard(cardFromProfile(profile));
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
      const profile = await completeMockGoogle(googleEmail || 'ariyan.25bcs10115@sst.scaler.com');
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

  const showOtp = phase === 'otp';

  return (
    <View style={styles.root}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.flex}>
          <Animated.View
            style={[
              styles.cardWrap,
              {
                width: cardWidth,
                height: cardHeight,
                left: (width - cardWidth) / 2,
                top: insets.top + 12,
              },
              cardMotion,
            ]}
          >
            <IdCard width={cardWidth} height={cardHeight} flip={flip} data={card} />
          </Animated.View>

          <Animated.View
            style={[styles.heroCopy, { bottom: insets.bottom + 20 }, heroCopyStyle]}
            pointerEvents="none"
          >
            <Text style={styles.heroKicker}>Scaler Hub</Text>
            <Text style={styles.heroTitle}>Your campus ID</Text>
            <Text style={styles.heroSub}>
              Swipe up to sign in. Google fills the front, then the card flips for phone OTP.
            </Text>
            <Text style={styles.swipeHint}>↑  Swipe up</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      <Animated.View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) },
          googleStyle,
        ]}
        pointerEvents={phase === 'google' && !showOtp ? 'auto' : 'none'}
      >
        {!showOtp ? (
          <GoogleSheet
            mock={mock}
            googleEmail={googleEmail}
            onChangeEmail={setGoogleEmail}
            onGoogle={onGoogle}
            onDevComplete={onDevComplete}
            busy={busy}
            error={error}
            status={status}
          />
        ) : null}
      </Animated.View>

      {showOtp ? (
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <PhoneOtpSheet
            mock={mock}
            phone={phone}
            otp={otp}
            onChangePhone={setPhone}
            onChangeOtp={setOtp}
            onSendOtp={onSendOtp}
            onVerifyOtp={onVerifyOtp}
            busy={busy}
            error={error}
            status={status}
            sent={Boolean(verificationId)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: { flex: 1 },
  cardWrap: {
    position: 'absolute',
  },
  heroCopy: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    gap: 6,
  },
  heroKicker: {
    ...typography.label,
    color: colors.accent,
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    ...typography.body,
    color: colors.text,
    opacity: 0.68,
    textAlign: 'center',
    maxWidth: 340,
  },
  swipeHint: {
    marginTop: 10,
    ...typography.label,
    color: colors.accent,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
