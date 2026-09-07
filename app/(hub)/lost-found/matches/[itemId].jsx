import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ItemCard } from '@/src/lostFound/ItemCard';
import { useItem, useItemMatches } from '@/src/hooks/useLostFoundItems';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, spacing, typography } from '@/src/theme/tokens';

export default function ItemMatchesScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const id = String(itemId ?? '');
  const enterSection = useNavStore((s) => s.enterSection);
  const { data: item } = useItem(id);
  const { data, isPending, error } = useItemMatches(id);
  const matches = data?.matches ?? [];
  const reason = data?.reason;

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  const emptyCopy =
    reason === 'no_embedding'
      ? 'No embedding yet — add a photo/description and Hugging Face CLIP, then retry.'
      : reason === 'vector_index_unavailable'
        ? 'Atlas Vector Search index is not ready. Create item_vector_index in Atlas.'
        : reason === 'local_backend'
          ? 'Matches need EXPO_PUBLIC_LOSTFOUND_BACKEND=api.'
          : 'No opposite-type lookalikes yet.';

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Matches
        </Text>
      </View>
      {item ? (
        <Text style={styles.subtitle} numberOfLines={2}>
          Opposite of “{item.title}”
        </Text>
      ) : null}
      {isPending ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: row }) => (
            <Pressable onPress={() => router.push(`/(hub)/lost-found/${row.id}`)}>
              <ItemCard item={row} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>{emptyCopy}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backGlyph: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginTop: -4 },
  headerTitle: { ...typography.headline, fontSize: 22, color: colors.text, flex: 1 },
  subtitle: { ...typography.caption, color: colors.textSoft },
  loader: { marginTop: spacing.lg },
  list: { gap: spacing.sm, paddingBottom: 120 },
  empty: { ...typography.body, color: colors.textSoft },
  error: { ...typography.caption, color: colors.danger },
});
