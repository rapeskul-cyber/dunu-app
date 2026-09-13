// PHASE 3 — Category list + full-screen Tasbih + fuzzy Search.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData, useTasbih, useTheme } from '../store/stores';
import { Screen, useT, Chip } from '../components/ui';
import { Ring } from '../components/Ring';
import { SP } from '../../core/theme/theme';
import { TARGET_PRESETS, progress } from '../../domain/tasbih';
import { CATEGORIES } from '../../core/db/seed';

const CATS = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));

// ------------------------------------------------------------- Category list
export function CategoryScreen({
  slug,
  onBack,
  onOpenDua,
}: {
  slug: string;
  onBack: () => void;
  onOpenDua: (id: number) => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { catDuas, openCategory, catDuasSlug } = useData();

  useEffect(() => {
    if (catDuasSlug !== slug) void openCategory(slug);
  }, [slug, catDuasSlug, openCategory]);

  const cat = CATS[slug];
  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: SP.md, paddingBottom: SP.sm }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SP.sm }}>
          <Text style={{ color: t.text, fontSize: 20 }}>‹</Text>
          <Text style={{ color: t.textMuted }}>Semua kategori</Text>
        </Pressable>
        <Text style={{ fontSize: 34 }}>{cat?.icon}</Text>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700', marginTop: 4 }}>{cat?.name}</Text>
        <Text style={{ color: t.textMuted, marginTop: 2 }}>{catDuas.length} zikir dalam kategori ini</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: SP.md, paddingTop: 0, paddingBottom: 100 }}>
        {catDuas.map((d, i) => (
          <Pressable
            key={d.id}
            onPress={() => onOpenDua(d.id)}
            style={({ pressed }) => ({
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.cardBorder,
              borderRadius: SP.radius.md,
              padding: SP.md,
              marginBottom: SP.sm,
              opacity: pressed ? 0.85 : 1,
              borderLeftWidth: 3,
              borderLeftColor: d.current_count >= d.target_count && d.target_count > 0 ? t.success : (cat?.color ?? t.primary),
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, flex: 1 }}>{i + 1}. {d.title}</Text>
              <Text style={{ fontSize: 16 }}>{d.is_bookmarked ? '⭐' : ''}</Text>
            </View>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }} numberOfLines={2}>
              {d.translation}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
              <Text style={{ color: t.success, fontSize: 11, fontWeight: '700' }}>{d.hadith_grade}</Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>{d.source}</Text>
              <Text style={{ color: cat?.color ?? t.primary, fontSize: 11, fontWeight: '700', marginLeft: 'auto' }}>
                {d.target_count}x
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

// ------------------------------------------------------------------- Tasbih
export function TasbihScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { state, tapUp, tapDown, doReset, changeTarget } = useTasbih();
  const { current } = useData();
  const [burst, setBurst] = useState(0);
  const ratio = progress(state);
  const title = current && current.id === state.duaId ? current.title : 'Tasbih Bebas';

  const tap = async () => {
    await tapUp();
    setBurst((b) => b + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: insets.top + 12, paddingHorizontal: SP.md, paddingBottom: SP.sm }}>
        <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: t.text, fontSize: 20 }}>‹</Text>
          <Text style={{ color: t.textMuted }}>Tutup</Text>
        </Pressable>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SP.md }}>
        <Pressable onPress={() => void tap()} onLongPress={() => void doReset(true)} delayLongPress={550} style={{ alignItems: 'center' }}>
          <Ring ratio={ratio} size={260} stroke={14} color={t.ring} track={t.ringTrack}>
            <Text style={{ color: t.text, fontSize: 68, fontWeight: '800', letterSpacing: -2 }}>
              {state.current}
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 15 }}>dari {state.target}</Text>
          </Ring>
        </Pressable>

        {state.cycles > 0 && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: SP.md, alignItems: 'center' }}>
            <Text style={{ color: t.success, fontWeight: '700', fontSize: 13 }}>
              ✓ {state.cycles} putaran selesai
            </Text>
          </View>
        )}

        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
          Ketuk untuk menghitung · tahan lama untuk reset total
        </Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: SP.lg, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TARGET_PRESETS.map((p) => (
            <Chip key={p} label={`${p}x`} active={p === state.target} color={t.primary} onPress={() => void changeTarget(p)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: SP.lg }}>
          <Pressable onPress={() => void tapDown()} hitSlop={10} style={{ paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: t.cardBorder }}>
            <Text style={{ color: t.textMuted, fontWeight: '700' }}>− Undo</Text>
          </Pressable>
          <Pressable onPress={() => void doReset(false)} hitSlop={10} style={{ paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: t.danger }}>
            <Text style={{ color: t.danger, fontWeight: '700' }}>Reset</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: insets.bottom + SP.md }} />
      {burst > 0 && (
        <Text key={burst} style={{ display: 'none' }}>
          {burst}
        </Text>
      )}
    </View>
  );
}

// ------------------------------------------------------------------- Search
export function SearchScreen({ onBack, onOpenDua }: { onBack: () => void; onOpenDua: (id: number) => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const { searchHits, search, bookmarks } = useData();
  const { mode, setMode } = useTheme();

  useEffect(() => {
    const id = setTimeout(() => void search(q), 140);
    return () => clearTimeout(id);
  }, [q, search]);

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: SP.md, paddingBottom: SP.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SP.sm }}>
          <Pressable onPress={onBack} hitSlop={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: t.text, fontSize: 20 }}>‹</Text>
          </Pressable>
          <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', flex: 1 }}>Pencarian</Text>
          <Pressable onPress={() => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark')} hitSlop={10}>
            <Text style={{ fontSize: 18 }}>{mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌗'}</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Cari arab, latin, atau arti…"
          placeholderTextColor={t.textMuted}
          autoFocus
          style={{
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.cardBorder,
            borderRadius: SP.radius.md,
            paddingHorizontal: SP.md,
            paddingVertical: 13,
            color: t.text,
            fontSize: 16,
          }}
        />
        {q.length > 0 && q.trim().length >= 2 && (
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>
            {searchHits.length} hasil untuk “{q.trim()}”
          </Text>
        )}
      </View>

      <FlatList
        data={q.trim().length >= 2 ? searchHits : bookmarks.map((b) => ({ dua: b, score: 1, matchedField: 'title' as const }))}
        keyExtractor={(item) => String(item.dua.id)}
        contentContainerStyle={{ padding: SP.md, paddingTop: 0, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: SP.xl * 2 }}>
            <Text style={{ fontSize: 34 }}>{q.trim().length >= 2 ? '🔍' : '⭐'}</Text>
            <Text style={{ color: t.textMuted, marginTop: 10, textAlign: 'center', paddingHorizontal: SP.xl }}>
              {q.trim().length >= 2
                ? 'Tidak ada hasil. Coba kata lain, misalnya "ampun", "rezeki", atau "tidur".'
                : 'Belum ada zikir yang disimpan. Bintang zikir favoritmu dari halaman detail.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onOpenDua(item.dua.id)}
            style={({ pressed }) => ({
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.cardBorder,
              borderRadius: SP.radius.md,
              padding: SP.md,
              marginBottom: SP.sm,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: t.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>
                {item.dua.title}
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 11 }}>
                {CATS[item.dua.category_slug]?.icon}
              </Text>
            </View>
            <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }} numberOfLines={2}>
              {item.dua.translation}
            </Text>
            {q.trim().length >= 2 && (
              <Text style={{ color: t.accent, fontSize: 11, marginTop: 6 }}>
                cocok di: {FIELD_LABEL[item.matchedField]}
              </Text>
            )}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const FIELD_LABEL: Record<string, string> = {
  title: 'judul',
  latin: 'transliterasi',
  translation: 'arti',
  arabic: 'teks arab',
};

export const SearchStyles = StyleSheet.create({});
