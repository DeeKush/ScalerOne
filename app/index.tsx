import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors } from '@/src/theme/tokens';

export default function Index() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (profile?.profileComplete) {
    return <Redirect href="/(hub)" />;
  }
  return <Redirect href="/(auth)" />;
}
