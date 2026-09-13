// Theme provider: system/light/dark with a persisted user override.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, type Theme, type Mode } from '../../core/theme/tokens';

const Ctx = createContext<Theme>(light);
const ModeCtx = createContext<{ mode: Mode; setMode: (m: Mode) => void }>({
  mode: 'system',
  setMode: () => {},
});

const MODE_KEY = '***';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  const [resolved, setResolved] = useState<Theme>(light);

  // load persisted preference once (non-blocking; falls back to 'system')
  useEffect(() => {
    (async () => {
      try {
        const kv = await import('expo-sqlite/kv-store');
        const saved = kv.default?.getItemSync?.(MODE_KEY) as Mode | null;
        if (saved === 'light' || saved === 'dark' || saved === 'system') setModeState(saved);
      } catch {
        /* kv-store unavailable -> stay on system */
      }
    })();
  }, []);

  useEffect(() => {
    const wantDark = mode === 'system' ? system === 'dark' : mode === 'dark';
    setResolved(wantDark ? dark : light);
  }, [mode, system]);

  const modeApi = useMemo(
    () => ({
      mode,
      setMode: (m: Mode) => {
        setModeState(m);
        try {
          void import('expo-sqlite/kv-store').then((kv) => kv.default?.setItemSync?.(MODE_KEY, m));
        } catch {
          /* ignore persistence failure */
        }
      },
    }),
    [mode],
  );

  return (
    <ModeCtx.Provider value={modeApi}>
      <Ctx.Provider value={resolved}>{children}</Ctx.Provider>
    </ModeCtx.Provider>
  );
}

export const useT = () => useContext(Ctx);
export const useMode = () => useContext(ModeCtx);
