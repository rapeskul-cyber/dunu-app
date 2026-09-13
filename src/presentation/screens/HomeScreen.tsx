// PHASE 3 — Home: category grid + bookmarks row + habit streak.

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useData } from '../store/stores';
import { Screen, useT, SectionTitle } from '../components/ui';
import { SP } from '../../core/theme/theme';

export function HomeScreen({
  onOpenCategory,
  onOpenDua,
  onGoSearch,
  onGoTasbih,
}: {
  onOpenCategory: (slug: string) => void;
  onOpenDua: (id: number) => void;
  onGoSearch: () => void;
  onGoTasbih: () => void;
}) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { categories, counts, bookmarks, streak, ready, init } = useData();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 16 ? 'Selamat siang' : hour < 19 ? 'Selamat petang' : 'Selamat malam';
  const suggested = hour < 11 ? 'dzikir-pagi' : hour >= 16 && hour < 19 ? 'dzikir-petang' : hour >= 19 ? 'sebelum-tidur' : 'setelah-sholat';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 120, paddingHorizontal: SP.md }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await useData.getState().init();
              setRefreshing(false);
            }}
            tintColor={t.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>{greeting},</Text>
            <Text style={{ color: t.text, fontSize: 28, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' }}>
              Mari berzikir 🕌
            </Text>
          </View>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: t.card,
              borderWidth: 1,
              borderColor: t.cardBorder,
              borderRadius: SP.radius.md,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>🔥</Text>
            <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{streak}</Text>
            <Text style={{ color: t.textMuted, fontSize: 10 }}>hari</Text>
          </View>
        </View>

        <Pressable
          onPress={onGoSearch}
          style={({ pressed }) => ({
            marginTop: SP.lg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: t.card,
            borderWidth: 1,
            borderColor: t.cardBorder,
            borderRadius: SP.radius.md,
            paddingHorizontal: SP.md,
            paddingVertical: 14,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <Text style={{ color: t.textMuted, fontSize: 15 }}>Cari doa, zikir, atau arti…</Text>
        </Pressable>

        <Pressable
          onPress={onGoTasbih}
          style={({ pressed }) => ({
            marginTop: SP.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: t.primary,
            borderRadius: SP.radius.md,
            paddingVertical: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 17 }}>📿</Text>
          <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 16 }}>Buka Tasbih Digital</Text>
        </Pressable>

        <View style={{ marginTop: SP.xl }}>
          <SectionTitle>Kategori</SectionTitle>
          <View style={styles.grid}>
            {!ready && categories.length === 0 ? (
              <Text style={{ color: t.textMuted }}>Memuat data…</Text>
            ) : (
              categories.map((c) => {
                const isSuggested = c.slug === suggested;
                return (
                  <Pressable
                    key={c.slug}
                    onPress={() => onOpenCategory(c.slug)}
                    style={({ pressed }) => ({
                      backgroundColor: t.card,
                      borderColor: isSuggested ? c.color : t.cardBorder,
                      borderWidth: isSuggested ? 1.5 : 1,
                      borderRadius: SP.radius.lg,
                      padding: SP.md,
                      minHeight: 108,
                      justifyContent: 'space-between',
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    })}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                      {isSuggested && (
                        <Text style={{ fontSize: 9, color: c.color, fontWeight: '700', letterSpacing: 0.5 }}>
                          WAKTUNYA
                        </Text>
                      )}
                    </View>
                    <View>
                      <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                      <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 2 }}>
                        {counts[c.slug] ?? 0} zikir
                      </Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>

        {bookmarks.length > 0 && (
          <View style={{ marginTop: SP.xl }}>
            <SectionTitle>Disimpan</SectionTitle>
            {bookmarks.slice(0, 6).map((b) => (
              <Pressable
                key={b.id}
                onPress={() => onOpenDua(b.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 12,
                  paddingHorizontal: SP.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: t.cardBorder,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 16 }}>⭐</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.text, fontWeight: '600' }}>{b.title}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12 }} numberOfLines={1}>
                    {b.source}
                  </Text>
                </View>
                <Text style={{ color: t.textMuted }}>›</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
});
