// Search — one field over BOTH modules: dua/zikir and the whole Qur'an
// (114 surah / 6236 ayat), with Arabic diacritic-insensitive matching and
// numeric quick-jump ("18" -> Al-Kahfi, "2:255" -> Ayat Kursi).

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SANS, SERIF, NASKH, Eyebrow, Divider, Meta } from '../components/ui';
import { IconSearch, IconClose } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData } from '../store/stores';
import { useQuran } from '../store/quranStore';

type Mode = 'dua' | 'quran';

export function SearchScreen({
  onOpenDua,
  onOpenAyah,
}: {
  onOpenDua: (id: number) => void;
  onOpenAyah: (surah: number, ayah: number) => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<Mode>('dua');

  const { search: searchDua, searchResults, searching: duaSearching } = useData();
  const { searchQuran, results: quranResults, searching: quranSearching, clearSearch, repo, attach } = useQuran();

  // make sure the Qur'an repo is attached even when this tab opens first
  useEffect(() => {
    (async () => {
      if (!repo) {
        const { getDriver } = await import('../../core/db/client');
        const { QuranRepository } = await import('../../data/repositories/QuranRepository');
        await attach(new QuranRepository(await getDriver()));
      }
    })();
  }, [repo, attach]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!q.trim()) return;
      if (mode === 'dua') void searchDua(q);
      else void searchQuran(q);
    }, 180); // debounce: fuzzy scoring is CPU-bound
    return () => clearTimeout(id);
  }, [q, mode, searchDua, searchQuran]);

  const busy = mode === 'dua' ? duaSearching : quranSearching;
  const rows = q.trim() ? (mode === 'dua' ? searchResults : quranResults) : [];

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + SP.md, paddingHorizontal: SP.lg }}>
        <Eyebrow>Pencarian</Eyebrow>
        <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.4 }]}>Cari</Text>

        <View
          style={{
            flexDirection: 'row', alignItems: 'center', marginTop: SP.lg,
            backgroundColor: t.surface, borderRadius: SP.r.md, paddingHorizontal: SP.md,
          }}
        >
          <IconSearch size={18} color={t.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={mode === 'dua' ? 'istighfar, rezeki, kursi…' : 'terjemahan, "2:255", atau nomor surah'}
            placeholderTextColor={t.textFaint}
            accessibilityLabel="Kata pencarian"
            style={[SANS('400'), { flex: 1, color: t.text, fontSize: TYPE.body, paddingVertical: SP.md, marginLeft: SP.sm }]}
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={12} accessibilityLabel="Hapus pencarian">
              <IconClose size={16} color={t.textFaint} />
            </Pressable>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: SP.lg, marginTop: SP.md }}>
          {(['dua', 'quran'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                setMode(m);
                clearSearch();
                if (q.trim()) {
                  if (m === 'dua') void searchDua(q);
                  else void searchQuran(q);
                }
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              style={{ paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: mode === m ? t.accent : 'transparent' }}
            >
              <Text style={[SANS('600'), { color: mode === m ? t.text : t.textFaint, fontSize: TYPE.caption }]}>
                {m === 'dua' ? 'Doa & Zikir' : 'Al-Qur’an'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.md }}>
          <Meta>
            {q.trim()
              ? busy
                ? 'mencari…'
                : `${rows.length} hasil`
              : mode === 'dua'
                ? 'cari di judul, latin, terjemahan & sumber'
                : 'teks Utsmani, terjemahan, atau nomor surah/ayat'}
          </Meta>
          {busy && <ActivityIndicator size="small" color={t.primary} />}
        </View>
        <Divider mt={SP.sm} />
      </View>

      <FlatList
        data={rows as Record<string, any>[]}
        keyExtractor={(r) => (mode === 'dua' ? `d${r.id}` : `a${r.global_number}`)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: SP.lg, paddingBottom: 120 }}
        ListEmptyComponent={
          q.trim() && !busy ? (
            <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.caption, textAlign: 'center', marginTop: SP.xxl }]}>
              Tidak ada hasil untuk “{q}”.
            </Text>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View>
            <Pressable
              onPress={() =>
                mode === 'dua' ? onOpenDua(item.id) : onOpenAyah(item.surah_number, item.number_in_surah)
              }
              accessibilityRole="button"
              accessibilityLabel={mode === 'dua' ? item.title : `${item.surah_latin} ayat ${item.number_in_surah}`}
              style={({ pressed }) => ({ paddingVertical: SP.lg, opacity: pressed ? 0.6 : 1 })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body, flex: 1 }]} numberOfLines={1}>
                  {mode === 'dua' ? item.title : `${item.surah_latin} · ${item.surah_number}:${item.number_in_surah}`}
                </Text>
                <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro }]}>
                  {mode === 'dua' ? item.hadith_grade : `juz ${item.juz}`}
                </Text>
              </View>
              <Text
                numberOfLines={2}
                style={[
                  NASKH('400'),
                  { color: t.textMuted, fontSize: 20, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl', marginTop: SP.sm },
                ]}
              >
                {item.arabic ?? item.text_arabic}
              </Text>
              <Text
                numberOfLines={2}
                style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: SP.sm, lineHeight: TYPE.caption * 1.5 }]}
              >
                {item.translation}
              </Text>
            </Pressable>
            {index < rows.length - 1 && <Divider />}
          </View>
        )}
      />
    </Screen>
  );
}
