// Tasbih — full-bleed focus mode (no tab bar). Numeral + ring as one cluster,
// text stepper for targets, distinct completion feedback. Haptics on each tap.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Screen, SANS, SERIF } from '../components/ui';
import { IconClose, IconMinus, IconRefresh } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useTasbih } from '../store/stores';

const TARGETS = [3, 7, 10, 33, 34, 99, 100, 1000];
const RING = 248;

function Ring({ ratio, label, sub }: { ratio: number; label: string; sub: string }) {
  const t = useT();
  const r = (RING - 18) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={t.ringTrack} strokeWidth={9} fill="none" />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={t.ringProgress}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - Math.min(1, ratio))}
        />
      </Svg>
      <Text style={[SERIF('600'), { color: t.text, fontSize: 84, letterSpacing: -2, lineHeight: 92 }]}>{label}</Text>
      <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: -4 }]}>{sub}</Text>
    </View>
  );
}

export function TasbihScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { state, progress: prog, tap, undo, reset, setTarget, resetAll, load } = useTasbih();
  const pop = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void load();
  }, [load]);

  const doTap = () => {
    const before = state.cycles;
    tap();
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.07, duration: 90, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
    // Completion feedback: one gold pulse outward (no confetti, no colour flash).
    if (useTasbih.getState().state.cycles > before) {
      pulse.setValue(0);
      Animated.timing(pulse, {
        toValue: 1,
        duration: 620,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  const pct = Math.round(prog() * 100);

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + SP.md, paddingHorizontal: SP.lg, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>Tasbih Bebas</Text>
          <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: 1 }]}>
            {state.cycles > 0 ? `${state.cycles} putaran selesai` : 'belum ada putaran'}
          </Text>
        </View>
        <Pressable onPress={onBack} hitSlop={14} accessibilityLabel="Tutup tasbih"
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
          <IconClose size={18} color={t.textMuted} />
        </Pressable>
      </View>

      {/* -------- tap surface -------- */}
      <Pressable
        onPress={doTap}
        accessibilityRole="button"
        accessibilityLabel={`Hitung zikir, sekarang ${state.current} dari ${state.target}`}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        delayLongPress={700}
        onLongPress={() => void resetAll()}
      >
        <Animated.View style={{ transform: [{ scale: pop }] }}>
          <Ring ratio={prog()} label={String(state.current)} sub={`dari ${state.target}`} />
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: RING,
            height: RING,
            borderRadius: RING / 2,
            borderWidth: 2,
            borderColor: t.accent,
            opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] }) }],
          }}
        />
        <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: SP.lg }]}>
          {pct}% · ketuk untuk menghitung · tahan lama untuk reset total
        </Text>
      </Pressable>

      {/* -------- controls -------- */}
      <View style={{ paddingHorizontal: SP.lg, paddingBottom: insets.bottom + SP.lg }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SP.sm, paddingBottom: SP.md }}>
          {TARGETS.map((v) => (
            <Pressable
              key={v}
              onPress={() => void setTarget(v)}
              accessibilityRole="button"
              accessibilityState={{ selected: state.target === v }}
              accessibilityLabel={v >= 1000 ? 'Target 1000 kali' : `Target ${v} kali`}
              style={{
                paddingHorizontal: SP.md,
                paddingVertical: SP.sm,
                borderRadius: SP.r.chip,
                backgroundColor: state.target === v ? t.primary : 'transparent',
                borderWidth: state.target === v ? 0 : 1,
                borderColor: t.border,
              }}
            >
              <Text style={[SANS('600'), { color: state.target === v ? t.onPrimary : t.textMuted, fontSize: TYPE.caption }]}>
                {v}×
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: SP.md }}>
          <Pressable
            onPress={undo}
            accessibilityRole="button"
            accessibilityLabel="Batalkan satu hitungan"
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm,
              paddingVertical: SP.md, borderRadius: SP.r.md, borderWidth: 1, borderColor: t.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <IconMinus size={17} color={t.textMuted} />
            <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.caption }]}>Undo</Text>
          </Pressable>

          <Pressable
            onPress={() => void reset()}
            accessibilityRole="button"
            accessibilityLabel="Reset hitungan"
            style={({ pressed }) => ({
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm,
              paddingVertical: SP.md, borderRadius: SP.r.md, backgroundColor: t.surface,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <IconRefresh size={17} color={t.text} />
            <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.caption }]}>Reset</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
