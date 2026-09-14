import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ReportItemForm } from '@/src/lostFound/ReportItemForm';
import { useItem } from '@/src/hooks/useLostFoundItems';
import { useAuthStore } from '@/src/store/authStore';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

export default function EditItemScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const id = String(itemId ?? '');
  const enterSection = useNavStore((s) => s.enterSection);
  const profile = useAuthStore((s) => s.profile);
  const viewerUid = profile?.uid ?? 'unknown';

  const { data: item, isPending, isError } = useItem(id);

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  if (id && isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  const notMine = item && item.postedBy !== viewerUid;

  if (!id || isError || !item || notMine) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>{notMine ? 'Not your post' : 'Post not found'}</Text>
        <Text style={styles.body}>
          {notMine
            ? 'You can only edit posts you created.'
            : 'This post may have been deleted, or the link is out of date.'}
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(hub)/lost-found/my-posts')}>
          <Text style={styles.buttonText}>Back to My Posts</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backHit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Post</Text>
      </View>

      <ReportItemForm editItem={item} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  backHit: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backGlyph: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  title: { ...typography.headline, fontSize: 18, color: colors.text },
  body: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  buttonText: { ...typography.label, fontSize: 15, color: '#fff' },
});
