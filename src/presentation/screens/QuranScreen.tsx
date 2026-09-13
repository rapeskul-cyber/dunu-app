// Qur'an — surah index styled as a manuscript table of contents (no card grid,
// no emoji): numbered plate, Arabic name right-aligned, Latin + metadata left.

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SERIF, SANS, NASKH, Divider, Meta, Eyebrow } from '../components/ui';
import { IconBook, IconChevronLeft, IconSearch } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useQuran } from '../store/quranStore';

function SurahRow({ s, onPress, isLast }: { s: any; onPress: () => void; isLast: boolean }) {
  const t = useT();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Surah ${s.number}, ${s.name_latin}, ${s.ayah_count} ayat`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SP.md,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        {/* numbered plate */}
        <View
          style={{
            width: 38, height: 38, borderRadius: 10,
            backgroundColor: t.surface,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.caption }]}>{s.number}</Text>
        </View>

        <View style={{ flex: 1, marginLeft: SP.md }}>
          <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>{s.name_latin}</Text>
          <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: 1 }]}>
            {s.revelation === 'meccan' ? 'Makkiyah' : 'Madaniyah'} · {s.ayah_count} ayat · {s.name_translation}
          </Text>
        </View>

        <Text style={[NASKH('600'), { color: t.text, fontSize: 21 }]}>{s.name_arabic}</Text>
      </Pressable>
      {!isLast && <Divider />}
    </>
  );
}

export function QuranScreen({ onOpenSurah, onBack }: { onOpenSurah: (n: number) => void; onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { surahs, stats, lastRead, attach, repo } = useQuran();
  const [busy, setBusy] = useState(surahs.length === 0);

  useEffect(() => {
    (async () => {
      if (!repo) {
        const { getDriver } = await import('../../core/db/client');
        const { QuranRepository } = await import('../../data/repositories/QuranRepository');
        await attach(new QuranRepository(await getDriver()));
      }
      setBusy(false);
    })();
  }, [repo, attach]);

  const header = (
    <View>
      <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Kembali"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.sm }}>
        <IconChevronLeft size={20} color={t.textMuted} />
        <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption }]}>Beranda</Text>
      </Pressable>

      <Eyebrow>Mushaf</Eyebrow>
      <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.4 }]}>
        Al-Qur’an
      </Text>
      <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: SP.xs }]}>
        {stats.surahs} surah · {stats.ayahs.toLocaleString('id-ID')} ayat · {stats.juz} juz
      </Text>
      <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: 2 }]}>
        Teks Utsmani & terjemahan Kemenag — tersimpan offline
      </Text>

      {lastRead && (
        <Pressable
          onPress={() => onOpenSurah(lastRead.surah_number)}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginTop: SP.lg, padding: SP.md, borderRadius: SP.r.md,
            backgroundColor: t.surface, flexDirection: 'row', alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <IconBook size={20} color={t.accent} />
          <View style={{ marginLeft: SP.md, flex: 1 }}>
            <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.caption }]}>Lanjut membaca</Text>
            <Meta>surah {lastRead.surah_number}:{lastRead.ayah_number}</Meta>
          </View>
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SP.xl, marginBottom: SP.sm }}>
        <IconSearch size={16} color={t.textFaint} />
        <Text style={[SANS('500'), { color: t.textFaint, fontSize: TYPE.micro, letterSpacing: 0.8, marginLeft: 6, textTransform: 'uppercase' }]}>
          Cari ayat di tab Cari
        </Text>
      </View>
      <Divider mt={SP.sm} mb={SP.xs} />
    </View>
  );

  if (busy) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.primary} />
          <Text style={[SANS('400'), { color: t.textMuted, marginTop: SP.md, fontSize: TYPE.caption }]}>
            Menyiapkan mushaf…
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={surahs}
        keyExtractor={(s) => String(s.number)}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: SP.lg,
          paddingTop: insets.top + SP.md,
          paddingBottom: 120,
        }}
        renderItem={({ item, index }) => (
          <SurahRow s={item} onPress={() => onOpenSurah(item.number)} isLast={index === surahs.length - 1} />
        )}
        initialNumToRender={12}
        windowSize={9}
        removeClippedSubviews
      />
    </Screen>
  );
}
