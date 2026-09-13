// Shared primitives v2 — restrained "manuscript" styling:
// surface fills instead of 1px-border boxes, 8pt rhythm, real press feedback
// (scale + opacity, 140ms out / 220ms back), no emoji anywhere.

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { SP, TYPE } from '../../core/theme/tokens';
import { useT } from '../theme/ThemeProvider';

/** Face helpers: each registered family name already carries its weight, so we
 *  select the family directly instead of relying on (fallback-prone) weights. */
const SERIF_FAM = { '300': 'Cormorant Garamond', '400': 'Cormorant Garamond', '500': 'Cormorant Garamond', '600': 'Cormorant Garamond Semi' } as const;
const SANS_FAM = { '400': 'Public Sans', '500': 'Public Sans Medium', '600': 'Public Sans Semi', '700': 'Public Sans Semi' } as const;
const NASKH_FAM = { '400': 'Noto Naskh Arabic', '500': 'Noto Naskh Arabic Semi', '600': 'Noto Naskh Arabic Semi', '700': 'Noto Naskh Arabic Semi' } as const;

export const SERIF = (w: '300' | '400' | '500' | '600' = '500') => ({
  fontFamily: SERIF_FAM[w],
});
export const SANS = (w: '400' | '500' | '600' | '700' = '400') => ({
  fontFamily: SANS_FAM[w],
});
export const NASKH = (w: '400' | '500' | '600' | '700' = '400') => ({
  fontFamily: NASKH_FAM[w],
});

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useT();
  return <View style={[{ flex: 1, backgroundColor: t.bg }, style]}>{children}</View>;
}

/** Small tracked label used above sections; gold, quiet, never a shouty CAPS box. */
export function Meta({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useT();
  return <Text style={[SANS('400'), { fontSize: TYPE.caption, color: t.textFaint }, style]}>{children}</Text>;
}

export function Eyebrow({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useT();
  return (
    <Text
      style={[
        SANS('600'),
        { color: t.accent, fontSize: TYPE.micro, letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: SP.sm },
        style,
      ]}
      accessibilityRole="text"
    >
      {children}
    </Text>
  );
}

export function SectionHead({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  trailing?: React.ReactNode;
}) {
  const t = useT();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: SP.xl, marginBottom: SP.md }}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.headline, letterSpacing: -0.2 }]}>{title}</Text>
      </View>
      {trailing}
    </View>
  );
}

/** Tappable card with proper press physics. */
export function TapCard({
  onPress,
  children,
  style,
  ariaLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  ariaLabel?: string;
}) {
  const t = useT();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      style={({ pressed }) => [
        {
          backgroundColor: t.surface,
          borderRadius: SP.r.lg,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          opacity: pressed ? 0.85 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: pressed ? 140 : 220,
        },
        style as ViewStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
  compact,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  const t = useT();
  const body = (
    <Text style={[SANS(active ? '600' : '500'), { fontSize: TYPE.caption, color: active ? t.onPrimary : t.textMuted }]}>
      {label}
    </Text>
  );
  const base: ViewStyle = {
    paddingHorizontal: compact ? SP.md : SP.lg,
    paddingVertical: compact ? SP.xs + 1 : SP.sm,
    borderRadius: SP.r.chip,
    backgroundColor: active ? t.primary : 'transparent',
    borderWidth: active ? 0 : 1,
    borderColor: t.border,
  };
  if (!onPress) return <View style={[base, { alignSelf: 'flex-start' }]}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, pressed && { opacity: 0.7 }]}>
      {body}
    </Pressable>
  );
}

/** Thin gold rule that opens a citation line — signature detail of the system. */
export function GoldRule({ height = 22 }: { height?: number }) {
  const t = useT();
  return <View style={{ width: 2, borderRadius: 1, backgroundColor: t.accentSoft, minHeight: height, marginRight: SP.md }} />;
}

export function Divider({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) {
  const t = useT();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.hairline, marginTop: mt, marginBottom: mb }} />;
}
