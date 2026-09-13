// Dua reading screen — manuscript layout: title, Arabic block on a parchment
// panel, transliteration in italic, translation, then the citation line marked
// by a gold rule. Audio + bookmark + habit check-in live in the action row.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SANS, SERIF, NASKH, Divider, Eyebrow, Meta, GoldRule, TapCard } from '../components/ui';
import { IconChevronLeft, IconBeads, IconBookmark } from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE, ARABIC_STEPS, LATIN_STEPS } from '../../core/theme/tokens';
import { useData, useReading } from '../store/stores';
import { DetailActions } from './DetailActions';

export function DetailScreen({
  duaId,
  onBack,
  onOpenTasbih,
}: {
  duaId: number;
  onBack: () => void;
  onOpenTasbih: (duaId: number) => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { openDua, current, toggleBookmark, ready } = useData();
  const { arabicStep, latinStep, cycleArabic, cycleLatin } = useReading();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      await openDua(duaId);
      if (alive) setBusy(false);
    })();
    return () => {
      alive = false;
    };
  }, [duaId, openDua]);

  if (busy || !current || current.id !== duaId) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.primary} />
        </View>
      </Screen>
    );
  }

  const d = current;
  const arSize = ARABIC_STEPS[arabicStep];
  const latinSize = LATIN_STEPS[latinStep];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <View style={{ paddingTop: insets.top + SP.md, paddingHorizontal: SP.lg }}>
          <Pressable onPress={onBack} hitSlop={12} accessibilityLabel="Kembali"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SP.md }}>
            <IconChevronLeft size={20} color={t.textMuted} />
            <Text style={[SANS('500'), { color: t.textMuted, fontSize: TYPE.caption }]}>Kembali</Text>
          </Pressable>

          <Eyebrow>{d.hadith_grade}</Eyebrow>
          <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.5, lineHeight: TYPE.display * 1.12 }]}>
            {d.title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: SP.md, gap: SP.lg }}>
            <Text style={[SANS('500'), { color: t.textFaint, fontSize: TYPE.micro }]}>Ukuran teks</Text>
            <Pressable onPress={() => cycleArabic(-1)} hitSlop={10} accessibilityLabel="Perkecil teks Arab">
              <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.caption }]}>A−</Text>
            </Pressable>
            <Pressable onPress={() => cycleArabic(1)} hitSlop={10} accessibilityLabel="Perbesar teks Arab">
              <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.caption }]}>A+</Text>
            </Pressable>
            <Pressable onPress={() => cycleLatin(1)} hitSlop={10} accessibilityLabel="Perbesar terjemahan">
              <Text style={[SANS('600'), { color: t.textMuted, fontSize: TYPE.micro }]}>terjemahan +</Text>
            </Pressable>
          </View>
        </View>

        {/* Arabic on a parchment panel */}
        <View style={{ paddingHorizontal: SP.lg, marginTop: SP.lg }}>
          <View
            style={{
              backgroundColor: t.parchmentPanel,
              borderRadius: SP.r.lg,
              borderWidth: 1,
              borderColor: t.parchmentPanelBorder,
              padding: SP.lg,
            }}
          >
            <Text
              accessibilityLanguage="ar"
              style={[NASKH('400'), { color: t.text, fontSize: arSize, lineHeight: arSize * 2.05, textAlign: 'right', writingDirection: 'rtl' }]}
            >
              {d.arabic}
            </Text>
          </View>

          <Text style={[SERIF('400'), { color: t.textMuted, fontSize: latinSize, fontStyle: 'italic', marginTop: SP.lg, lineHeight: latinSize * 1.65 }]}>
            {d.latin}
          </Text>
          <Text style={[SANS('400'), { color: t.text, fontSize: TYPE.body, marginTop: SP.lg, lineHeight: TYPE.body * 1.65 }]}>
            {d.translation}
          </Text>
        </View>

        <Divider mt={SP.xl} />

        <View style={{ paddingHorizontal: SP.lg, marginTop: SP.lg }}>
          <Eyebrow>Keutamaan</Eyebrow>
          <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, lineHeight: TYPE.caption * 1.6 }]}>
            {d.benefit}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: SP.lg }}>
            <GoldRule />
            <View style={{ flex: 1 }}>
              <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.micro, letterSpacing: 0.9, textTransform: 'uppercase' }]}>
                Sumber
              </Text>
              <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: 3, lineHeight: TYPE.caption * 1.5 }]}>
                {d.source}
              </Text>
            </View>
          </View>
        </View>

        <DetailActions dua={d} onOpenTasbih={onOpenTasbih} onToggleBookmark={() => void toggleBookmark(d.id)} ready={ready} />
      </ScrollView>
    </Screen>
  );
}
