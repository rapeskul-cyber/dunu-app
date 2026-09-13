// App shell — theme provider, DB/font bootstrap, hand-rolled navigator and a
// four-tab bar drawn with SVG icons (v1 used emoji, which was the single
// biggest tell of an unpolished build).

import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useT } from './src/presentation/theme/ThemeProvider';
import { useBoot } from './src/presentation/hooks/useBoot';
import { SP, TYPE } from './src/core/theme/tokens';
import { SANS, SERIF } from './src/presentation/components/ui';
import { IconBeads, IconFlame, IconSearch, IconSeed, IconUser } from './src/presentation/components/Icons';
import { HomeScreen } from './src/presentation/screens/HomeScreen';
import { SearchScreen } from './src/presentation/screens/SearchScreen';
import { TasbihScreen } from './src/presentation/screens/TasbihScreen';
import { HabitScreen } from './src/presentation/screens/HabitScreen';
import { ProfileScreen } from './src/presentation/screens/ProfileScreen';
import { CategoryScreen } from './src/presentation/screens/CategoryScreen';
import { DetailScreen } from './src/presentation/screens/DetailScreen';
import { QuranScreen } from './src/presentation/screens/QuranScreen';
import { QuranReaderScreen } from './src/presentation/screens/QuranReaderScreen';
import { useTasbih } from './src/presentation/store/stores';

type Route =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'tasbih' }
  | { name: 'habit' }
  | { name: 'profile' }
  | { name: 'quran' }
  | { name: 'reader'; surah: number }
  | { name: 'category'; slug: string }
  | { name: 'detail'; id: number };

const TABS = [
  { key: 'home', label: 'Beranda', Icon: IconSeed },
  { key: 'search', label: 'Cari', Icon: IconSearch },
  { key: 'tasbih', label: 'Tasbih', Icon: IconBeads },
  { key: 'habit', label: 'Habit', Icon: IconFlame },
  { key: 'profile', label: 'Profil', Icon: IconUser },
] as const;

function BootFallback({
  error,
  onRetry,
  progress,
  label,
}: {
  error: string | null;
  onRetry: () => void;
  progress: number;
  label: string;
}) {
  const t = useT();
  const pct = Math.round(progress * 100);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: SP.xxl }}>
      <Text style={[SERIF('600'), { color: t.text, fontSize: TYPE.headline, marginBottom: SP.sm }]}>Dunu</Text>
      {error ? (
        <>
          <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, textAlign: 'center', marginBottom: SP.lg }]}>
            {error}
          </Text>
          <Pressable onPress={onRetry} accessibilityRole="button"
            style={{ paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: SP.r.chip, backgroundColor: t.primary }}>
            <Text style={[SANS('600'), { color: t.onPrimary, fontSize: TYPE.caption }]}>Coba lagi</Text>
          </Pressable>
        </>
      ) : (
        <View style={{ width: 220, alignItems: 'center' }}>
          <View style={{ width: 220, height: 5, borderRadius: 3, backgroundColor: t.ringTrack, overflow: 'hidden' }}>
            <View style={{ width: `${Math.max(4, pct)}%`, height: 5, borderRadius: 3, backgroundColor: t.ringProgress }} />
          </View>
          <Text style={[SANS('400'), { color: t.textMuted, fontSize: TYPE.caption, marginTop: SP.md }]}>
            {label}{pct > 0 && pct < 100 ? ` ${pct}%` : ''}
          </Text>
          {pct > 0 && pct < 100 && (
            <Text style={[SANS('400'), { color: t.textFaint, fontSize: TYPE.micro, marginTop: 2, textAlign: 'center' }]}>
              sekali saja — setelah ini aplikasi dibuka offline sepenuhnya
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function TabBar({ route, go }: { route: Route; go: (r: Route) => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const active =
    route.name === 'home' ? 'home'
    : route.name === 'search' ? 'search'
    : route.name === 'tasbih' ? 'tasbih'
    : route.name === 'habit' ? 'habit'
    : route.name === 'profile' ? 'profile'
    : null;
  // Tasbih runs as a focus mode: it owns the whole screen, no chrome.
  if (active === null) return null;

  return (
    <View
      style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        backgroundColor: t.tabBar,
        borderTopWidth: 1, borderTopColor: t.hairline,
        flexDirection: 'row',
        paddingTop: SP.sm,
        paddingBottom: insets.bottom > 0 ? insets.bottom : SP.md,
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => go({ name: key } as Route)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={label}
            style={{ flex: 1, alignItems: 'center', gap: 3 }}
          >
            <Icon size={21} color={on ? t.accent : t.textFaint} />
            <Text style={[SANS('600'), { fontSize: 10, letterSpacing: 0.2, color: on ? t.accent : t.textFaint }]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Shell() {
  const boot = useBoot();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const go = useCallback((r: Route) => setRoute(r), []);
  const openTasbih = useCallback((duaId: number) => {
    void useTasbih.getState().load(duaId);
    setRoute({ name: 'tasbih' });
  }, []);

  if (!boot.ready)
    return <BootFallback error={boot.error} onRetry={boot.retry} progress={boot.progress} label={boot.label} />;

  return (
    <View style={{ flex: 1 }}>
      {route.name === 'home' && (
        <HomeScreen
          onOpenCategory={(slug) => go({ name: 'category', slug })}
          onOpenQuran={() => go({ name: 'quran' })}
          onOpenHabit={() => go({ name: 'habit' })}
          onOpenSearch={() => go({ name: 'search' })}
        />
      )}
      {route.name === 'search' && (
        <SearchScreen
          onOpenDua={(id) => go({ name: 'detail', id })}
          onOpenAyah={(surah) => go({ name: 'reader', surah })}
        />
      )}
      {route.name === 'tasbih' && <TasbihScreen onBack={() => go({ name: 'home' })} />}
      {route.name === 'habit' && <HabitScreen />}
      {route.name === 'profile' && <ProfileScreen onBack={() => go({ name: 'home' })} />}
      {route.name === 'quran' && <QuranScreen onOpenSurah={(n) => go({ name: 'reader', surah: n })} onBack={() => go({ name: 'home' })} />}
      {route.name === 'reader' && <QuranReaderScreen surahNumber={route.surah} onBack={() => go({ name: 'quran' })} />}
      {route.name === 'category' && (
        <CategoryScreen slug={route.slug} onBack={() => go({ name: 'home' })} onOpenDua={(id) => go({ name: 'detail', id })} />
      )}
      {route.name === 'detail' && (
        <DetailScreen duaId={route.id} onBack={() => go({ name: 'home' })} onOpenTasbih={openTasbih} />
      )}

      <TabBar route={route} go={go} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
