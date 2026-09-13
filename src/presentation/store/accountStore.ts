// Account store: identity is local-first. Signing in attaches a Google account
// so the habit streak follows you across devices; without it everything still
// works, stored only on this device.

import { create } from 'zustand';
import type { GoogleProfile } from '../../core/auth/google';

const KEY = 'dozir_account_v1';

interface AccountState {
  profile: GoogleProfile | null;
  restored: boolean;
  restore(): Promise<void>;
  signIn(p: GoogleProfile): Promise<void>;
  signOut(): Promise<void>;
}

async function kv() {
  const m = await import('expo-sqlite/kv-store');
  return m.default;
}

export const useAccount = create<AccountState>((set) => ({
  profile: null,
  restored: false,

  async restore() {
    try {
      const store = await kv();
      const raw = store.getItemSync?.(KEY);
      set({ profile: raw ? (JSON.parse(raw) as GoogleProfile) : null, restored: true });
    } catch {
      set({ restored: true });
    }
  },

  async signIn(p) {
    set({ profile: p });
    try {
      const store = await kv();
      store.setItemSync?.(KEY, JSON.stringify(p));
    } catch {
      /* persistence is best-effort */
    }
  },

  async signOut() {
    set({ profile: null });
    try {
      const store = await kv();
      store.removeItemSync?.(KEY);
    } catch {
      /* ignore */
    }
  },
}));

/** Stable per-account sync id (never the raw Google sub in UI). */
export const syncId = (p: GoogleProfile | null) =>
  p ? `u_${p.sub.slice(-12)}` : 'local-device';
