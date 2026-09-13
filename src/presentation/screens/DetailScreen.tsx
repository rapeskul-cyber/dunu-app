// PHASE 3/4 — Dua reading screen: adjustable Arabic/Latin size, audio player,
// bookmark, habit check-in, jump to tasbih.

import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData, useReading, useAudio, ARABIC_SIZES, LATIN_SIZES, todayKey } from '../store/stores';
import { useT, Chip, fmtTime } from '../components/ui';
import { Badge } from '../components/Ring';
import { SP, darkTheme, lightTheme } from '../../core/theme/theme';

export function DetailScreen({ duaId, onBack, onOpenTasbih }: { duaId: number; onBack: () => void; onOpenTasbih: () => void }) {
  const sys = useColorScheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { current, ready, openDua, toggleBookmark, checkinsToday, checkIn, refreshHabit } = useData();
  const { arabicIdx, latinIdx, bumpArabic, bumpLatin } = useReading();
  const audio = useAudio();

  useEffect(() => {
    void openDua(duaId);
  }, [duaId, openDua]);

  useEffect(() => {
    return () => {
      void audio.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const d = current && current.id === duaId ? current : null;
  const catColor = d ? colorFor(d.category_slug) : t.primary;
  const checkedIn = (checkinsToday[d?.id ?? -1] ?? 0) > 0;

  if (!ready || !d) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.textMuted }}>Memuat…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: SP.md,
          paddingBottom: SP.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: t.cardBorder,
          backgroundColor: t.bgElevated,
        }}
      >
        <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.text, fontSize: 20 }}>‹</Text>
          <Text style={{ color: t.textMuted, fontSize: 14 }}>Kembali</Text>
        </Pressable>
        <Pressable onPress={() => void toggleBookmark(d.id)} hitSlop={12}>
          <Text style={{ fontSize: 20 }}>{d.is_bookmarked ? '⭐' : '☆'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.md, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: SP.sm }}>
          <Text style={{ fontSize: 22 }}>{iconFor(d.category_slug)}</Text>
          <Text style={{ color: t.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
            {catName(d.category_slug)}
          </Text>
        </View>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', marginTop: 4 }}>{d.title}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <Badge label={d.hadith_grade} color={t.success} />
          <Badge label={d.source} color={catColor} />
        </View>

        {/* Arabic with size control */}
        <View
          style={{
            marginTop: SP.lg,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.cardBorder,
            borderRadius: SP.radius.lg,
            padding: SP.md,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 8 }}>
            <SizeBtn label="A−" onPress={() => bumpArabic(-1)} t={t} />
            <SizeBtn label="A+" onPress={() => bumpArabic(1)} t={t} />
          </View>
          <Text
            style={{
              color: t.text,
              fontSize: ARABIC_SIZES[arabicIdx],
              lineHeight: ARABIC_SIZES[arabicIdx] * 1.85,
              textAlign: 'right',
              writingDirection: 'rtl',
              fontFamily: 'serif',
            }}
          >
            {d.arabic}
          </Text>
        </View>

        {/* Latin */}
        <View style={{ marginTop: SP.md, backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, borderRadius: SP.radius.lg, padding: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 6 }}>
            <SizeBtn label="a−" onPress={() => bumpLatin(-1)} t={t} />
            <SizeBtn label="a+" onPress={() => bumpLatin(1)} t={t} />
          </View>
          <Text style={{ color: t.accent, fontSize: LATIN_SIZES[latinIdx], lineHeight: LATIN_SIZES[latinIdx] * 1.7, fontStyle: 'italic' }}>
            {d.latin}
          </Text>
        </View>

        {/* Translation */}
        <View style={{ marginTop: SP.md, backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, borderRadius: SP.radius.lg, padding: SP.md }}>
          <Text style={{ color: t.textMuted, fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginBottom: 8 }}>
            ARTINYA
          </Text>
          <Text style={{ color: t.text, fontSize: 15, lineHeight: 24 }}>{d.translation}</Text>
        </View>

        {/* Benefit */}
        <View
          style={{
            marginTop: SP.md,
            backgroundColor: t.isDark ? 'rgba(45,212,183,0.07)' : 'rgba(14,124,102,0.06)',
            borderWidth: 1,
            borderColor: t.isDark ? 'rgba(45,212,183,0.25)' : 'rgba(14,124,102,0.25)',
            borderRadius: SP.radius.lg,
            padding: SP.md,
          }}
        >
          <Text style={{ color: t.primary, fontSize: 11, letterSpacing: 1.6, fontWeight: '700', marginBottom: 8 }}>
            KEUTAMAAN
          </Text>
          <Text style={{ color: t.text, fontSize: 14, lineHeight: 22 }}>{d.benefit}</Text>
        </View>

        {/* Habit check-in */}
        <Pressable
          onPress={() => {
            if (!checkedIn) void checkIn(d.id);
            else void refreshHabit();
          }}
          style={({ pressed }) => ({
            marginTop: SP.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingVertical: 14,
            paddingHorizontal: SP.md,
            borderRadius: SP.radius.md,
            borderWidth: 1,
            borderColor: checkedIn ? t.success : t.cardBorder,
            backgroundColor: checkedIn ? (t.isDark ? 'rgba(52,211,153,0.12)' : 'rgba(22,163,74,0.08)') : 'transparent',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 18 }}>{checkedIn ? '✅' : '📅'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.text, fontWeight: '600', fontSize: 15 }}>
              {checkedIn ? 'Sudah dibaca hari ini' : 'Tandai sudah dibaca'}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 12 }}>
              {checkedIn ? `${checkinsToday[d.id]}x hari ini · ${todayKey()}` : 'Merekam kebiasaan harian (lokal)'}
            </Text>
          </View>
        </Pressable>

        <View style={{ height: SP.lg }} />
      </ScrollView>

      {/* Bottom action bar: Tasbih + Audio */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: t.bgElevated,
          borderTopWidth: 1,
          borderTopColor: t.cardBorder,
          paddingTop: SP.sm,
          paddingBottom: insets.bottom + SP.sm,
          paddingHorizontal: SP.md,
        }}
      >
        {audio.url !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: audio.url ? SP.sm : 0 }}>
            <Pressable onPress={() => void audio.toggle()} hitSlop={8} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: audio.url ? t.primary : t.cardBorder, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: t.onPrimary }}>{audio.playing ? '⏸' : '▶'}</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: t.ringTrack }}>
                <View
                  style={{
                    height: 4,
                    borderRadius: 2,
                    width: `${audio.durationMs ? Math.min(100, (audio.positionMs / audio.durationMs) * 100) : 0}%`,
                    backgroundColor: t.accent,
                  }}
                />
              </View>
              <Text style={{ color: t.textMuted, fontSize: 10, marginTop: 3 }}>
                {audio.error ? `⚠️ ${audio.error}` : `${fmtTime(audio.positionMs)} / ${fmtTime(audio.durationMs)}`}
              </Text>
            </View>
            <Chip label={`${audio.speed}x`} onPress={() => void audio.cycleSpeed()} color={t.accent} />
            <Chip label={audio.loop ? '🔁' : '➡️'} onPress={() => void audio.toggleLoop()} color={t.primary} />
          </View>
        )}
        <Pressable
          onPress={onOpenTasbih}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingVertical: 14,
            borderRadius: SP.radius.md,
            borderWidth: 1,
            borderColor: t.cardBorder,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 16 }}>📿</Text>
          <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
            Hitung dengan Tasbih ({d.target_count}x)
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SizeBtn({ label, onPress, t }: { label: string; onPress: () => void; t: typeof darkTheme | typeof lightTheme }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: t.cardBorder }}>
      <Text style={{ color: t.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

// Small static maps (also in seed; keeping the screen independent of DB joins).
import { CATEGORIES } from '../../core/db/seed';
const CATS = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
const iconFor = (slug: string) => CATS[slug]?.icon ?? '📿';
const catName = (slug: string) => CATS[slug]?.name ?? slug;
const colorFor = (slug: string) => CATS[slug]?.color ?? '#0E7C66';
