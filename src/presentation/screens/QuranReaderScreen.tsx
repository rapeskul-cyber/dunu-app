// Qur'an reader — mushaf-style continuous RTL text with ۝ ayah markers,
// translation beneath each ayah, per-surah audio, bookmark + last-read resume.

import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SANS, NASKH, SERIF, Divider, Meta } from '../components/ui';
import { IconChevronLeft, IconBookmark, IconPlay, IconPause, IconLoop } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useQuran } from '../store/quranStore';
import { useReading, useAudio, nextSpeed } from '../store/stores';
import { ARABIC_STEPS, LATIN_STEPS } from '../../core/theme/tokens';

/** Circled Arabic-Indic numeral used as the traditional ayah end marker. */
const AR_INDIC = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicNumeral = (n: number) => String(n).split('').map((d) => AR_INDIC[Number(d)]).join('');

export function QuranReaderScreen({ surahNumber, onBack }: { surahNumber: number; onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { currentSurah, ayahs, openSurah, loadMore, loadingMore, toggleQuranBookmark, bookmarkedNow, repo } =
    useQuran();
  const { arabicStep, latinStep, cycleArabic, cycleLatin } = useReading();
  const { load, toggle, playing, ready: audioReady, track, rate, setRate } = useAudio();
  const scrolled = useRef(false);

  useEffect(() => {
    if (repo) void openSurah(surahNumber);
  }, [repo, surahNumber, openSurah]);

  // resume position once, after the first window lands
  useEffect(() => {
    if (!scrolled.current && currentSurah && ayahs.length) {
      scrolled.current = true;
      void repo?.setLastRead(surahNumber, ayahs[0].number_in_surah);
    }
  }, [currentSurah, ayahs, repo, surahNumber]);

  const arSize = ARABIC_STEPS[arabicStep];
  const latinSize = LATIN_STEPS[latinStep];

  if (!currentSurah) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.primary} />
        </View>
      </Screen>
    );
  }

  const isThisPlaying = playing && track?.startsWith(`quran:${surahNumber}`);

  return (
    <Screen>
      {/* ---- sticky header ---- */}
      <View
        style={{
          paddingTop: insets.top + SP.sm,
          paddingHorizontal: SP.lg,
          paddingBottom: SP.sm,
          backgroundColor: t.bg,
          borderBottomWidth: 1,
          borderBottomColor: t.hairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={onBack} hitSlop={14} accessibilityLabel="Kembali"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2, flex: 1 }}>
            <IconChevronLeft size={20} color={t.textMuted} />
            <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption }]}>Surah</Text>
          </Pressable>

          {/* type-size steppers */}
          <View style={{ flexDirection: 'row', gap: SP.sm }}>
            <Pressable onPress={() => cycleArabic(-1)} hitSlop={8} accessibilityLabel="Perkecil teks Arab"
              style={{ paddingHorizontal: SP.sm, paddingVertical: 2 }}>
              <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.caption }]}>A−</Text>
            </Pressable>
            <Pressable onPress={() => cycleArabic(1)} hitSlop={8} accessibilityLabel="Perbesar teks Arab"
              style={{ paddingHorizontal: SP.sm, paddingVertical: 2 }}>
              <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.caption }]}>A+</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: SP.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.headline, letterSpacing: -0.3 }]}>
              {currentSurah.name_latin}
            </Text>
            <Meta>
              {currentSurah.revelation === 'meccan' ? 'Makkiyah' : 'Madaniyah'} · {currentSurah.ayah_count} ayat
            </Meta>
          </View>
          <Text style={[NASKH('600'), { color: t.accent, fontSize: TYPE.title }]}>{currentSurah.name_arabic}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SP.lg, paddingTop: SP.lg, paddingBottom: 140 }}
        onScroll={({ nativeEvent }) => {
          const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
          const nearEnd = contentOffset.y + layoutMeasurement.height > contentSize.height - 420;
          if (nearEnd) void loadMore();
        }}
        scrollEventThrottle={240}
      >
        {/* basmala header, separate from ayah 1 (except Al-Fatihah / At-Tawbah) */}
        {surahNumber !== 1 && surahNumber !== 9 && (
          <Text
            style={[
              NASKH('400'),
              { color: t.accent, fontSize: Math.max(20, arSize - 2), textAlign: 'center', writingDirection: 'rtl', marginBottom: SP.lg },
            ]}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </Text>
        )}

        {ayahs.map((a) => {
          const marked = bookmarkedNow[a.global_number];
          return (
            <View key={a.global_number} style={{ marginBottom: SP.xl }}>
              <Text
                style={[
                  NASKH('400'),
                  {
                    color: t.text,
                    fontSize: arSize,
                    lineHeight: arSize * 2.05,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  },
                ]}
                accessibilityLanguage="ar"
              >
                {a.text_arabic}{' '}
                <Text style={{ color: t.accent, fontSize: arSize * 0.72 }}>
                  ۝{toArabicNumeral(a.number_in_surah)}
                </Text>
              </Text>

              <View style={{ flexDirection: 'row', marginTop: SP.sm }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[SANS('400'), { color: t.textMuted, fontSize: latinSize, lineHeight: latinSize * 1.55 }]}
                  >
                    {a.translation}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SP.sm, gap: SP.md }}>
                    <Pressable
                      onPress={() => void toggleQuranBookmark(a.global_number)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={marked ? 'Hapus tandai ayat' : 'Tandai ayat'}
                      accessibilityState={{ selected: !!marked }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                    >
                      <IconBookmark size={15} color={marked ? t.accent : t.textFaint} filled={!!marked} />
                      <Text style={[SANS('500'), { color: marked ? t.accent : t.textFaint, fontSize: TYPE.micro }]}>
                        {a.reference}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {loadingMore && (
          <View style={{ paddingVertical: SP.lg, alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
          </View>
        )}
        {ayahs.length >= currentSurah.ayah_count && (
          <Text style={[SANS('500'), { color: t.textFaint, fontSize: TYPE.micro, textAlign: 'center', marginTop: SP.md }]}>
            — akhir surah {currentSurah.name_latin} —
          </Text>
        )}
      </ScrollView>

      {/* ---- per-surah audio bar ---- */}
      <View
        style={{
          position: 'absolute', left: SP.lg, right: SP.lg, bottom: insets.bottom + SP.md,
          backgroundColor: t.surface, borderRadius: SP.r.lg, padding: SP.md,
          flexDirection: 'row', alignItems: 'center', gap: SP.md,
          shadowColor: '#000', shadowOpacity: t.isDark ? 0.4 : 0.1, shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        <Pressable
          onPress={() =>
            void (isThisPlaying ? toggle() : load(`quran:${surahNumber}`, currentSurah.audio_url, `Murattal — ${currentSurah.name_latin}`))
          }
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={isThisPlaying ? 'Jeda murattal' : 'Putar murattal'}
          style={{
            width: 44, height: 44, borderRadius: 22, backgroundColor: t.primary,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isThisPlaying ? <IconPause size={20} color={t.onPrimary} /> : <IconPlay size={20} color={t.onPrimary} />}
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.caption }]} numberOfLines={1}>
            Murattal {currentSurah.name_latin}
          </Text>
          <Meta>Mishary Rasyid Alafasy</Meta>
        </View>

        <Pressable onPress={toggle} hitSlop={10} accessibilityLabel="Ulangi" style={{ opacity: audioReady ? 1 : 0.4 }}>
          <IconLoop size={19} color={t.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => {
            void setRate(nextSpeed(rate));
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Kecepatan ${rate} kali`}
          style={{ paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: SP.r.chip, borderWidth: 1, borderColor: t.border }}
        >
          <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.micro }]}>{rate}×</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
