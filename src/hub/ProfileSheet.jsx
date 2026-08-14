import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { signOut } from '@/src/lib/auth';
import { useAuthStore } from '@/src/store/authStore';
import { useRouter } from 'expo-router';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

export function ProfileSheet({ visible, onClose }) {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const router = useRouter();

  const identityLine =
    profile?.accountType === 'employee'
      ? 'Scaler Employee'
      : profile?.batchYear
        ? `Batch ${profile.batchYear} · Roll ${profile.rollNumber ?? '—'} · Out ${profile.passOutYear ?? '—'}`
        : 'Student';

  const onLogout = async () => {
    await signOut();
    setProfile(null);
    onClose();
    router.replace('/(auth)');
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.name}>{profile?.fullName || '—'}</Text>
          <Text style={styles.meta}>{profile?.email}</Text>
          <Text style={styles.meta}>{profile?.phone || 'Phone not set'}</Text>
          <Text style={styles.badge}>{identityLine}</Text>
          <Pressable style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27,36,48,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { ...typography.label, color: colors.accent, textTransform: 'uppercase' },
  name: { ...typography.headline, color: colors.text },
  meta: { ...typography.body, color: colors.textSoft },
  badge: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    overflow: 'hidden',
    fontFamily: fonts.semibold,
  },
  logout: {
    marginTop: spacing.lg,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontFamily: fonts.bold },
});
