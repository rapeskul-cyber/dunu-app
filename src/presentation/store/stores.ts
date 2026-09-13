// =============================================================================
// PHASE 2/3 - Zustand stores: data, tasbih engine, theme, reading, audio
// =============================================================================

import { create } from 'zustand';
import { getDriver } from '../../core/db/client';
import { DuaRepository, type DuaWithState, type FuzzyHit } from '../../data/repositories/DuaRepository';
import type { CategoryRow } from '../../core/db/schema';
import {
  createTasbih,
  increment,
  decrement,
  reset,
  resetAll,
  setTarget as setTargetPure,
  type TasbihState,
} from '../../domain/tasbih';
import { fireHaptic } from '../../core/utils/haptics';
import { getAudioEngine } from '../../core/utils/audioEngine';

export const todayKey = (): string => new Date().toISOString().slice(0, 10);

// ---------------------------------------------------------------- data store
interface DataState {
  ready: boolean;
  categories: CategoryRow[];
  counts: Record<string, number>;
  bookmarks: DuaWithState[];
  catDuas: DuaWithState[];
  catDuasSlug: string | null;
  current: DuaWithState | null;
  searchHits: FuzzyHit[];
  streak: number;
  checkinsToday: Record<number, number>;
  repo: DuaRepository | null;

  init(): Promise<void>;
  openCategory(slug: string): Promise<void>;
  openDua(id: number): Promise<void>;
  refreshDua(id: number): Promise<void>;
  toggleBookmark(id: number): Promise<void>;
  search(q: string): Promise<void>;
  refreshHabit(): Promise<void>;
  checkIn(duaId: number): Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  ready: false,
  categories: [],
  counts: {},
  bookmarks: [],
  catDuas: [],
  catDuasSlug: null,
  current: null,
  searchHits: [],
  streak: 0,
  checkinsToday: {},
  repo: null,

  async init() {
    const repo = get().repo ?? new DuaRepository(await getDriver());
    if (!get().repo) set({ repo });
    const [categories, counts, bookmarks] = await Promise.all([
      repo.getCategories(),
      repo.countByCategory(),
      repo.getBookmarks(),
    ]);
    set({ categories, counts, bookmarks, ready: true });
    await get().refreshHabit();
  },

  async openCategory(slug) {
    const r = get().repo;
    if (!r) return;
    set({ catDuas: await r.getDuasByCategory(slug), catDuasSlug: slug });
  },

  async openDua(id) {
    const r = get().repo;
    if (!r) return;
    const dua = await r.getDua(id);
    set({ current: dua });
    useTasbih.getState().load(id);
    if (dua) useAudio.getState().setUrl(dua.audio_url || null, dua.title);
  },

  async refreshDua(id) {
    const r = get().repo;
    if (!r) return;
    set({ current: await r.getDua(id) });
  },

  async toggleBookmark(id) {
    const r = get().repo;
    if (!r) return;
    await r.toggleBookmark(id);
    if (get().current?.id === id) await get().refreshDua(id);
    set({ bookmarks: await r.getBookmarks() });
    const slug = get().catDuasSlug;
    if (slug) await get().openCategory(slug);
  },

  async search(q) {
    const r = get().repo;
    if (!r) return;
    set({ searchHits: await r.search(q) });
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
  load(duaId: number): Promise<void>;
  persist(): Promise<void>;
  tapUp(): Promise<void>;
  tapDown(): Promise<void>;
  doReset(full?: boolean): Promise<void>;
  changeTarget(t: number): Promise<void>;
}

const EMPTY: TasbihState = { duaId: 0, current: 0, target: 33, cycles: 0 };

export const useTasbih = create<TasbihStore>((set, get) => ({
  state: EMPTY,

  async load(duaId) {
    const r = useData.getState().repo;
    if (!r) return;
    const c = await r.getCounter(duaId);
    set({ state: createTasbih(duaId, c.target, c.current, c.cycles) });
  },

  async persist() {
    const { state } = get();
    const r = useData.getState().repo;
    if (!r || !state.duaId) return;
    await r.saveCounter(state.duaId, state.current, state.target, state.cycles);
  },

  async tapUp() {
    const ev = increment(get().state);
    set({ state: ev.state });
    if (ev.haptic) await fireHaptic(ev.haptic);
    await get().persist();
    if (ev.autoAdvance) {
      // Auto-advance event: completion banks a habit check-in and refreshes lists.
      await useData.getState().checkIn(ev.state.duaId);
      await useData.getState().refreshDua(ev.state.duaId);
    }
  },

  async tapDown() {
    const ev = decrement(get().state);
    set({ state: ev.state });
    if (ev.haptic) await fireHaptic(ev.haptic);
    await get().persist();
  },

  async doReset(full = false) {
    const ev = full ? resetAll(get().state) : reset(get().state);
    set({ state: ev.state });
    if (ev.haptic) await fireHaptic(ev.haptic);
    await get().persist();
  },

  async changeTarget(t) {
    const ev = setTargetPure(get().state, t);
    set({ state: ev.state });
    await fireHaptic('undo');
    const r = useData.getState().repo;
    if (r && ev.state.duaId) await r.setCounterTarget(ev.state.duaId, ev.state.target);
  },
}));

// ------------------------------------------------------------------- theme
interface ThemeStore {
  mode: 'system' | 'light' | 'dark';
  setMode(m: ThemeStore['mode']): void;
}
export const useTheme = create<ThemeStore>((set) => ({
  mode: 'system',
  setMode: (mode) => set({ mode }),
}));

// ---------------------------------------------------------------- reading prefs
export const ARABIC_SIZES = [22, 26, 30, 36, 44];
export const LATIN_SIZES = [14, 16, 18, 20, 24];

interface ReadStore {
  arabicIdx: number;
  latinIdx: number;
  bumpArabic(dir: 1 | -1): void;
  bumpLatin(dir: 1 | -1): void;
}
export const useReading = create<ReadStore>((set) => ({
  arabicIdx: 2,
  latinIdx: 1,
  bumpArabic: (dir) => set((s) => ({ arabicIdx: Math.max(0, Math.min(ARABIC_SIZES.length - 1, s.arabicIdx + dir)) })),
  bumpLatin: (dir) => set((s) => ({ latinIdx: Math.max(0, Math.min(LATIN_SIZES.length - 1, s.latinIdx + dir)) })),
}));

// ------------------------------------------------------------------- audio store
interface AudioStore {
  title: string;
  url: string | null;
  playing: boolean;
  speed: number;
  loop: boolean;
  positionMs: number;
  durationMs: number;
  error: string | null;
  setUrl(url: string | null, title: string): void;
  toggle(): Promise<void>;
  cycleSpeed(): Promise<void>;
  toggleLoop(): Promise<void>;
  seekRatio(r: number): Promise<void>;
  stop(): Promise<void>;
  onStatus(s: { playing: boolean; positionMs: number; durationMs: number }): void;
}

export const SPEEDS = [0.75, 1, 1.25];

export const useAudio = create<AudioStore>((set, get) => ({
  title: '',
  url: null,
  playing: false,
  speed: 1,
  loop: false,
  positionMs: 0,
  durationMs: 0,
  error: null,

  setUrl(url, title) {
    const eng = getAudioEngine();
    eng.setListener(null);
    void eng.unload();
    if (url) {
      void eng.load(url).then(() => {
        eng.setListener((s) => get().onStatus(s));
      });
    }
    set({ url, title, playing: false, positionMs: 0, durationMs: 0, error: url ? null : 'Audio tidak tersedia' });
  },

  async toggle() {
    const { url, playing, speed, loop } = get();
    if (!url) {
      set({ error: 'Audio tidak tersedia untuk zikir ini' });
      return;
    }
    const eng = getAudioEngine();
    if (playing) {
      await eng.pause();
      set({ playing: false });
    } else {
      await eng.play(speed, loop);
      set({ playing: true, error: null });
    }
  },

  async cycleSpeed() {
    const i = SPEEDS.indexOf(get().speed);
    const s = SPEEDS[(i + 1) % SPEEDS.length];
    set({ speed: s });
    await getAudioEngine().setRate(s);
  },

  async toggleLoop() {
    const loop = !get().loop;
    set({ loop });
    await getAudioEngine().setLoop(loop);
  },

  async seekRatio(r) {
    await getAudioEngine().seekTo(r);
  },

  async stop() {
    const eng = getAudioEngine();
    await eng.stop();
    set({ playing: false, positionMs: 0 });
  },

  onStatus(s) {
    set({ playing: s.playing, positionMs: s.positionMs, durationMs: s.durationMs });
  },
}));
