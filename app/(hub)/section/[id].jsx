import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSection } from '@/src/data/hubSections';
import { useNavStore } from '@/src/store/navStore';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

/**
 * Landing screen for every module that isn't built yet. Reached from the hub
 * tiles and the floating nav. It exists so those controls always go somewhere
 * deliberate — a module with no screen should say so, not silently do nothing.
 */
export default function SectionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const sectionId = String(id ?? '');
  const section = getSection(sectionId);
  const activeSubIndex = useNavStore((s) => s.activeSubIndex);
  const enterSection = useNavStore((s) => s.enterSection);
  const exitToRoot = useNavStore((s) => s.exitToRoot);

  useEffect(() => {
    if (section) enterSection(sectionId);
  }, [sectionId, section, enterSection]);

  const goHome = () => {
    exitToRoot();
    router.replace('/(hub)');
  };

  if (!section) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Module not found</Text>
        <Text style={styles.body}>That module doesn’t exist, or the link is out of date.</Text>
        <Pressable style={styles.button} onPress={goHome}>
          <Text style={styles.buttonText}>Back to Hub</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={goHome}
          style={styles.backHit}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={styles.backGlyph}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{section.title}</Text>
      </View>

      <View style={styles.hero}>
        {section.art ? (
          <Image source={section.art} style={styles.art} resizeMode="contain" />
        ) : (
          <View style={styles.artFallback} />
        )}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
        <Text style={styles.heroBody}>
          {section.title} isn’t built yet. Lost &amp; Found is the first module — the rest follow
          the same pattern.
        </Text>
      </View>

      <Text style={styles.plannedLabel}>Planned in this module</Text>
      <View style={styles.list}>
        {section.subActions.map((action, index) => (
          <View
            key={action.id}
            style={[styles.row, index === activeSubIndex && styles.rowActive]}
          >
            <Text style={styles.rowText}>{action.title}</Text>
            <Text style={styles.rowNote}>Not built</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.button} onPress={goHome}>
        <Text style={styles.buttonText}>Back to Hub</Text>
      </Pressable>
    </ScrollView>
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
  content: {
    padding: spacing.lg,
    paddingBottom: 160,
    gap: spacing.md,
  },
  headerRow: {
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
  headerTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    padding: spacing.lg,
  },
  art: { width: 96, height: 96 },
  artFallback: {
    width: 96,
    height: 96,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.label,
    fontSize: 13,
    color: colors.accent,
  },
  heroBody: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
  },
  plannedLabel: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  rowActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  rowText: { ...typography.label, color: colors.text, fontSize: 15 },
  rowNote: { ...typography.caption, color: colors.textSoft },
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
    alignItems: 'center',
  },
  buttonText: { ...typography.label, fontSize: 15, color: '#fff' },
});
