// Core theme: dark/light palette + spacing/typography scale.
//伊斯兰 aesthetic: deep emerald + gold accents, restrained neutrals.

export const PALETTE = {
  emerald: '#0E7C66',
  emeraldDeep: '#0A5C4C',
  gold: '#C9A227',
  goldSoft: '#E3C86A',
} as const;

export interface Theme {
  isDark: boolean;
  bg: string;
  bgElevated: string;
  card: string;
  cardBorder: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  accent: string;
  ring: string;
  ringTrack: string;
  success: string;
  danger: string;
  tabBar: string;
  overlay: string;
}

export const lightTheme: Theme = {
  isDark: false,
  bg: '#F6F5F0',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E6E3DA',
  text: '#15251F',
  textMuted: '#6B7A73',
  primary: PALETTE.emerald,
  onPrimary: '#FFFFFF',
  accent: PALETTE.gold,
  ring: PALETTE.emerald,
  ringTrack: '#E2E0D8',
  success: '#16A34A',
  danger: '#DC2626',
  tabBar: '#FFFFFF',
  overlay: 'rgba(21,37,31,0.45)',
};

export const darkTheme: Theme = {
  isDark: true,
  bg: '#0B1210',
  bgElevated: '#111A17',
  card: '#141F1B',
  cardBorder: '#22322C',
  text: '#E9EFEA',
  textMuted: '#8FA39A',
  primary: '#2DD4B7',
  onPrimary: '#04120E',
  accent: PALETTE.goldSoft,
  ring: '#2DD4B7',
  ringTrack: '#1E2D28',
  success: '#34D399',
  danger: '#F87171',
  tabBar: '#0E1714',
  overlay: 'rgba(0,0,0,0.6)',
};

export const SP = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  radius: { sm: 10, md: 16, lg: 24, pill: 999 },
} as const;

export const TYPE = {
  arabic: { fontFamily: 'serif', lineHeight: 52 },
  title: { fontSize: 22, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 23 },
  muted: { fontSize: 13, lineHeight: 19 },
} as const;

/** Arabic font size presets for the reading screen (Utsmani-style scaling). */
export const ARABIC_SIZE_PRESETS = [22, 26, 30, 36, 44] as const;
export const LATIN_SIZE_PRESETS = [14, 16, 18, 20, 24] as const;
