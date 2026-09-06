import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useItem,
  useClaimsForItem,
  useClaimItem,
  useReopenItem,
  useResolveItem,
} from '@/src/hooks/useLostFoundItems';
import { useAuthStore } from '@/src/store/authStore';
import { useNavStore } from '@/src/store/navStore';
import { formatRelativeTime } from '@/src/lib/lostFound/relativeTime';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

const STATUS_META = {
  claimed: { label: 'Claimed', color: colors.accent },
  resolved: { label: 'Resolved', color: colors.success },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(input) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default function ItemDetailScreen() {
  const router = useRouter();
  const { itemId } = useLocalSearchParams();
  const id = String(itemId ?? '');
  const enterSection = useNavStore((s) => s.enterSection);
  const profile = useAuthStore((s) => s.profile);
  const viewerUid = profile?.uid ?? 'unknown';

  const { data: item, isPending, isError } = useItem(id);
  const { data: claims = [] } = useClaimsForItem(id);
  const claimItem = useClaimItem(id);
  const resolveItem = useResolveItem(id);
  const reopenItem = useReopenItem(id);

  const [claimOpen, setClaimOpen] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimError, setClaimError] = useState(null);
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    enterSection('lost-found');
  }, [enterSection]);

  const goBackToFeed = () => router.replace('/(hub)/lost-found');

  if (id && isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (!id || isError || !item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundTitle}>Item not found</Text>
        <Text style={styles.notFoundBody}>
          This post may have been removed, or the link is out of date.
        </Text>
        <Pressable style={styles.primaryButton} onPress={goBackToFeed}>
          <Text style={styles.primaryButtonText}>Back to Lost &amp; Found</Text>
        </Pressable>
      </View>
    );
  }

  const isLost = item.type === 'lost';
  const isPoster = item.postedBy === viewerUid;
  const statusMeta = STATUS_META[item.status];
  const myClaim = claims.find((c) => c.claimerUid === viewerUid);
  const canClaim = !isPoster && item.status === 'open' && !myClaim;

  const copy = {
    locationLabel: isLost ? 'Last seen at' : 'Found at',
    dateLabel: isLost ? 'When did you lose it' : 'When did you find it',
    claimCta: isLost ? 'I found this' : 'This is mine',
  };

  const onSubmitClaim = async () => {
    setClaimError(null);
    try {
      await claimItem.mutateAsync({
        claimerUid: viewerUid,
        message: claimMessage.trim(),
        claimerName: profile?.fullName ?? 'Scaler Student',
      });
      setClaimOpen(false);
      setClaimMessage('');
    } catch (err) {
      console.error('[lost-found] claimItem failed', err);
      setClaimError(err?.message ?? 'Could not send that. Please try again.');
    }
  };

  const onResolve = async () => {
    setActionError(null);
    try {
      await resolveItem.mutateAsync();
      setConfirmResolve(false);
    } catch (err) {
      console.error('[lost-found] resolveItem failed', err);
      setActionError(err?.message ?? 'Could not mark this resolved. Please try again.');
    }
  };

  const onReopen = async () => {
    setActionError(null);
    try {
      await reopenItem.mutateAsync();
      setConfirmReopen(false);
    } catch (err) {
      console.error('[lost-found] reopenItem failed', err);
      setActionError(err?.message ?? 'Could not reopen this post. Please try again.');
    }
  };

  const onWhatsApp = () => {
    const number = String(item.contactValue ?? '').replace(/\D/g, '');
    if (!number) {
      setActionError('This poster did not leave a WhatsApp number.');
      return;
    }
    const text = `Hi, I saw your ${item.type} post for '${item.title}' on Scaler Hub.`;
    Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(text)}`).catch((err) => {
      console.error('[lost-found] opening WhatsApp failed', err);
      setActionError('Could not open WhatsApp.');
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={goBackToFeed}
            style={styles.backHit}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </View>

        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View
            style={[styles.photo, styles.photoPlaceholder, { backgroundColor: isLost ? colors.danger : colors.success }]}
          >
            <Text style={styles.photoGlyph}>{isLost ? 'L' : 'F'}</Text>
          </View>
        )}

        <View style={styles.badgeRow}>
          <View style={[styles.typeTag, { backgroundColor: isLost ? colors.danger : colors.success }]}>
            <Text style={styles.typeTagText}>{isLost ? 'Lost' : 'Found'}</Text>
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryTagText}>{item.categoryLabel}</Text>
          </View>
          {statusMeta ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
              <Text style={styles.statusLabel}>{statusMeta.label}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

        <View style={styles.metaBlock}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{copy.locationLabel}</Text>
            <Text style={styles.metaValue}>{item.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{copy.dateLabel}</Text>
            <Text style={styles.metaValue}>{formatDate(item.eventDate)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Posted by</Text>
            <Text style={styles.metaValue}>{item.postedByName}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Posted</Text>
            <Text style={styles.metaValue}>{formatRelativeTime(item.createdAt)}</Text>
          </View>
        </View>

        {actionError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{actionError}</Text>
          </View>
        ) : null}

        {/* Claimer side */}
        {!isPoster ? (
          <View style={styles.section}>
            {canClaim ? (
              <Pressable style={styles.primaryButton} onPress={() => setClaimOpen(true)}>
                <Text style={styles.primaryButtonText}>{copy.claimCta}</Text>
              </Pressable>
            ) : null}

            {myClaim ? (
              <View style={styles.claimCard}>
                <Text style={styles.claimCardLabel}>Your claim</Text>
                {myClaim.message ? (
                  <Text style={styles.claimMessage}>{myClaim.message}</Text>
                ) : (
                  <Text style={styles.claimMessageMuted}>No message sent.</Text>
                )}
                <Text style={styles.claimMeta}>{formatRelativeTime(myClaim.createdAt)}</Text>
              </View>
            ) : null}

            {myClaim ? (
              <Pressable style={styles.whatsappButton} onPress={onWhatsApp}>
                <Text style={styles.whatsappButtonText}>Message on WhatsApp</Text>
              </Pressable>
            ) : null}

            {!canClaim && !myClaim && item.status !== 'open' ? (
              <Text style={styles.mutedNote}>
                This item is {item.status}. Claims are closed.
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Poster side */}
        {isPoster ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Claims received{claims.length ? ` (${claims.length})` : ''}
            </Text>

            {claims.length === 0 ? (
              <Text style={styles.mutedNote}>No one has claimed this yet.</Text>
            ) : (
              claims.map((claim) => (
                <View key={claim.id} style={styles.claimCard}>
                  <Text style={styles.claimCardLabel}>{claim.claimerName || 'Scaler Student'}</Text>
                  {claim.message ? (
                    <Text style={styles.claimMessage}>{claim.message}</Text>
                  ) : (
                    <Text style={styles.claimMessageMuted}>No message sent.</Text>
                  )}
                  <Text style={styles.claimMeta}>{formatRelativeTime(claim.createdAt)}</Text>
                </View>
              ))
            )}

            {item.status === 'resolved' ? (
              <>
                <View style={styles.resolvedRow}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={styles.resolvedText}>Resolved</Text>
                </View>
                {confirmReopen ? (
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmText}>Reopen this post?</Text>
                    <View style={styles.confirmRow}>
                      <Pressable
                        style={[styles.confirmButton, styles.confirmCancel]}
                        onPress={() => setConfirmReopen(false)}
                      >
                        <Text style={styles.confirmCancelText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.confirmButton, styles.confirmYes]}
                        onPress={onReopen}
                        disabled={reopenItem.isPending}
                      >
                        {reopenItem.isPending ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.confirmYesText}>Yes, reopen</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable style={styles.secondaryButton} onPress={() => setConfirmReopen(true)}>
                    <Text style={styles.secondaryButtonText}>Reopen</Text>
                  </Pressable>
                )}
              </>
            ) : claims.length > 0 ? (
              confirmResolve ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmText}>Mark this as resolved?</Text>
                  <View style={styles.confirmRow}>
                    <Pressable
                      style={[styles.confirmButton, styles.confirmCancel]}
                      onPress={() => setConfirmResolve(false)}
                    >
                      <Text style={styles.confirmCancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.confirmButton, styles.confirmYes]}
                      onPress={onResolve}
                      disabled={resolveItem.isPending}
                    >
                      {resolveItem.isPending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.confirmYesText}>Yes, resolve</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable style={styles.primaryButton} onPress={() => setConfirmResolve(true)}>
                  <Text style={styles.primaryButtonText}>Mark Resolved</Text>
                </Pressable>
              )
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={claimOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setClaimOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setClaimOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{copy.claimCta}</Text>
            <Text style={styles.sheetBody}>
              Add a detail only the owner would know — it helps them recognise you.
            </Text>
            <TextInput
              value={claimMessage}
              onChangeText={setClaimMessage}
              placeholder="e.g. It has a blue sticker on the back"
              placeholderTextColor={colors.textSoft}
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            {claimError ? <Text style={styles.errorText}>{claimError}</Text> : null}
            <Pressable
              style={[styles.primaryButton, claimItem.isPending && styles.buttonDisabled]}
              onPress={onSubmitClaim}
              disabled={claimItem.isPending}
            >
              {claimItem.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Send claim</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
    flex: 1,
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: radii.card,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGlyph: {
    fontFamily: fonts.extraBold,
    fontSize: 48,
    color: '#fff',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeTag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeTagText: {
    ...typography.caption,
    fontSize: 11,
    color: '#fff',
  },
  categoryTag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  categoryTagText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  title: {
    ...typography.headline,
    fontSize: 20,
    color: colors.text,
  },
  description: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSoft,
  },
  metaBlock: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    padding: spacing.md,
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  metaLabel: {
    ...typography.caption,
    color: colors.textSoft,
  },
  metaValue: {
    ...typography.label,
    fontSize: 13,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  mutedNote: {
    ...typography.caption,
    color: colors.textSoft,
  },
  claimCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  claimCardLabel: {
    ...typography.label,
    fontSize: 13,
    color: colors.text,
  },
  claimMessage: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
  },
  claimMessageMuted: {
    ...typography.caption,
    color: colors.textSoft,
    fontStyle: 'italic',
  },
  claimMeta: {
    ...typography.caption,
    color: colors.textSoft,
  },
  primaryButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.label,
    fontSize: 15,
    color: '#fff',
  },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  whatsappButton: {
    backgroundColor: colors.success,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappButtonText: {
    ...typography.label,
    fontSize: 15,
    color: '#fff',
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  resolvedText: {
    ...typography.label,
    fontSize: 14,
    color: colors.success,
  },
  confirmBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    padding: spacing.md,
    gap: spacing.sm,
  },
  confirmText: {
    ...typography.label,
    fontSize: 14,
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
  confirmYes: {
    backgroundColor: colors.text,
  },
  confirmYesText: {
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
  notFoundTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  notFoundBody: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(27,36,48,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.headline,
    fontSize: 18,
    color: colors.text,
  },
  sheetBody: {
    ...typography.caption,
    color: colors.textSoft,
  },
  input: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  textarea: {
    minHeight: 80,
    paddingTop: spacing.sm,
  },
});
