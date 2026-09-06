import { Image, StyleSheet, Text, View } from 'react-native';
import { formatRelativeTime } from '@/src/lib/lostFound/relativeTime';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

const THUMB_SIZE = 56;

const STATUS_META = {
  claimed: { label: 'Claimed', color: colors.accent },
  resolved: { label: 'Resolved', color: colors.success },
};

export function ItemCard({ item }) {
  const statusMeta = STATUS_META[item.status];
  const isLost = item.type === 'lost';

  return (
    <View style={[styles.card, item.status === 'resolved' && styles.resolved]}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View
          style={[
            styles.thumb,
            styles.thumbFallback,
            { backgroundColor: isLost ? colors.danger : colors.success },
          ]}
        >
          <Text style={styles.thumbGlyph}>{isLost ? 'L' : 'F'}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <View style={[styles.typeTag, { backgroundColor: isLost ? colors.danger : colors.success }]}>
            <Text style={styles.typeTagText}>{isLost ? 'Lost' : 'Found'}</Text>
          </View>
        </View>

        <Text style={styles.category}>{item.categoryLabel}</Text>

        {statusMeta ? (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
            <Text style={styles.statusLabel}>{statusMeta.label}</Text>
          </View>
        ) : null}

        <Text style={styles.meta} numberOfLines={1}>
          {item.location} · {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    padding: spacing.sm,
  },
  resolved: {
    opacity: 0.55,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radii.md,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: '#fff',
  },
  body: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.label,
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  typeTag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  typeTagText: {
    ...typography.caption,
    fontSize: 10,
    color: '#fff',
  },
  category: {
    ...typography.caption,
    color: colors.textSoft,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
  },
  statusLabel: {
    ...typography.caption,
    color: colors.textSoft,
  },
  meta: {
    ...typography.caption,
    color: colors.textSoft,
    marginTop: 2,
  },
});
