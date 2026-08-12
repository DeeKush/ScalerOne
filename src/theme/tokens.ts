/** Academic Blue — Decision 6 */
export const colors = {
  bg: '#F7F9FC',
  surface: '#FFFFFF',
  text: '#1B2430',
  accent: '#4A90E2',
  muted: '#D8DADF',
  accentSoft: 'rgba(74, 144, 226, 0.18)',
  glass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.55)',
  danger: '#D64545',
  success: '#2F9E6B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.4 },
  headline: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
} as const;
