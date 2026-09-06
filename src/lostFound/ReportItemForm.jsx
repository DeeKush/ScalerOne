import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { useLostFoundUiStore } from '@/src/store/lostFoundUiStore';
import { useCreateItem, useUpdateItem } from '@/src/hooks/useLostFoundItems';
import { analyzePhoto } from '@/src/lib/lostFound/photoAnalyzer';
import { LOST_FOUND_CATEGORIES } from '@/src/lib/lostFound/categories';
import { colors, fonts, radii, spacing, typography } from '@/src/theme/tokens';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isPlausiblePhoneNumber(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

// Picker results live in a temp/cache location the OS can clear at any time —
// copy into the app's persistent document directory so posted photos survive.
function persistPickedPhoto(sourceUri) {
  const source = new File(sourceUri);
  const extension = source.extension || '.jpg';
  const dest = new File(Paths.document, `lostfound-${Crypto.randomUUID()}${extension}`);
  source.copy(dest);
  return dest.uri;
}

/**
 * One form, two modes. Pass `editItem` to edit an existing post; the type
 * picker is hidden then, because `type` is not an editable field (see
 * EDITABLE_COLUMNS in localRepo.js).
 */
export function ReportItemForm({ initialType, editItem }) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const setToast = useLostFoundUiStore((s) => s.setToast);
  const createItem = useCreateItem();
  const updateItem = useUpdateItem(editItem?.id);
  const isEditing = Boolean(editItem);
  const mutation = isEditing ? updateItem : createItem;

  const [selectedType, setSelectedType] = useState(initialType ?? null);
  const [photoUri, setPhotoUri] = useState(editItem?.photoUrl || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [autofilled, setAutofilled] = useState(false);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [title, setTitle] = useState(editItem?.title ?? '');
  const [category, setCategory] = useState(editItem?.category ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [location, setLocation] = useState(editItem?.location ?? '');
  const [eventDate, setEventDate] = useState(
    editItem?.eventDate ? new Date(editItem.eventDate) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phone, setPhone] = useState(editItem?.contactValue || profile?.phone || '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const effectiveType = editItem?.type ?? initialType ?? selectedType;
  const isLost = effectiveType === 'lost';

  const copy = {
    descriptionPlaceholder: !effectiveType
      ? 'Describe it — color, brand, any distinguishing marks, condition...'
      : isLost
        ? 'Describe it — color, brand, any distinguishing marks...'
        : 'Describe what you found and its condition...',
    locationLabel: !effectiveType
      ? 'Where did you last see or find it?'
      : isLost
        ? 'Where did you last see it?'
        : 'Where did you find it?',
    dateLabel: !effectiveType
      ? 'When did this happen?'
      : isLost
        ? 'When did you lose it?'
        : 'When did you find it?',
    submitLabel: isEditing
      ? 'Save Changes'
      : !effectiveType
        ? 'Post Item'
        : isLost
          ? 'Post Lost Item'
          : 'Post Found Item',
  };

  const runAnalysis = async (uri) => {
    setAnalyzing(true);
    setNoteDismissed(false);
    try {
      const result = await analyzePhoto(uri);
      setTitle((prev) => (prev.trim() ? prev : result.suggestedTitle));
      setCategory((prev) => (prev ? prev : result.suggestedCategory));
      setDescription((prev) => (prev.trim() ? prev : result.suggestedDescription));
      setAutofilled(true);
    } finally {
      setAnalyzing(false);
    }
  };

  const onPickedPhoto = (uri) => {
    let persistedUri;
    try {
      persistedUri = persistPickedPhoto(uri);
    } catch (err) {
      Alert.alert('Could not save photo', err?.message ?? 'Please try again.');
      return;
    }
    setPhotoUri(persistedUri);
    setAutofilled(false);
    runAnalysis(persistedUri);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera permission needed', 'Enable camera access in settings to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) onPickedPhoto(result.assets[0].uri);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Enable photo library access in settings to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) onPickedPhoto(result.assets[0].uri);
  };

  const onPressPhoto = () => {
    Alert.alert('Add a photo', undefined, [
      { text: 'Take Photo', onPress: pickFromCamera },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const validate = () => {
    const nextErrors = {};
    if (!isEditing && !initialType && !selectedType) nextErrors.type = 'Choose Lost or Found';
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!category) nextErrors.category = 'Pick a category';
    if (!location.trim()) nextErrors.location = 'Location is required';
    if (!eventDate) nextErrors.eventDate = 'Pick a date';
    if (!isPlausiblePhoneNumber(phone)) nextErrors.phone = 'Enter a valid WhatsApp number';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitError(null);

    // Editing only ever sends content fields — type/postedBy/status/createdAt
    // are not user-editable and the repo rejects them anyway.
    const content = {
      title: title.trim(),
      category,
      description: description.trim(),
      location: location.trim(),
      eventDate: eventDate.toISOString(),
      photoUrl: photoUri ?? '',
      contactPreference: 'whatsapp',
      contactValue: phone.trim(),
    };

    try {
      if (isEditing) {
        await updateItem.mutateAsync(content);
        setToast('Post updated.');
        router.back();
        return;
      }
      await createItem.mutateAsync({
        ...content,
        type: effectiveType,
        status: 'open',
        postedBy: profile?.uid ?? 'unknown',
        postedByName: profile?.fullName ?? 'Scaler Student',
      });
      setToast(isLost ? 'Lost item posted.' : 'Found item posted.');
      router.replace('/(hub)/lost-found');
    } catch (err) {
      // Surface failures inline. Alert.alert is a no-op on react-native-web, so
      // relying on it alone made a failed submit look like nothing happened.
      console.error(`[lost-found] ${isEditing ? 'updateItem' : 'createItem'} failed`, err);
      setSubmitError(
        err?.message ?? `Could not ${isEditing ? 'save changes' : 'post item'}. Please try again.`
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!initialType && !isEditing ? (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>What happened?</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeOption, selectedType === 'lost' && styles.typeOptionActive]}
                onPress={() => setSelectedType('lost')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'lost' && styles.typeOptionTextActive,
                  ]}
                >
                  I lost something
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeOption, selectedType === 'found' && styles.typeOptionActive]}
                onPress={() => setSelectedType('found')}
              >
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'found' && styles.typeOptionTextActive,
                  ]}
                >
                  I found something
                </Text>
              </Pressable>
            </View>
            {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Photo</Text>
          <Pressable style={styles.photoBox} onPress={onPressPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlus}>+</Text>
                <Text style={styles.photoLabel}>Add a photo</Text>
              </View>
            )}
          </Pressable>
          {photoUri ? (
            <Pressable onPress={onPressPhoto} hitSlop={8}>
              <Text style={styles.photoChange}>Change photo</Text>
            </Pressable>
          ) : null}
          {analyzing ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.analyzingText}>Analyzing photo...</Text>
            </View>
          ) : null}
          {autofilled && !noteDismissed ? (
            <View style={styles.autofillNote}>
              <Text style={styles.autofillText}>
                Auto-filled from your photo — review and edit before posting.
              </Text>
              <Pressable onPress={() => setNoteDismissed(true)} hitSlop={8}>
                <Text style={styles.autofillDismiss}>×</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Black Wildcraft Backpack"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {LOST_FOUND_CATEGORIES.map((c) => {
              const active = category === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategory(c.id)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={copy.descriptionPlaceholder}
            placeholderTextColor={colors.textSoft}
            style={[styles.input, styles.textarea]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{copy.locationLabel}</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Library, 2nd floor"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
          />
          {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>{copy.dateLabel}</Text>
          <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>{formatDate(eventDate)}</Text>
          </Pressable>
          {showDatePicker ? (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (event.type === 'set' && selectedDate) setEventDate(selectedDate);
              }}
            />
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Your WhatsApp number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 98765 43210"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            keyboardType="phone-pad"
          />
          <Text style={styles.helperText}>
            Only shared with someone who matches with this post.
          </Text>
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>

        {submitError ? (
          <View style={styles.submitErrorBox}>
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.submitButton, mutation.isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>{copy.submitLabel}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 160,
    gap: spacing.lg,
  },
  field: { gap: spacing.xs },
  fieldLabel: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSoft,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
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
    minHeight: 96,
    paddingTop: spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
  },
  typeOptionActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  typeOptionText: {
    ...typography.label,
    fontSize: 14,
    color: colors.text,
  },
  typeOptionTextActive: {
    color: '#fff',
  },
  photoBox: {
    width: 120,
    height: 120,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPlus: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    color: colors.textSoft,
  },
  photoLabel: {
    ...typography.caption,
    color: colors.textSoft,
  },
  photoChange: {
    ...typography.caption,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  analyzingText: {
    ...typography.caption,
    color: colors.textSoft,
  },
  autofillNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  autofillText: {
    ...typography.caption,
    color: colors.accent,
    flex: 1,
  },
  autofillDismiss: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accent,
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
  dateButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.muted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
    minWidth: 160,
  },
  dateButtonText: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
  },
  submitErrorBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  submitErrorText: {
    ...typography.caption,
    color: colors.danger,
  },
  submitButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.label,
    fontSize: 15,
    color: '#fff',
  },
});
