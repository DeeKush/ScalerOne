import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ItemCard } from '@/src/lostFound/ItemCard';
import { useItems } from '@/src/hooks/useLostFoundItems';
import { useLostFoundUiStore } from '@/src/store/lostFoundUiStore';
import { useNavStore } from '@/src/store/navStore';
import { LOST_FOUND_CATEGORIES } from '@/src/lib/lostFound/categories';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'lost', label: 'Lost' },
  { id: 'found', label: 'Found' },
];

const CHIPS = [{ id: 'all', label: 'All' }, ...LOST_FOUND_CATEGORIES];

// FloatingHubNav sits at bottom: spacing.lg with a 72px-tall bar — clear it with a gap.
const FAB_BOTTOM = spacing.lg + 72 + spacing.sm;
const FAB_SIZE = 56;
const TOAST_BOTTOM = FAB_BOTTOM + FAB_SIZE + spacing.sm;

export default function LostFoundScreen() {
  const router = useRouter();
  const enterSection = useNavStore((s) => s.enterSection);
  const exitToRoot = useNavStore((s) => s.exitToRoot);

  const tab = useLostFoundUiStore((s) => s.tab);
  const category = useLostFoundUiStore((s) => s.category);
  const search = useLostFoundUiStore((s) => s.search);
  const setTab = useLostFoundUiStore((s) => s.setTab);
  const setCategory = useLostFoundUiStore((s) => s.setCategory);
  const setSearch = useLostFoundUiStore((s) => s.setSearch);
  const toastMessage = useLostFoundUiStore((s) => s.toastMessage);
  const clearToast = useLostFoundUiStore((s) => s.clearToast);

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(clearToast, 2500);
    return () => clearTimeout(timer);
  }, [toastMessage, clearToast]);

  const { data: items = [], isLoading, error } = useItems({
    type: tab === 'all' ? undefined : tab,
    category: category === 'all' ? undefined : category,
    query: search,
  });

  const onBack = () => {
    exitToRoot();
    router.replace('/(hub)');
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
          <Text style={styles.title}>Lost & Found</Text>
          <Text style={styles.subtitle}>
            {items.length} item{items.length === 1 ? '' : 's'} · Scaler Campus
          </Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search lost & found..."
          placeholderTextColor={colors.textSoft}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabItem, active && styles.tabItemActive]}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CHIPS.map((c) => {
          const active = category === c.id;
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(hub)/lost-found/${item.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
          >
            <ItemCard item={item} />
          </Pressable>
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? null : error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Couldn’t load items</Text>
              <Text style={styles.emptyBody}>{error.message}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No items match</Text>
              <Text style={styles.emptyBody}>Try a different search, or clear a filter.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <Pressable
        style={styles.fab}
        onPress={() => {
          if (tab === 'lost' || tab === 'found') {
            router.push({ pathname: '/(hub)/lost-found/post', params: { type: tab } });
          } else {
            router.push('/(hub)/lost-found/post');
          }
        }}
        accessibilityRole="button"
        accessibilityLabel="Report item"
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>

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
  separator: { height: spacing.sm },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    color: colors.textSoft,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 4,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  tabItemActive: {
    backgroundColor: colors.text,
  },
  tabLabel: {
    ...typography.label,
    fontSize: 14,
    color: colors.textSoft,
  },
  tabLabelActive: {
    color: '#fff',
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  chipActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  chipLabel: {
    ...typography.caption,
    fontSize: 13,
    color: colors.text,
  },
  chipLabelActive: {
    color: '#fff',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.xs,
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
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: FAB_BOTTOM,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  fabIcon: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
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
