import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassSurface } from '@/src/hub/GlassSurface';
import { getSection } from '@/src/data/hubSections';
import { useAuthStore } from '@/src/store/authStore';
import { useNavStore } from '@/src/store/navStore';
import { colors, spacing, typography } from '@/src/theme/tokens';

export function HubHeader({ onProfilePress }) {
  const insets = useSafeAreaInsets();
  const mode = useNavStore((s) => s.mode);
  const activeSectionId = useNavStore((s) => s.activeSectionId);
  const rootTitle = useNavStore((s) => s.rootTitle);
  const profile = useAuthStore((s) => s.profile);

  const title =
    mode === 'section' && activeSectionId
      ? (getSection(activeSectionId)?.title ?? rootTitle)
      : rootTitle;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.xs }]}>
      <GlassSurface style={styles.bar}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          onPress={onProfilePress}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel="Profile"
        >
          <Text style={styles.avatarText}>
            {(profile?.fullName?.[0] ?? 'P').toUpperCase()}
          </Text>
        </Pressable>
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  bar: {
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
    flex: 1,
    marginRight: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
});
