// Shared presentational primitives.

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useTheme } from '../store/stores';
import { darkTheme, lightTheme, SP, type Theme } from '../../core/theme/theme';

export function useT(): Theme {
  const sys = useColorScheme();
  const { mode } = useTheme();
  const dark = mode === 'dark' || (mode === 'system' && sys === 'dark');
  return dark ? darkTheme : lightTheme;
}

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useT();
  return <View style={[{ flex: 1, backgroundColor: t.bg }, style]}>{children}</View>;
}

export function Chip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: SP.radius.pill,
        borderWidth: 1,
        borderColor: active ? (color ?? t.primary) : t.cardBorder,
        backgroundColor: active ? (color ?? t.primary) : 'transparent',
        opacity: pressed ? 0.75 : 1,
        marginRight: 8,
        marginBottom: 8,
      })}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.onPrimary : t.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Progress ring drawn with stacked Views (no SVG dependency, RN + web safe). */
export function ProgressRing({
  ratio,
  size,
  stroke,
  color,
  track,
  children,
}: {
  ratio: number;
  size: number;
  stroke: number;
  color: string;
  track: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio));
  // Segment arc with small dashes so it reads as a ring even without SVG.
  const segments = 60;
  const filled = Math.round(clamped * segments);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: track, padding: stroke }}>
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: segments }).map((_, i) => {
          const angle = (i / segments) * 360;
          const on = i < filled;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: size / 2 - 1.5,
                top: size / 2 - r - 6,
                width: 3,
                height: 12,
                borderRadius: 2,
                backgroundColor: on ? color : 'transparent',
                transform: [{ rotate: `${angle}deg` }, { translateY: 0 }],
                opacity: on ? 1 : 0,
              }}
            />
          );
        })}
      </View>
      <View
        style={{
          width: size - stroke * 2,
          height: size - stroke * 2,
          borderRadius: (size - stroke * 2) / 2,
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
      <Text style={{ display: 'none' }}>{circ}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const t = useT();
  return (
    <Text style={{ color: t.textMuted, fontSize: 11, letterSpacing: 2.2, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase' }}>
      {children}
    </Text>
  );
}

export const fmtTime = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
