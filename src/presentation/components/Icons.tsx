// Custom inline SVG icon set — 24px grid, 1.5 stroke, rounded caps.
// Replaces every emoji glyph from v1 (the single biggest "AI slop" tell).
// All icons are decorative by default; callers add labels when a glyph is the
// sole control. Colour comes from the theme, never hardcoded.

import React from 'react';
import Svg, { Path, Circle, G, Rect, Line, Polyline } from 'react-native-svg';
import { useT } from '../theme/ThemeProvider';

type P = { size?: number; color?: string; strokeWidth?: number; style?: object };

const useIcon = (color?: string) => {
  const t = useT();
  return color ?? t.text;
};

export const IconSunrise = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 3v3M5.6 7.6l2.1 2.1M18.4 7.6l-2.1 2.1M3 17h3M18 17h3" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M8 17a4 4 0 0 1 8 0" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M2 21h20" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.55} />
    </Svg>
  );
};

export const IconSunset = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 9V4M6.5 8.5 8.8 6.8M17.5 8.5 15.2 6.8M3 17h4M17 17h4" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.7} />
      <Path d="M7.5 17a4.5 4.5 0 0 1 9 0" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M2 21h20M12 13l-2.5 2.5M12 13l2.5 2.5" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const IconMosque = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 2.5c1.8 1.6 2.8 3 2.8 4.3 0 1.3-1.2 2.2-2.8 2.2s-2.8-.9-2.8-2.2c0-1.3 1-2.7 2.8-4.3Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M5 21v-6.5c0-2.5 2-4 3.5-5M19 21v-6.5c0-2.5-2-4-3.5-5" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M9.5 21v-3a2.5 2.5 0 0 1 5 0v3" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M3 21h18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

export const IconMoon = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M17.5 4.5v3M16 6h3" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" opacity={0.8} />
    </Svg>
  );
};

export const IconShield = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 2.8 4.5 6v6c0 4.4 3.1 8.1 7.5 9.2 4.4-1.1 7.5-4.8 7.5-9.2V6L12 2.8Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M9 11.8 11.2 14l4-4.2" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const IconSeed = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 21v-7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M12 14c0-3.9 3.1-7 7-7 0 3.9-3.1 7-7 7Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M12 16c0-3.3-2.7-6-6-6 0 3.3 2.7 6 6 6Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" opacity={0.75} />
    </Svg>
  );
};

export const IconBook = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M12 6.5C10.4 5 8.4 4.3 4.5 4.3v13c3.9 0 5.9.7 7.5 2.2 1.6-1.5 3.6-2.2 7.5-2.2v-13c-3.9 0-5.9.7-7.5 2.2Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <Path d="M12 6.5v13" stroke={c} strokeWidth={strokeWidth} opacity={0.6} />
    </Svg>
  );
};

export const IconBookmark = ({ size = 24, color, strokeWidth = 1.6, filled = false, style }: P & { filled?: boolean }) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c : 'none'} style={style}>
      <Path d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
};

export const IconSearch = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx={11} cy={11} r={6.5} stroke={c} strokeWidth={strokeWidth} />
      <Path d="m16 16 4.5 4.5" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

export const IconBeads = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx={12} cy={12} r={7.5} stroke={c} strokeWidth={strokeWidth} opacity={0.35} />
      <Circle cx={12} cy={4.5} r={1.5} fill={c} />
      <Circle cx={17.3} cy={6.7} r={1.5} fill={c} />
      <Circle cx={19.5} cy={12} r={1.5} fill={c} />
      <Circle cx={17.3} cy={17.3} r={1.5} fill={c} />
      <Circle cx={6.7} cy={17.3} r={1.5} fill={c} />
      <Circle cx={4.5} cy={12} r={1.5} fill={c} />
      <Circle cx={6.7} cy={6.7} r={1.5} fill={c} />
      <Circle cx={12} cy={21.2} r={1.9} stroke={c} strokeWidth={1.2} />
    </Svg>
  );
};

export const IconFlame = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M13 2.5c.6 3 3.5 4.4 4.7 7.3 1.4 3.4-.6 8.7-5.2 9.7-4.2.9-8-2.1-7.6-6.2.3-3 2.5-4.3 3.3-6.8.4.9.3 2 .1 2.8 1.3-.4 2.2-1.6 2.5-3.2.3-1.3.8-2.5 2.2-3.6Z" stroke={c} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </Svg>
  );
};

export const IconChevronLeft = ({ size = 24, color, strokeWidth = 1.8, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="m15 5-7 7 7 7" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const IconClose = ({ size = 24, color, strokeWidth = 1.8, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M6 6l12 12M18 6 6 18" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

export const IconPlay = ({ size = 24, color, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Path d="M8 5.5v13l11-6.5L8 5.5Z" fill={c} />
    </Svg>
  );
};

export const IconPause = ({ size = 24, color, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Rect x={7.5} y={5.5} width={3.4} height={13} rx={1.2} fill={c} />
      <Rect x={13.1} y={5.5} width={3.4} height={13} rx={1.2} fill={c} />
    </Svg>
  );
};

export const IconLoop = ({ size = 24, color, strokeWidth = 1.7, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M4 12a8 8 0 0 1 8-8c3 0 5.4 1.5 6.8 3.8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Path d="M20 12a8 8 0 0 1-8 8c-3 0-5.4-1.5-6.8-3.8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="17,3.5 19,4 18.5,6.2" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <Polyline points="7,20.5 5,20 5.5,17.8" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const IconRefresh = ({ size = 24, color, strokeWidth = 1.7, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
      <Polyline points="18,3 17.6,6.9 13.8,6.4" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

export const IconMinus = ({ size = 24, color, strokeWidth = 1.8, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Line x1={5.5} y1={12} x2={18.5} y2={12} stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

export const IconUser = ({ size = 24, color, strokeWidth = 1.6, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Circle cx={12} cy={8} r={3.6} stroke={c} strokeWidth={strokeWidth} />
      <Path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" />
    </Svg>
  );
};

export const IconCheck = ({ size = 24, color, strokeWidth = 1.9, style }: P) => {
  const c = useIcon(color);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <Polyline points="4.5,12.5 9.5,17.5 19.5,6.5" stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};
