import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ItemCard } from '@/src/lostFound/ItemCard';
import { useItems } from '@/src/hooks/useLostFoundItems';
import { useAuthStore } from '@/src/store/authStore';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, spacing, typography } from '@/src/theme/tokens';

export default function MatchesPickerScreen() {
  const router = useRouter();
  const enterSection = useNavStore((s) => s.enterSection);
  const profile = useAuthStore((s) => s.profile);
  const viewerUid = profile?.uid ?? 'unknown';
  const { data: items = [], isLoading, error } = useItems({ postedBy: viewerUid });

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>
      <Text style={styles.hint}>Pick one of your posts to see opposite-type lookalikes.</Text>
      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : error ? (
        <Text style={styles.error}>{error.message}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(hub)/lost-found/matches/${item.id}`)}>
              <ItemCard item={item} />
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No posts yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  backGlyph: { fontFamily: fonts.extraBold, fontSize: 28, color: colors.text, marginTop: -4 },
  headerTitle: { ...typography.headline, fontSize: 22, color: colors.text },
  hint: { ...typography.caption, color: colors.textSoft },
  list: { gap: spacing.sm, paddingBottom: 120 },
  empty: { ...typography.body, color: colors.textSoft },
  error: { ...typography.caption, color: colors.danger },
});
