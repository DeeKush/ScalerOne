import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { idCard, radii } from '@/src/theme/tokens';
import { SST_CAMPUS, SHIELD_PATH } from '@/src/onboarding/campus';
import { ShieldPhoto } from '@/src/onboarding/ShieldPhoto';

function ScalerMark({ size = 28 }) {
  return (
    <Svg width={size} height={size * 1.15} viewBox="0 0 100 120">
      <Path d={SHIELD_PATH} fill="#FFFFFF" />
      <Path
        d="M32 38 C44 28 56 28 68 38 C58 46 58 58 68 70 C56 80 44 80 32 70 C42 58 42 46 32 38 Z"
        fill={idCard.header}
      />
    </Svg>
  );
}

export function IdCardFront({ data }) {
  const filled = Boolean(data?.fullName);
  const name = filled ? data.fullName : 'Your name';
  const idLabel = data?.accountType === 'employee' ? 'Staff ID.' : 'Student ID.';
  const studentId = filled ? data.studentId || '—' : '————————';
  const campus = data?.campus || SST_CAMPUS;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <ScalerMark size={26} />
          <View>
            <Text style={styles.brand}>SCALER</Text>
            <Text style={styles.brandSub}>School of Technology</Text>
          </View>
        </View>
      </View>

      <View style={styles.photoWrap}>
        <ShieldPhoto size={118} uri={data?.photoUrl || null} />
      </View>

      <View style={styles.body}>
        <Text style={[styles.name, !filled && styles.placeholder]} numberOfLines={2}>
          {name}
        </Text>
        <Text style={styles.idLabel}>{idLabel}</Text>
        <Text style={[styles.studentId, !filled && styles.placeholder]}>{studentId}</Text>
        <View style={styles.rule} />
        <Text style={styles.campus}>{campus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  header: {
    height: '30%',
    backgroundColor: idCard.header,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  photoWrap: {
    alignItems: 'center',
    marginTop: -52,
    zIndex: 2,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  name: {
    color: idCard.navy,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholder: {
    color: idCard.placeholder,
    fontWeight: '600',
  },
  idLabel: {
    marginTop: 10,
    color: idCard.navy,
    fontSize: 12,
    opacity: 0.7,
  },
  studentId: {
    marginTop: 4,
    color: idCard.navy,
    fontSize: 18,
    fontWeight: '800',
  },
  rule: {
    marginTop: 16,
    width: '72%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: idCard.divider,
  },
  campus: {
    marginTop: 12,
    color: idCard.navy,
    fontSize: 13,
    opacity: 0.75,
  },
});
