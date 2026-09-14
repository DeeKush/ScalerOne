import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReportItemForm } from '@/src/lostFound/ReportItemForm';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, spacing, typography } from '@/src/theme/tokens';

const TITLES = {
  lost: 'Report Lost Item',
  found: 'Report Found Item',
};

export default function ReportItemScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const initialType = type === 'lost' || type === 'found' ? type : undefined;
  const enterSection = useNavStore((s) => s.enterSection);

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

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
        <Text style={styles.title}>{TITLES[initialType] ?? 'Report an Item'}</Text>
      </View>

      <ReportItemForm initialType={initialType} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  title: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
});
