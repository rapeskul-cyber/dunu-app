// Font + database bootstrapping. Fonts load from bundled assets (offline), and
// the DB migrates/seeds once. First launch materialises the full Qur'an
// (6236 ayahs) into local SQLite, so we report real progress instead of
// showing an opaque spinner for minutes.

import { useCallback, useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  PublicSans_400Regular,
  PublicSans_500Medium,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
} from '@expo-google-fonts/public-sans';
import { NotoNaskhArabic_400Regular, NotoNaskhArabic_600SemiBold } from '@expo-google-fonts/noto-naskh-arabic';
import { migrateAndSeed } from '../../core/db/schema';
import { getDriver } from '../../core/db/client';
import { seedQuran } from '../../core/db/quranSeed';

export interface BootState {
  ready: boolean;
  fontsReady: boolean;
  dbReady: boolean;
  /** 0..1 during Qur'an seeding; 1 once done. */
  progress: number;
  label: string;
  error: string | null;
  retry: () => void;
}

export function useBoot(): BootState {
  const [fontsReady] = useFonts({
    'Cormorant Garamond': CormorantGaramond_500Medium,
    'Cormorant Garamond Semi': CormorantGaramond_600SemiBold,
    'Cormorant Garamond Italic': CormorantGaramond_400Regular_Italic,
    'Cormorant Garamond Light': CormorantGaramond_400Regular,
    'Public Sans': PublicSans_400Regular,
    'Public Sans Medium': PublicSans_500Medium,
    'Public Sans Semi': PublicSans_600SemiBold,
    'Public Sans Bold': PublicSans_700Bold,
    'Noto Naskh Arabic': NotoNaskhArabic_400Regular,
    'Noto Naskh Arabic Semi': NotoNaskhArabic_600SemiBold,
  });

  const [dbReady, setDbReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Menyiapkan…');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const retry = useCallback(() => {
    setError(null);
    setDbReady(false);
    setProgress(0);
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLabel('Menyiapkan basis data…');
        const driver = await getDriver();
        await migrateAndSeed(driver);

        setLabel('Menanam teks Al-Qur’an…');
        await seedQuran(driver, (done, total) => {
          if (!alive) return;
          setProgress(total ? done / total : 0);
        });
        if (alive) {
          setProgress(1);
          setDbReady(true);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [nonce]);

  return {
    ready: fontsReady && dbReady && !error,
    fontsReady,
    dbReady,
    progress: dbReady ? 1 : progress,
    label,
    error,
    retry,
  };
}
