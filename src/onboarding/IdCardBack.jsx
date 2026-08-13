import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { idCard, radii } from '@/src/theme/tokens';
import { ISSUING_AUTHORITY, SST_ADDRESS, SHIELD_PATH } from '@/src/onboarding/campus';

function dash(value) {
  return value && String(value).trim() ? value : '—';
}

export function IdCardBack({ data }) {
  const year = data?.passOutYear;
  const valid = year ? `Valid up to June ${year}` : 'Valid up to —';
  const phone = data?.phoneVerified && data?.phone ? data.phone : '—';

  return (
    <View style={styles.card}>
      <View style={styles.watermark} pointerEvents="none">
        <Svg width={180} height={210} viewBox="0 0 100 120">
          <Path d={SHIELD_PATH} fill={idCard.navy} opacity={0.06} />
        </Svg>
      </View>

      <View style={styles.block}>
        <Text style={styles.line}>DOB - {dash(data?.dob)}</Text>
      </View>
      <View style={styles.rule} />
      <View style={styles.block}>
        <Text style={styles.line}>Blood Group - {dash(data?.bloodGroup)}</Text>
      </View>
      <View style={styles.rule} />
      <View style={styles.block}>
        <Text style={styles.line}>Emergency Contact</Text>
        <Text style={styles.soft}>{dash(data?.emergencyContact)}</Text>
      </View>
      <View style={styles.rule} />

      <View style={styles.addressBlock}>
        <Text style={styles.address}>
          <Text style={styles.line}>Address </Text>
          - {SST_ADDRESS}
        </Text>
      </View>

      <View style={styles.signBlock}>
        <Text style={styles.signature}>{ISSUING_AUTHORITY}</Text>
        <Text style={styles.soft}>Issuing Authority</Text>
        <Text style={styles.line}>{ISSUING_AUTHORITY}</Text>
      </View>

      {phone !== '—' ? (
        <Text style={styles.phoneNote}>Phone · {phone}</Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{valid}</Text>
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
    paddingTop: 18,
  },
  watermark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  line: {
    color: idCard.navy,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  soft: {
    color: idCard.navy,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: idCard.divider,
    marginHorizontal: 18,
  },
  addressBlock: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  address: {
    color: idCard.navy,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  signBlock: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 12,
  },
  signature: {
    fontSize: 20,
    color: idCard.navy,
    fontWeight: '400',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  phoneNote: {
    textAlign: 'center',
    color: idCard.navy,
    fontSize: 11,
    opacity: 0.55,
    marginBottom: 8,
  },
  footer: {
    backgroundColor: idCard.footer,
    paddingVertical: 10,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
