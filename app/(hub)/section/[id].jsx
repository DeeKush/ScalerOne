import { useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSection } from '@/src/data/hubSections';
import { useNavStore } from '@/src/store/navStore';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export default function SectionScreen() {
  const { id } = useLocalSearchParams();
  const sectionId = String(id);
  const section = getSection(sectionId);
  const activeSubIndex = useNavStore((s) => s.activeSubIndex);
  const enterSection = useNavStore((s) => s.enterSection);
  const active = section?.subActions[activeSubIndex];

  useEffect(() => {
    if (section) enterSection(sectionId);
  }, [sectionId, section, enterSection]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <Text style={styles.title}>{section?.title ?? 'Section'}</Text>
      <Text style={styles.sub}>
        Placeholder module surface. Sub-actions are mock — tap icons in the nav to switch the active
        pill.
      </Text>
      <View style={styles.card}>
        <Text style={styles.label}>Active sub-action</Text>
        <Text style={styles.value}>{active?.title ?? '—'}</Text>
      </View>
      <View style={styles.list}>
        {section?.subActions.map((action, index) => (
          <View
            key={action.id}
            style={[styles.row, index === activeSubIndex && styles.rowActive]}
          >
            <Text style={styles.rowText}>{action.title}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: 140,
    gap: spacing.md,
  },
  title: { ...typography.title, color: colors.text },
  sub: { ...typography.body, color: colors.text, opacity: 0.65 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  label: { ...typography.label, color: colors.accent },
  value: { ...typography.headline, color: colors.text, marginTop: 4 },
  list: { gap: spacing.sm },
  row: {
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
  rowText: { ...typography.body, color: colors.text, fontWeight: '600' },
});
