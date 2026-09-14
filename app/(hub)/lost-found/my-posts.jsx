import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ItemCard } from '@/src/lostFound/ItemCard';
import { useItems, useDeleteItem } from '@/src/hooks/useLostFoundItems';
import { useAuthStore } from '@/src/store/authStore';
import { useLostFoundUiStore } from '@/src/store/lostFoundUiStore';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

// Matches the feed: clear the FloatingHubNav (bottom: spacing.lg, 72px tall).
const TOAST_BOTTOM = spacing.lg + 72 + spacing.sm;

export default function MyPostsScreen() {
  const router = useRouter();
  const enterSection = useNavStore((s) => s.enterSection);
  const exitToRoot = useNavStore((s) => s.exitToRoot);
  const profile = useAuthStore((s) => s.profile);
  const viewerUid = profile?.uid ?? 'unknown';

  const toastMessage = useLostFoundUiStore((s) => s.toastMessage);
  const clearToast = useLostFoundUiStore((s) => s.clearToast);
  const setToast = useLostFoundUiStore((s) => s.setToast);

  const { data: items = [], isLoading, error } = useItems({ postedBy: viewerUid });
  const deleteItem = useDeleteItem();

  const [confirmingId, setConfirmingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const onBack = () => {
    exitToRoot();
    router.replace('/(hub)');
  };

  const onDelete = async (itemId) => {
    setActionError(null);
    try {
      await deleteItem.mutateAsync(itemId);
      setConfirmingId(null);
      setToast('Post deleted.');
    } catch (err) {
      console.error('[lost-found] deleteItem failed', err);
      setActionError(err?.message ?? 'Could not delete that post. Please try again.');
    }
  };

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.titleRow}>
        <Pressable
          onPress={onBack}
          style={styles.backHit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <View style={styles.titleTextWrap}>
          <Text style={styles.title}>My Posts</Text>
          <Text style={styles.subtitle}>
            {items.length} post{items.length === 1 ? '' : 's'} · Scaler Campus
          </Text>
        </View>
      </View>

      {actionError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderItem = ({ item }) => {
    const confirming = confirmingId === item.id;
    return (
      <View style={styles.row}>
        <Pressable
          onPress={() => router.push(`/(hub)/lost-found/${item.id}`)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${item.title}`}
        >
          <ItemCard item={item} />
        </Pressable>

        {confirming ? (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              Delete this post? Any claims on it are removed too.
            </Text>
            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.confirmButton, styles.confirmCancel]}
                onPress={() => setConfirmingId(null)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmButton, styles.confirmDelete]}
                onPress={() => onDelete(item.id)}
                disabled={deleteItem.isPending}
              >
                {deleteItem.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push(`/(hub)/lost-found/edit/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
            >
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => setConfirmingId(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
            >
              <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? null : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Couldn’t load your posts</Text>
              <Text style={styles.emptyBody}>{error.message}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nothing posted yet</Text>
              <Text style={styles.emptyBody}>
                Anything you report as lost or found shows up here.
              </Text>
              <Pressable
                style={styles.emptyButton}
                onPress={() => router.push('/(hub)/lost-found/post')}
              >
                <Text style={styles.emptyButtonText}>Report an item</Text>
              </Pressable>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      {toastMessage ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 160,
    flexGrow: 1,
  },
  separator: { height: spacing.md },
  headerBlock: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  titleTextWrap: { flex: 1 },
  title: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSoft,
    marginTop: 2,
  },
  row: { gap: spacing.xs },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  actionText: {
    ...typography.caption,
    fontSize: 13,
    color: colors.text,
  },
  actionTextDanger: { color: colors.danger },
  confirmBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    ...typography.label,
    fontSize: 13,
    color: colors.text,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  confirmButton: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancel: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  confirmCancelText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  confirmDelete: { backgroundColor: colors.danger },
  confirmDeleteText: {
    ...typography.label,
    fontSize: 14,
    color: '#fff',
  },
  errorBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  emptyBody: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  emptyButtonText: {
    ...typography.label,
    fontSize: 15,
    color: '#fff',
  },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: TOAST_BOTTOM,
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  toastText: {
    ...typography.label,
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
  },
});
