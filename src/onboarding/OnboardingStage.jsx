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
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  confirmPhoneCode,
  signInWithGoogle,
  startPhoneVerification,
} from '@/src/lib/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { colors, idCard, spacing, typography } from '@/src/theme/tokens';
import {
  SST_CAMPUS,
  OPEN_SCROLL,
  LIVE_DRAG_CAP,
  COMMIT_DISTANCE,
  COMMIT_VELOCITY,
  DOCK_SCALE,
  SHEET_RATIO,
} from '@/src/onboarding/campus';
import { IdCard } from '@/src/onboarding/IdCard';
import { GoogleSheet } from '@/src/onboarding/GoogleSheet';
import { PhoneOtpSheet } from '@/src/onboarding/PhoneOtpSheet';
import { AmbientBackground } from '@/src/onboarding/AmbientBackground';
import { CardHalo } from '@/src/onboarding/CardHalo';
import { SwipeHint } from '@/src/onboarding/SwipeHint';
import { AuthSheet } from '@/src/onboarding/AuthSheet';

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

function StepDots({ active }) {
  const steps = ['ID', 'Google', 'Phone'];
  return (
    <View style={styles.steps}>
      {steps.map((label, i) => {
        const on = i === active;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.dot, on && styles.dotOn]} />
            <Text style={[styles.stepLabel, on && styles.stepLabelOn]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function OnboardingStage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const setProfile = useAuthStore((s) => s.setProfile);
  const setError = useAuthStore((s) => s.setError);
  const error = useAuthStore((s) => s.error);

  const [phase, setPhase] = useState('intro');
  const [card, setCard] = useState(cardFromProfile(null));
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const currentScroll = useSharedValue(0);
  const initialScroll = useSharedValue(0);
  const locked = useSharedValue(0);
  const completing = useSharedValue(0);
  const dragging = useSharedValue(0);
  const flip = useSharedValue(0);
  const punch = useSharedValue(1);
  const motionDamp = useSharedValue(1);
  const reduceMotionSV = useSharedValue(reducedMotion ? 1 : 0);

  const sheetHeight = Math.round(height * SHEET_RATIO);
  const cardWidth = Math.min(width * 0.78, 320);
  const cardHeight = cardWidth / idCard.aspect;
  const introArea = height - sheetHeight;
  const slack = introArea - insets.top - cardHeight;
  const introTop = insets.top + Math.max(16, slack > 0 ? slack * 0.28 : 16);
  const dockedVisualTop = insets.top + 16;
  const dockedMaxBottom = height - sheetHeight - 20 - 28;
  const maxVisualHeight = Math.max(140, dockedMaxBottom - dockedVisualTop);
  const dockScale = Math.min(DOCK_SCALE, maxVisualHeight / cardHeight);
  const dockTranslateY =
    dockedVisualTop - introTop - (cardHeight * (1 - dockScale)) / 2;

  const openSheet = () => setPhase((p) => (p === 'otp' ? 'otp' : 'google'));
  const closeSheet = () => setPhase((p) => (p === 'otp' ? 'otp' : 'intro'));

  const onCommitHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };

  const onSuccessHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  useEffect(() => {
    reduceMotionSV.value = reducedMotion ? 1 : 0;
  }, [reducedMotion, reduceMotionSV]);

  useAnimatedReaction(
    () => (dragging.value === 1 || flip.value > 0.04 ? 0 : 1),
    (next) => {
      motionDamp.value = withTiming(next, { duration: 220 });
    }
  );

  useAnimatedReaction(
    () => currentScroll.value >= OPEN_SCROLL * 0.85,
    (open, prev) => {
      if (open === prev) return;
      if (open) runOnJS(openSheet)();
      else runOnJS(closeSheet)();
    }
  );

  const playOpen = (instant) => {
    'worklet';
    completing.value = 1;
    dragging.value = 0;
    currentScroll.value = withTiming(OPEN_SCROLL, {
      duration: instant ? 0 : 850,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  };

  const panGesture = Gesture.Pan()
    .activeOffsetY([-12, 12])
    .onBegin(() => {
      initialScroll.value = currentScroll.value;
    })
    .onUpdate((e) => {
      if (locked.value || completing.value) return;
      dragging.value = 1;
      const next = Math.min(LIVE_DRAG_CAP, Math.max(0, initialScroll.value - e.translationY));
      currentScroll.value = next;
      if (next >= 90) {
        runOnJS(onCommitHaptic)();
        playOpen(reduceMotionSV.value === 1);
      }
    })
    .onEnd((e) => {
      if (locked.value || completing.value) return;
      dragging.value = 0;
      const instant = reduceMotionSV.value === 1;
      const commit =
        -e.translationY >= COMMIT_DISTANCE || e.velocityY < -COMMIT_VELOCITY;
      if (commit) {
        runOnJS(onCommitHaptic)();
        playOpen(instant);
      } else {
        currentScroll.value = withSpring(0, { duration: instant ? 0 : 480, dampingRatio: 0.86 });
      }
    });

  const cardMotion = useAnimatedStyle(() => {
    const p = currentScroll.value / OPEN_SCROLL;
    const scale =
      interpolate(p, [0, 1], [1, dockScale], Extrapolation.CLAMP) * punch.value;
    const translation = interpolate(p, [0, 1], [0, dockTranslateY], Extrapolation.CLAMP);
    return {
      transform: [{ translateY: translation }, { scale }],
    };
  });

  const heroCopyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(currentScroll.value, [0, OPEN_SCROLL * 0.28], [1, 0], Extrapolation.CLAMP),
  }));

  const stepsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(currentScroll.value, [OPEN_SCROLL * 0.7, OPEN_SCROLL], [0, 1], Extrapolation.CLAMP),
  }));

  const lockOpen = () => {
    locked.value = 1;
    currentScroll.value = withTiming(OPEN_SCROLL, { duration: reducedMotion ? 0 : 400 });
  };

  const flipCard = () => {
    flip.value = withTiming(1, {
      duration: reducedMotion ? 0 : 780,
      easing: Easing.inOut(Easing.cubic),
    });
    setTimeout(() => setPhase('otp'), reducedMotion ? 0 : 820);
  };

  const finishIfComplete = (profile) => {
    if (profile.profileComplete) {
      router.replace('/(hub)');
    }
  };

  const applyGoogleProfile = (profile) => {
    setProfile(profile);
    setCard(cardFromProfile(profile));
    const syncNote =
      profile.firestoreSynced === false
        ? ' Profile will sync when Firestore is available.'
        : '';
    setStatus(`Signed in as ${profile.email}.${syncNote}`);
    onSuccessHaptic();
    punch.value = withSequence(
      withSpring(1.03, { duration: 280, dampingRatio: 0.72 }),
      withSpring(1, { duration: 320, dampingRatio: 0.8 })
    );
    lockOpen();
    if (profile.phoneVerified) {
      setTimeout(() => finishIfComplete(profile), reducedMotion ? 0 : 500);
      return;
    }
    setTimeout(flipCard, reducedMotion ? 0 : 700);
  };

  const onGoogle = async () => {
    setError(null);
    try {
      setBusy(true);
      const profile = await signInWithGoogle();
      if (!profile) return;
      applyGoogleProfile(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  const completePhone = async (id, code) => {
    const profile = await confirmPhoneCode(id, code, card.fullName);
    setProfile(profile);
    setCard(cardFromProfile(profile));
    if (profile.profileComplete) {
      router.replace('/(hub)');
    } else {
      const syncNote =
        profile.firestoreSynced === false
          ? ' Profile will sync when Firestore is available.'
          : '';
      setStatus(`Phone verified — finish Google + name to continue.${syncNote}`);
    }
  };

  const onSendOtp = async () => {
    setError(null);
    try {
      setBusy(true);
      if (!phone.trim()) throw new Error('Enter phone number');
      const result = await startPhoneVerification(phone.trim());
      setVerificationId(result.verificationId);
      if (result.autoVerified && result.autoCode) {
        await completePhone(result.verificationId, result.autoCode);
        return;
      }
      setStatus('OTP sent');
    } catch (e) {
      setVerificationId(null);
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
      await completePhone(verificationId, otp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  };

  const showOtp = phase === 'otp';
  const showGoogle = phase === 'google' && !showOtp;
  const stepIndex = showOtp ? 2 : showGoogle ? 1 : 0;

  return (
    <View style={styles.root}>
      <AmbientBackground />
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.flex}>
          <Animated.View
            style={[
              styles.cardWrap,
              {
                width: cardWidth,
                height: cardHeight,
                left: (width - cardWidth) / 2,
                top: introTop,
              },
              cardMotion,
            ]}
          >
            <CardHalo width={cardWidth} height={cardHeight} />
            <IdCard
              width={cardWidth}
              height={cardHeight}
              flip={flip}
              data={card}
              motionDamp={motionDamp}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroCopy,
              { top: introTop + cardHeight + 10, left: spacing.lg, right: spacing.lg },
              heroCopyStyle,
            ]}
            pointerEvents="none"
          >
            <Text style={styles.heroKicker}>ScalerOne</Text>
            <Text style={styles.heroTitle}>Your campus ID</Text>
            <Text style={styles.heroSub}>Swipe up to continue</Text>
            <SwipeHint />
          </Animated.View>

          <Animated.View
            style={[
              styles.stepsWrap,
              {
                top: dockedVisualTop + cardHeight * dockScale + 8,
                left: spacing.lg,
                right: spacing.lg,
              },
              stepsStyle,
            ]}
            pointerEvents="none"
          >
            <StepDots active={stepIndex} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {showGoogle ? (
        <AuthSheet height={sheetHeight}>
          <GoogleSheet
            onGoogle={onGoogle}
            busy={busy}
            error={error}
            status={status}
          />
        </AuthSheet>
      ) : null}

      {showOtp ? (
        <AuthSheet height={sheetHeight}>
          <PhoneOtpSheet
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
        </AuthSheet>
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
    overflow: 'visible',
  },
  heroCopy: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
  },
  heroKicker: {
    ...typography.label,
    color: colors.accent,
    letterSpacing: 0.4,
  },
  heroTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  heroSub: {
    ...typography.body,
    color: colors.textSoft,
    textAlign: 'center',
  },
  stepsWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  steps: {
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: {
    backgroundColor: colors.accent,
    width: 8,
    height: 8,
  },
  stepLabel: {
    ...typography.caption,
    color: colors.textSoft,
  },
  stepLabelOn: {
    color: colors.accent,
    fontFamily: typography.label.fontFamily,
  },
});
