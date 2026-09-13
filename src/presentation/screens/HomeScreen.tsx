// Home — editorial stack, not a card grid of emoji tiles:
// context-aware greeting -> practice of the moment -> dhikr categories as a
// typographic list -> bookmarks -> Qur'an entry. Zero emoji, zero icon soup.

import React, { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, SERIF, SANS, NASKH, Eyebrow, Divider, Meta, TapCard } from '../components/ui';
import {
  IconSunrise, IconSunset, IconMosque, IconMoon, IconShield, IconSeed, IconBook, IconFlame,
} from '../components/Icons';
import { useT } from '../theme/ThemeProvider';
import { SP, TYPE } from '../../core/theme/tokens';
import { useData } from '../store/stores';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  sunrise: IconSunrise,
  sunset: IconSunset,
  mosque: IconMosque,
  moon: IconMoon,
  shield: IconShield,
  seed: IconSeed,
};

/** Maps the current time to a greeting and the practice that fits it. */
function momentOfDay(h: number): { greet: string; slug: string; note: string } {
  if (h >= 4 && h < 11) return { greet: 'Selamat pagi', slug: 'dzikir-pagi', note: 'Waktu zikir pagi' };
  if (h >= 11 && h < 15) return { greet: 'Selamat siang', slug: 'setelah-sholat', note: 'Baiknya setelah sholat' };
  if (h >= 15 && h < 18) return { greet: 'Selamat sore', slug: 'dzikir-petang', note: 'Waktu zikir petang' };
  return { greet: 'Selamat malam', slug: 'sebelum-tidur', note: 'Sebelum tidur' };
}

export function HomeScreen({
  onOpenCategory,
  onOpenQuran,
  onOpenHabit,
  onOpenSearch,
}: {
  onOpenCategory: (slug: string) => void;
  onOpenQuran: () => void;
  onOpenHabit: () => void;
  onOpenSearch: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { categories, duas, bookmarks, streak, refresh, ready } = useData();
  const [refreshing, setRefreshing] = React.useState(false);
  const moment = momentOfDay(new Date().getHours());

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const countFor = (slug: string) => duas.filter((d) => d.category_slug === slug).length;
  const featured = duas.find((d) => d.category_slug === moment.slug);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
            tintColor={t.primary}
          />
        }
      >
        {/* ---------- masthead ---------- */}
        <View style={{ paddingTop: insets.top + SP.lg, paddingHorizontal: SP.lg }}>
          <Eyebrow>{moment.note}</Eyebrow>
          <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.display, letterSpacing: -0.6, lineHeight: TYPE.display * 1.1 }]}>
            {moment.greet}
          </Text>
          <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.body, marginTop: SP.sm, lineHeight: TYPE.body * 1.5 }]}>
            Mulai dengan niat yang tenang — pilih zikir atau buka mushaf.
          </Text>
        </View>

        {/* ---------- practice of the moment ---------- */}
        {featured && (
          <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xl }}>
            <TapCard onPress={() => onOpenCategory(featured.category_slug)} ariaLabel={`Buka ${featured.title}`} style={{ padding: SP.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Eyebrow style={{ marginBottom: 0 }}>Amalan saat ini</Eyebrow>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <IconFlame size={13} color={t.accent} />
                  <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.micro }]}>{streak} hari</Text>
                </View>
              </View>

              <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.title, marginTop: SP.sm }]}>
                {featured.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[NASKH('400'), { color: t.textMuted, fontSize: 19, marginTop: SP.sm, textAlign: 'right', writingDirection: 'rtl' }]}
              >
                {featured.arabic}
              </Text>
            </TapCard>
          </View>
        )}

        {/* ---------- Qur'an entry ---------- */}
        <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xl }}>
          <TapCard onPress={onOpenQuran} ariaLabel="Buka Al-Qur'an" style={{ padding: SP.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.bgElevated, alignItems: 'center', justifyContent: 'center' }}>
                <IconBook size={22} color={t.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: SP.md }}>
                <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.title }]}>Al-Qur’an</Text>
                <Meta>114 surah · 6.236 ayat · teks Utsmani & terjemahan</Meta>
              </View>
              <Text style={[NASKH('600'), { color: t.accent, fontSize: 20 }]}>﷽</Text>
            </View>
          </TapCard>
        </View>

        {/* ---------- categories as a typographic list ---------- */}
        <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xxl }}>
          <Eyebrow>Kumpulan zikir & doa</Eyebrow>
          <Divider mb={SP.xs} />
          {categories.map((c, i) => {
            const Icon = ICONS[c.icon] ?? IconSeed;
            return (
              <View key={c.slug}>
                <TapCard
                  onPress={() => onOpenCategory(c.slug)}
                  ariaLabel={`${c.name}, ${countFor(c.slug)} doa`}
                  style={{ paddingVertical: SP.md, paddingHorizontal: SP.sm, backgroundColor: 'transparent', borderRadius: SP.r.md }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon size={21} color={t.accent} />
                    <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body, flex: 1, marginLeft: SP.md }]}>
                      {c.name}
                    </Text>
                    <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.caption }]}>
                      {countFor(c.slug)} doa
                    </Text>
                  </View>
                </TapCard>
                {i < categories.length - 1 && <Divider />}
              </View>
            );
          })}
        </View>

        {/* ---------- bookmarks ---------- */}
        {bookmarks.length > 0 && (
          <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xxl }}>
            <Eyebrow>Disimpan</Eyebrow>
            <Divider mb={SP.xs} />
            {bookmarks.slice(0, 3).map((d, i) => (
              <View key={d.id}>
                <TapCard
                  onPress={() => onOpenCategory(d.category_slug)}
                  ariaLabel={d.title}
                  style={{ paddingVertical: SP.md, paddingHorizontal: SP.sm, backgroundColor: 'transparent', borderRadius: SP.r.md }}
                >
                  <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body }]}>{d.title}</Text>
                  <Text
                    numberOfLines={1}
                    style={[NASKH('400'), { color: t.textMuted, fontSize: 17, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' }]}
                  >
                    {d.arabic}
                  </Text>
                </TapCard>
                {i < Math.min(bookmarks.length, 3) - 1 && <Divider />}
              </View>
            ))}
          </View>
        )}

        {/* ---------- habit strip ---------- */}
        <View style={{ paddingHorizontal: SP.lg, marginTop: SP.xxl }}>
          <TapCard onPress={onOpenHabit} ariaLabel="Buka kebiasaan harian" style={{ padding: SP.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconFlame size={20} color={t.accent} />
              <Text style={[SANS('600'), { color: t.text, fontSize: TYPE.body, flex: 1, marginLeft: SP.md }]}>
                Kebiasaan harian
              </Text>
              <Text style={[SANS('600'), { color: t.accent, fontSize: TYPE.caption }]}>
                {streak} hari beruntun
              </Text>
            </View>
          </TapCard>
        </View>

        {!ready && (
          <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, textAlign: 'center', marginTop: SP.xl }]}>
            memuat data…
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}
