import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HUB_SECTIONS } from '@/src/data/hubSections';
import { colors, radii, spacing, typography } from '@/src/theme/tokens';

export default function HubDashboard() {
  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.root}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.sub}>
        Placeholder home. Pick a module from the floating nav — content modules ship after the motion
        MVP.
      </Text>
      <View style={styles.grid}>
        {HUB_SECTIONS.map((section) => (
          <View key={section.id} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardSub}>{section.subActions.length} actions</Text>
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
  sub: { ...typography.body, color: colors.textSoft },
  grid: { gap: spacing.sm, marginTop: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  cardTitle: { ...typography.headline, fontSize: 17, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textSoft, marginTop: 4 },
});
