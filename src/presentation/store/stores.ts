// =============================================================================
// Zustand stores — data, tasbih engine, reading prefs, audio.
// Screen-facing API only; all persistence goes through the repositories.
// =============================================================================

import { create } from 'zustand';
import { getDriver } from '../../core/db/client';
import { DuaRepository, type DuaWithState } from '../../data/repositories/DuaRepository';
import type { CategoryRow, DuaRow } from '../../core/db/schema';
import {
  createTasbih,
  increment,
  decrement,
  reset as resetPure,
  resetAll as resetAllPure,
  setTarget as setTargetPure,
  progress as progressOf,
  type TasbihState,
} from '../../domain/tasbih';
import { fireHaptic } from '../../core/utils/haptics';
import { getAudioEngine } from '../../core/utils/audioEngine';
import { ARABIC_STEPS, LATIN_STEPS } from '../../core/theme/tokens';

export const todayKey = (): string => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------ data store
interface DataState {
  ready: boolean;
  repo: DuaRepository | null;
  categories: CategoryRow[];
  duas: DuaWithState[];
  bookmarks: DuaWithState[];
  current: DuaWithState | null;
  searchResults: DuaRow[];
  searching: boolean;
  streak: number;
  checkinsToday: Record<number, number>;

  refresh(): Promise<void>;
  getDuasByCategory(slug: string): Promise<DuaWithState[]>;
  openDua(id: number): Promise<void>;
  refreshDua(id: number): Promise<void>;
  toggleBookmark(id: number): Promise<void>;
  search(q: string): Promise<void>;
  refreshHabit(): Promise<void>;
  checkIn(duaId: number): Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  ready: false,
  repo: null,
  categories: [],
  duas: [],
  bookmarks: [],
  current: null,
  searchResults: [],
  searching: false,
  streak: 0,
  checkinsToday: {},

  async refresh() {
    let r = get().repo;
    if (!r) {
      r = new DuaRepository(await getDriver());
      set({ repo: r });
    }
    const categories = await r.getCategories();
    const lists = await Promise.all(categories.map((c) => r!.getDuasByCategory(c.slug)));
    const duas = lists.flat();
    const bookmarks = await r.getBookmarks();
    set({ categories, duas, bookmarks, ready: true });
    await get().refreshHabit();
  },

  async getDuasByCategory(slug) {
    const r = get().repo;
    return r ? r.getDuasByCategory(slug) : [];
  },

  async openDua(id) {
    const r = get().repo;
    if (!r) return;
    const dua = await r.getDua(id);
    set({ current: dua });
  },

  async refreshDua(id) {
    const r = get().repo;
    if (!r) return;
    const dua = await r.getDua(id);
    set({ current: dua });
    if (get().bookmarks.length !== (await r.getBookmarks()).length) {
      set({ bookmarks: await r.getBookmarks() });
    }
  },

  async toggleBookmark(id) {
    const r = get().repo;
    if (!r) return;
    await r.toggleBookmark(id);
    set({ bookmarks: await r.getBookmarks() });
    if (get().current?.id === id) {
      set({ current: await r.getDua(id) });
    }
  },

  async search(q) {
    const r = get().repo;
    if (!r) return;
    const query = q.trim();
    if (!query) {
      set({ searchResults: [], searching: false });
      return;
    }
    set({ searching: true });
    try {
      const hits = await r.search(query);
      set({ searchResults: hits.map((h) => h.dua), searching: false });
    } catch {
      set({ searchResults: [], searching: false });
    }
  },

  async refreshHabit() {
    const r = get().repo;
    if (!r) return;
    const key = todayKey();
    const [rows, streak] = await Promise.all([r.getCheckins(key), r.getStreak(key)]);
    set({ streak, checkinsToday: Object.fromEntries(rows.map((x) => [x.dua_id, x.count])) });
  },

  async checkIn(duaId) {
    const r = get().repo;
    if (!r) return;
    await r.checkIn(duaId, todayKey());
    await fireHaptic('tick');
    await get().refreshHabit();
  },
}));

// ---------------------------------------------------------------- tasbih store
interface TasbihStore {
  state: TasbihState;
  load(duaId?: number): Promise<void>;
  tap(): void;
  undo(): void;
  reset(): Promise<void>;
  resetAll(): Promise<void>;
  setTarget(t: number): Promise<void>;
  progress(): number;
}

const FREE_DUA_ID = 0; // standalone tasbih persists under dua_id 0
const EMPTY: TasbihState = { duaId: FREE_DUA_ID, current: 0, target: 33, cycles: 0 };

async function persistState(s: TasbihState) {
  const r = useData.getState().repo;
  if (!r || !s.duaId && s.duaId !== 0) return;
  await r.saveCounter(s.duaId, s.current, s.target, s.cycles);
}

export const useTasbih = create<TasbihStore>((set, get) => ({
  state: EMPTY,

  async load(duaId = FREE_DUA_ID) {
    const r = useData.getState().repo;
    if (!r) return;
    const c = await r.getCounter(duaId);
    set({ state: createTasbih(duaId, c.target, c.current, c.cycles) });
  },

  tap() {
    const ev = increment(get().state);
    set({ state: ev.state });
    if (ev.haptic) void fireHaptic(ev.haptic);
    void persistState(ev.state);
    if (ev.autoAdvance) {
      // completion banks a habit check-in for the attached dua (if any)
      const id = ev.state.duaId;
      if (id) {
        void useData.getState().checkIn(id);
        void useData.getState().refreshDua(id);
      }
    }
  },

  undo() {
    const ev = decrement(get().state);
    set({ state: ev.state });
    if (ev.haptic) void fireHaptic(ev.haptic);
    void persistState(ev.state);
  },

  async reset() {
    const ev = resetPure(get().state);
    set({ state: ev.state });
    await fireHaptic('undo');
    await persistState(ev.state);
  },

  async resetAll() {
    const ev = resetAllPure(get().state);
    set({ state: ev.state });
    await fireHaptic('undo');
    await persistState(ev.state);
  },

  async setTarget(t) {
    const ev = setTargetPure(get().state, t);
    set({ state: ev.state });
    await fireHaptic('undo');
    const r = useData.getState().repo;
    if (r) await r.setCounterTarget(ev.state.duaId, ev.state.target);
  },

  progress: () => progressOf(get().state),
}));

// ------------------------------------------------------------ reading prefs
interface ReadStore {
  arabicStep: number;
  latinStep: number;
  cycleArabic(dir: 1 | -1): void;
  cycleLatin(dir: 1 | -1): void;
}

export const useReading = create<ReadStore>((set) => ({
  arabicStep: 3,
  latinStep: 2,
  cycleArabic: (dir) =>
    set((s) => ({ arabicStep: Math.max(0, Math.min(ARABIC_STEPS.length - 1, s.arabicStep + dir)) })),
  cycleLatin: (dir) =>
    set((s) => ({ latinStep: Math.max(0, Math.min(LATIN_STEPS.length - 1, s.latinStep + dir)) })),
}));

// ------------------------------------------------------------------ audio store
interface AudioStore {
  track: string | null;
  title: string;
  url: string | null;
  ready: boolean;
  playing: boolean;
  rate: Speed;
  loop: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
  load(key: string, url: string, title: string): Promise<void>;
  toggle(): Promise<void>;
  setRate(r: Speed): Promise<void>;
  toggleLoop(): Promise<void>;
  stop(): Promise<void>;
}

export type Speed = 0.75 | 1 | 1.25;
export const SPEEDS: Speed[] = [0.75, 1, 1.25];
/** Next speed in the cycle (wraps) — keeps call sites typed as Speed. */
export const nextSpeed = (cur: Speed): Speed => SPEEDS[(SPEEDS.indexOf(cur) + 1) % SPEEDS.length]!;

export const useAudio = create<AudioStore>((set, get) => ({
  track: null,
  title: '',
  url: null,
  ready: false,
  playing: false,
  rate: 1,
  loop: false,
  positionMs: 0,
  durationMs: 0,
  error: null,

  async load(key, url, title) {
    const eng = getAudioEngine();
    try {
      if (get().track !== key) {
        await eng.load(url);
        eng.setListener((s) =>
          set({ playing: s.playing, positionMs: s.positionMs, durationMs: s.durationMs }),
        );
        set({ track: key, url, title, ready: true, error: null, positionMs: 0, durationMs: 0 });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Gagal memuat audio' });
      return;
    }
    if (get().playing) {
      await eng.pause();
      set({ playing: false });
    } else {
      await eng.play(get().rate, get().loop);
      set({ playing: true });
    }
  },

  async toggle() {
    const { url, playing, rate, loop, ready } = get();
    if (!url) {
      set({ error: 'Audio tidak tersedia' });
      return;
    }
    const eng = getAudioEngine();
    try {
      if (playing) {
        await eng.pause();
        set({ playing: false });
      } else {
        if (!ready) await eng.load(url);
        await eng.play(rate, loop);
        set({ playing: true, ready: true, error: null });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Audio gagal diputar' });
    }
  },

  async setRate(r) {
    set({ rate: r });
    if (get().playing) await getAudioEngine().setRate(r);
  },

  async toggleLoop() {
    const loop = !get().loop;
    set({ loop });
    await getAudioEngine().setLoop(loop);
  },

  async stop() {
    await getAudioEngine().stop();
    set({ playing: false, positionMs: 0 });
  },
}));
