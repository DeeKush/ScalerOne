import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { useAuthStore } from '@/src/store/authStore';
import { getMockProfile, loadProfile, subscribeAuth } from '@/src/lib/auth';
import { useMockAuth } from '@/src/lib/firebase';
import { colors } from '@/src/theme/tokens';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

function AuthGate({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
    let unsub;
    (async () => {
      setLoading(true);
      if (useMockAuth()) {
        setProfile(getMockProfile());
        setLoading(false);
        SplashScreen.hideAsync().catch(() => undefined);
        return;
      }
      unsub = subscribeAuth(async (user) => {
        if (!user) {
          setProfile(null);
        } else {
          const p = await loadProfile(user.uid);
          setProfile(p);
        }
        setLoading(false);
        SplashScreen.hideAsync().catch(() => undefined);
      });
    })();
    return () => {
      unsub?.();
    };
  }, [setLoading, setProfile]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (loading) return;

    const inAuth = segments[0] === '(auth)';
    const inHub = segments[0] === '(hub)';
    const complete = Boolean(profile?.profileComplete);

    if (!complete && !inAuth) {
      router.replace('/(auth)');
    } else if (complete && !inHub) {
      router.replace('/(hub)');
    }
  }, [loading, profile?.profileComplete, segments, router, navigationState?.key]);

  return children;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGate>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(hub)" />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
