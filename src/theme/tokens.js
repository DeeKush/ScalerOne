/** Academic Blue — Decision 6 */

export const fonts = {
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const colors = {
  bg: '#F7F9FC',
  bgWash: '#DCEAFB',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F6FB',
  text: '#1B2430',
  textSoft: '#5B6573',
  accent: '#4A90E2',
  muted: '#D8DADF',
  line: '#E2E8F0',
  accentSoft: 'rgba(74, 144, 226, 0.18)',
  glass: 'rgba(255, 255, 255, 0.72)',
  glassAndroid: 'rgba(255, 255, 255, 0.94)',
  glassBorder: 'rgba(255, 255, 255, 0.55)',
  sheetFill: 'rgba(255, 255, 255, 0.97)',
  white: '#FFFFFF',
  danger: '#D64545',
  success: '#2F9E6B',
};

export const bgPage = colors.bg;
export const accentPrimary = colors.accent;

export const idCard = {
  header: '#2F6FE4',
  navy: '#1A2744',
  footer: '#5C4ED0',
  divider: '#E4E6EA',
  placeholder: '#9AA3B2',
  photoFill: '#C5CDD8',
  aspect: 0.63,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 16,
  card: 18,
  sheet: 28,
  pill: 999,
};

export const shadows = {
  card: {
    shadowColor: idCard.navy,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  sheet: {
    shadowColor: idCard.navy,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  nav: {
    shadowColor: idCard.navy,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
};

export const typography = {
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
};
