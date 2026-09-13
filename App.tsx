// PHASE 3/4 — App root: DB bootstrap, custom navigator, tab bar, habit tracker.

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { initDatabase } from './src/core/db/client';
import { migrateAndSeed } from './src/core/db/schema';
import { openDatabaseAsync } from 'expo-sqlite';
import { useData, useTheme } from './src/presentation/store/stores';
import { Screen, useT, SectionTitle } from './src/presentation/components/ui';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { DetailScreen } from './src/presentation/screens/DetailScreen';
import { CategoryScreen, TasbihScreen, SearchScreen } from './src/presentation/screens/Screens';
import { SP } from './src/core/theme/theme';

type Route =
  | { name: 'home' }
  | { name: 'category'; slug: string }
  | { name: 'detail'; id: number }
  | { name: 'tasbih' }
  | { name: 'search' }
  | { name: 'habit' };

function Bootstrap({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Web fallback: expo-sqlite uses WASM; ensure it is installed before use.
        await initDatabase();
        if (alive) setOk(true);
      } catch (e) {
        // Retry once with a fresh handle; WASM init can race on cold start.
        try {
          const db = await openDatabaseAsync('dunu.db');
          await migrateAndSeed({
            execAsync: (s: string) => db.execAsync(s),
            runAsync: async (s: string, p?: (string | number | null)[]) => { await db.runAsync(s, (p ?? []) as never); },
            getFirstAsync: (s: string, p?: (string | number | null)[]) => db.getFirstAsync(s, (p ?? []) as never) as Promise<never>,
            getAllAsync: (s: string, p?: (string | number | null)[]) => db.getAllAsync(s, (p ?? []) as never) as Promise<never>,
          });
          if (alive) setOk(true);
        } catch (e2) {
          if (alive) setErr(`${(e as Error).message} / ${(e2 as Error).message}`);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center', padding: SP.xl }}>
        <Text style={{ fontSize: 30, marginBottom: 12 }}>⚠️</Text>
        <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>
          Gagal menyiapkan database
        </Text>
        <Text style={{ color: t.textMuted, fontSize: 12, textAlign: 'center' }}>{err}</Text>
      </Screen>
    );
  }

  if (!ok) {
    return (
      <Screen style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 44, marginBottom: 16 }}>📿</Text>
        <ActivityIndicator color={t.primary} />
        <Text style={{ color: t.textMuted, marginTop: 12, fontSize: 13 }}>Menyiapkan zikir offline…</Text>
      </Screen>
    );
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------- Habit screen
function HabitScreen({ onBack }: { onBack: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { categories, checkinsToday, streak, refreshHabit, repo } = useData();
  const [done, setDone] = useState<{ id: number; title: string; count: number }[] | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    await refreshHabit();
    if (!repo) return;
    const rows = await repo.getCheckins(today);
    const items = await Promise.all(
      rows.map(async (r) => {
        const d = await repo.getDua(r.dua_id);
        return { id: r.dua_id, title: d?.title ?? `Dua #${r.dua_id}`, count: r.count };
      }),
    );
    setDone(items);
  }, [repo, refreshHabit, today]);

  useEffect(() => {
    void load();
  }, [load]);

  const goal = 3;
  const doneCount = done?.length ?? 0;
  const pct = Math.min(100, Math.round((doneCount / goal) * 100));

  return (
    <Screen>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: SP.md, paddingBottom: SP.sm }}>
        <Text style={{ color: t.text, fontSize: 26, fontWeight: '700' }}>Kebiasaan Harian</Text>
        <Text style={{ color: t.textMuted, marginTop: 2 }}>{today}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: SP.md, paddingTop: 0, paddingBottom: 120 }}>
        <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, borderRadius: SP.radius.lg, padding: SP.md, marginBottom: SP.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ color: t.textMuted, fontSize: 12 }}>Target harian</Text>
              <Text style={{ color: t.text, fontSize: 30, fontWeight: '800' }}>
                {doneCount}
                <Text style={{ fontSize: 16, color: t.textMuted }}> / {goal} zikir</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 26 }}>🔥</Text>
              <Text style={{ color: t.text, fontWeight: '700', textAlign: 'center' }}>{streak} hari</Text>
            </View>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: t.ringTrack, marginTop: SP.md, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${pct}%`, backgroundColor: t.primary, borderRadius: 4 }} />
          </View>
          <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 8 }}>
            {pct >= 100 ? 'MasyaAllah, target harian tercapai ✅' : `Kurang ${Math.max(0, goal - doneCount)} zikir lagi untuk menutup target hari ini.`}
          </Text>
        </View>

        <SectionTitle>Yang dibaca hari ini</SectionTitle>
        {done === null ? (
          <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, borderRadius: SP.radius.md, padding: SP.lg, alignItems: 'center' }}>
            <ActivityIndicator color={t.primary} />
            <Text style={{ color: t.textMuted, marginTop: 8, fontSize: 13 }}>Memuat catatan…</Text>
          </View>
        ) : done.length === 0 ? (
          <View style={{ backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorder, borderRadius: SP.radius.md, padding: SP.lg, alignItems: 'center' }}>
            <Text style={{ fontSize: 30 }}>🌱</Text>
            <Text style={{ color: t.textMuted, textAlign: 'center', marginTop: 10, fontSize: 13 }}>
              Belum ada catatan hari ini. Buka zikir lalu tekan “Tandai sudah dibaca”, atau selesaikan satu putaran tasbih.
            </Text>
          </View>
        ) : (
          done.map((d, i) => (
            <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.cardBorder }}>
              <Text style={{ color: t.textMuted, width: 22 }}>{i + 1}.</Text>
              <Text style={{ color: t.text, flex: 1, fontWeight: '600' }}>{d.title}</Text>
              <Text style={{ color: t.success, fontWeight: '700', fontSize: 12 }}>{d.count}x</Text>
            </View>
          ))
        )}

        <SectionTitle>Kategori</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm }}>
          {categories.map((c) => (
            <View key={c.slug} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: t.cardBorder }}>
              <Text>{c.icon}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12 }}>{c.name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

// -------------------------------------------------------------------- Tabs
const TABS = [
  { key: 'home', label: 'Beranda', icon: '🏠' },
  { key: 'search', label: 'Cari', icon: '🔍' },
  { key: 'tasbih', label: 'Tasbih', icon: '📿' },
  { key: 'habit', label: 'Habit', icon: '🔥' },
] as const;

function Tabs({ route, go }: { route: Route; go: (r: Route) => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  // Tab bar stays visible on every top-level destination. Detail/category screens
  // are pushed views, so they hide it; search and habit are tabs and must not.
  const active =
    route.name === 'home' ? 'home'
    : route.name === 'search' ? 'search'
    : route.name === 'tasbih' ? 'tasbih'
    : route.name === 'habit' ? 'habit'
    : null;
  if (active === null) return null;
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        backgroundColor: t.tabBar,
        borderTopWidth: 1,
        borderTopColor: t.cardBorder,
        paddingTop: 8,
        paddingBottom: insets.bottom + 8,
      }}
    >
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => go({ name: tab.key } as Route)}
            style={{ flex: 1, alignItems: 'center', gap: 3, opacity: on ? 1 : 0.55 }}
          >
            <Text style={{ fontSize: 20, transform: [{ scale: on ? 1.15 : 1 }] }}>{tab.icon}</Text>
            <Text style={{ color: on ? t.primary : t.textMuted, fontSize: 11, fontWeight: on ? '700' : '500' }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// --------------------------------------------------------------------- Root
export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const { mode } = useTheme();
  const sys = useColorScheme();
  const dark = mode === 'dark' || (mode === 'system' && sys === 'dark');
  const go = useCallback((r: Route) => setRoute(r), []);

  return (
    <SafeAreaProvider>
      <Bootstrap>
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={{ flex: 1 }}>
          {route.name === 'home' && (
            <HomeScreen
              onOpenCategory={(slug) => go({ name: 'category', slug })}
              onOpenDua={(id) => go({ name: 'detail', id })}
              onGoSearch={() => go({ name: 'search' })}
              onGoTasbih={() => go({ name: 'tasbih' })}
            />
          )}
          {route.name === 'category' && (
            <CategoryScreen slug={route.slug} onBack={() => go({ name: 'home' })} onOpenDua={(id) => go({ name: 'detail', id })} />
          )}
          {route.name === 'detail' && (
            <DetailScreen duaId={route.id} onBack={() => go({ name: 'home' })} onOpenTasbih={() => go({ name: 'tasbih' })} />
          )}
          {route.name === 'tasbih' && <TasbihScreen onBack={() => go({ name: 'home' })} />}
          {route.name === 'search' && <SearchScreen onBack={() => go({ name: 'home' })} onOpenDua={(id) => go({ name: 'detail', id })} />}
          {route.name === 'habit' && <HabitScreen onBack={() => go({ name: 'home' })} />}
          <Tabs route={route} go={go} />
        </View>
      </Bootstrap>
    </SafeAreaProvider>
  );
}
