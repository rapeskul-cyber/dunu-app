// Zustand store for the Qur'an module: surah list, reader window, bookmarks,
// last-read resume, and mushaf search. All reads hit local SQLite.

import { create } from 'zustand';
import type { QuranRepository, Surah, Ayah, AyahHit } from '../../data/repositories/QuranRepository';

interface QuranState {
  repo: QuranRepository | null;
  ready: boolean;

  surahs: Surah[];
  stats: { surahs: number; ayahs: number; juz: number };

  // reader state
  currentSurah: Surah | null;
  ayahs: Ayah[];
  loadedUpTo: number; // highest number_in_surah loaded
  loadingMore: boolean;
  lastRead: { surah_number: number; ayah_number: number } | null;

  quranBookmarks: AyahHit[];
  bookmarkedNow: Record<number, boolean>;

  // search
  results: AyahHit[];
  searching: boolean;

  attach: (repo: QuranRepository) => Promise<void>;
  openSurah: (n: number) => Promise<void>;
  loadMore: () => Promise<void>;
  toggleQuranBookmark: (globalNumber: number) => Promise<void>;
  refreshBookmarks: () => Promise<void>;
  searchQuran: (q: string) => Promise<void>;
  clearSearch: () => void;
}

const PAGE = 20; // ayahs per window — keeps very long surahs (286) cheap

export const useQuran = create<QuranState>((set, get) => ({
  repo: null,
  ready: false,
  surahs: [],
  stats: { surahs: 0, ayahs: 0, juz: 0 },
  currentSurah: null,
  ayahs: [],
  loadedUpTo: 0,
  loadingMore: false,
  lastRead: null,
  quranBookmarks: [],
  bookmarkedNow: {},
  results: [],
  searching: false,

  async attach(repo) {
    const [surahs, stats, lastRead] = await Promise.all([
      repo.getSurahs(),
      repo.stats(),
      repo.getLastRead(),
    ]);
    set({ repo, surahs, stats, lastRead, ready: true });
  },

  async openSurah(n) {
    const { repo } = get();
    if (!repo) return;
    const [surah, first, bm] = await Promise.all([
      repo.getSurah(n),
      repo.getAyahs(n, 1, PAGE),
      repo.getQuranBookmarks(),
    ]);
    if (!surah) return;
    set({
      currentSurah: surah,
      ayahs: first,
      loadedUpTo: first.length ? first[first.length - 1].number_in_surah : 0,
      quranBookmarks: bm,
      bookmarkedNow: Object.fromEntries(bm.map((b) => [b.global_number, true])),
    });
  },

  async loadMore() {
    const { repo, currentSurah, loadedUpTo, ayahs, loadingMore } = get();
    if (!repo || !currentSurah || loadingMore) return;
    if (ayahs.length >= currentSurah.ayah_count) return;
    set({ loadingMore: true });
    try {
      const next = await repo.getAyahs(currentSurah.number, loadedUpTo + 1, PAGE);
      if (next.length) {
        set({
          ayahs: [...ayahs, ...next],
          loadedUpTo: next[next.length - 1].number_in_surah,
        });
      }
    } finally {
      set({ loadingMore: false });
    }
  },

  async toggleQuranBookmark(globalNumber) {
    const { repo } = get();
    if (!repo) return;
    const now = await repo.toggleQuranBookmark(globalNumber);
    set({ bookmarkedNow: { ...get().bookmarkedNow, [globalNumber]: now } });
    if (now) {
      const bm = await repo.getQuranBookmarks();
      set({ quranBookmarks: bm });
    } else {
      set({ quranBookmarks: get().quranBookmarks.filter((b) => b.global_number !== globalNumber) });
    }
    // remember position for resume
    void repo.setLastRead(get().currentSurah?.number ?? 1, 1);
  },

  async refreshBookmarks() {
    const { repo } = get();
    if (!repo) return;
    const bm = await repo.getQuranBookmarks();
    set({ quranBookmarks: bm, bookmarkedNow: Object.fromEntries(bm.map((b) => [b.global_number, true])) });
  },

  async searchQuran(q) {
    const { repo } = get();
    if (!repo) return;
    const query = q.trim();
    if (!query) {
      set({ results: [], searching: false });
      return;
    }
    set({ searching: true });
    try {
      // numeric quick-jump: "18" -> Al-Baqarah, "18:255" -> that ayah directly
      const m = /^(\d{1,3})(?::(\d{1,4}))?$/.exec(query);
      if (m) {
        const sn = Number(m[1]);
        const surahs = await get().repo!.getSurahs();
        const s = surahs.find((x) => x.number === sn);
        if (s) {
          const list = m[2]
            ? await repo.getAyahs(sn, Number(m[2]), 1)
            : await repo.getAyahs(sn, 1, 5);
          set({
            results: list.map((a) => ({ ...a, surah_latin: s.name_latin, surah_arabic: s.name_arabic })),
            searching: false,
          });
          return;
        }
      }
      const rows = await repo.search(query, 40);
      set({ results: rows, searching: false });
    } catch {
      set({ results: [], searching: false });
    }
  },

  clearSearch() {
    set({ results: [], searching: false });
  },
}));
