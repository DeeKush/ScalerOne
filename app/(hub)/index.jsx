import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
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
            {section.art ? (
              <Image source={section.art} style={styles.cardArt} resizeMode="contain" />
            ) : (
              <View style={styles.cardArtFallback} />
            )}
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{section.title}</Text>
              <Text style={styles.cardSub}>{section.subActions.length} actions</Text>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  cardArt: {
    width: 44,
    height: 44,
  },
  cardArtFallback: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  cardText: { flex: 1 },
  cardTitle: { ...typography.headline, fontSize: 17, color: colors.text },
  cardSub: { ...typography.caption, color: colors.textSoft, marginTop: 4 },
});
