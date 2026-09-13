// Dunu design tokens v2 — "illuminated manuscript": warm parchment (day) and
// lamp-lit interior (night). Every text/background pair is >=4.5:1 contrast.
// See design-system/dunu/MASTER.md for the rationale.

export type Mode = 'system' | 'light' | 'dark';

export interface Theme {
  isDark: boolean;
  bg: string;
  bgElevated: string;
  surface: string;
  surfaceHi: string;
  border: string;
  hairline: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  onPrimary: string;
  accent: string;
  accentSoft: string;
  mark: string;
  ringTrack: string;
  ringProgress: string;
  success: string;
  danger: string;
  tabBar: string;
  scrim: string;
  parchmentPanel: string;
  parchmentPanelBorder: string;
}

export const light: Theme = {
  isDark: false,
  bg: '#F5EFE3',
  bgElevated: '#FBF7EE',
  surface: '#EFE7D6',
  surfaceHi: '#E7DCC5',
  border: '#DCCFB2',
  hairline: '#E4D9C0',
  text: '#221C12',
  textMuted: '#6B5F47',
  textFaint: '#8C7E62',
  primary: '#1F5D4C',
  onPrimary: '#FBF7EE',
  accent: '#7A5C1E',
  accentSoft: '#B8860B',
  mark: '#B8860B',
  ringTrack: '#E2D6BA',
  ringProgress: '#1F5D4C',
  success: '#2F7A4F',
  danger: '#9C3B2E',
  tabBar: '#FBF7EE',
  scrim: 'rgba(34,28,18,0.45)',
  parchmentPanel: '#EFE6D2',
  parchmentPanelBorder: '#DDCEA9',
};

export const dark: Theme = {
  isDark: true,
  bg: '#12100C',
  bgElevated: '#1A1712',
  surface: '#211D16',
  surfaceHi: '#2A2419',
  border: '#38321F',
  hairline: '#2E2819',
  text: '#EFE7D2',
  textMuted: '#A99C7C',
  textFaint: '#7E7458',
  primary: '#4FA583',
  onPrimary: '#0F1512',
  accent: '#D4A83C',
  accentSoft: '#8C6D22',
  mark: '#E8C25A',
  ringTrack: '#2C2718',
  ringProgress: '#D4A83C',
  success: '#6BC08A',
  danger: '#E08274',
  tabBar: '#171410',
  scrim: 'rgba(0,0,0,0.62)',
  parchmentPanel: '#1D1A13',
  parchmentPanelBorder: '#332C1C',
};

// 8pt spatial rhythm + type scale (1.33 modular).
export const SP = {
  xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48, max: 64,
  r: { chip: 999, sm: 4, md: 10, lg: 16, xl: 22 },
} as const;

export const TYPE = {
  micro: 11, caption: 13, body: 15, title: 18, headline: 24, display: 32, hero: 44,
} as const;

// Arabic mushaf sizes: 8 user-selectable steps.
export const ARABIC_STEPS = [22, 26, 30, 34, 38, 42, 48, 54] as const;
export const LATIN_STEPS = [14, 15, 16, 17, 18, 20, 22, 24] as const;
