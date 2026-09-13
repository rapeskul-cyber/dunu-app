// Quran repository — reads the full mushaf from local SQLite. No network, ever.
// Kept separate from DuaRepository so the dhikr module stays independent.

import type { SqlDriver } from '../../core/db/schema';
import { normalizeArabic } from '../../core/db/schema';

export interface Surah {
  number: number;
  name_arabic: string;
  name_latin: string;
  name_translation: string;
  revelation: 'meccan' | 'medinan';
  ayah_count: number;
  audio_url: string;
}

export interface Ayah {
  global_number: number;
  surah_number: number;
  number_in_surah: number;
  text_arabic: string;
  translation: string;
  juz: number;
  reference: string;
}

export interface AyahHit extends Ayah {
  surah_latin: string;
  surah_arabic: string;
}

export class QuranRepository {
  constructor(private db: SqlDriver) {}

  async getSurahs(): Promise<Surah[]> {
    return this.db.getAllAsync<Surah>(
      `SELECT number,name_arabic,name_latin,name_translation,revelation,ayah_count,audio_url
       FROM surahs ORDER BY number ASC`,
    );
  }

  async getSurah(n: number): Promise<Surah | null> {
    return (
      (await this.db.getFirstAsync<Surah>(
        `SELECT number,name_arabic,name_latin,name_translation,revelation,ayah_count,audio_url
         FROM surahs WHERE number=?`,
        [n],
      )) ?? null
    );
  }

  /** Paged ayah read: window of `limit` starting at `from` (1-based ayah no). */
  async getAyahs(surahNumber: number, from = 1, limit = 50): Promise<Ayah[]> {
    return this.db.getAllAsync<Ayah>(
      `SELECT global_number,surah_number,number_in_surah,text_arabic,translation,juz,reference
       FROM ayahs WHERE surah_number=? AND number_in_surah>=?
       ORDER BY number_in_surah ASC LIMIT ?`,
      [surahNumber, from, limit],
    );
  }

  async getAyah(globalNumber: number): Promise<AyahHit | null> {
    return (await this.db.getFirstAsync<AyahHit>(
      `SELECT a.global_number,a.surah_number,a.number_in_surah,a.text_arabic,a.translation,a.juz,a.reference,
              s.name_latin AS surah_latin, s.name_arabic AS surah_arabic
       FROM ayahs a JOIN surahs s ON s.number=a.surah_number
       WHERE a.global_number=?`,
      [globalNumber],
    )) ?? null;
  }

  // ------------------------------------------------------------------ search
  /** Fuzzy search over the whole Qur'an: substring on the normalised haystack,
   *  ranked so earliest match wins. Returns top `limit` hits. */
  async search(query: string, limit = 40): Promise<AyahHit[]> {
    const q = normalizeArabic(query.trim().toLowerCase());
    if (!q) return [];
    // LIKE on the indexed haystack column; Arabic is diacritic-normalised.
    const like = `%${q.replace(/[%_\\]/g, (c) => (c === '\\' ? c : '\\' + c))}%`;
    const rows = await this.db.getAllAsync<AyahHit & { pos: number }>(
      `SELECT a.global_number,a.surah_number,a.number_in_surah,a.text_arabic,a.translation,a.juz,a.reference,
              s.name_latin AS surah_latin, s.name_arabic AS surah_arabic,
              INSTR(h.haystack, ?) AS pos
       FROM ayah_search h
       JOIN ayahs a ON a.global_number = h.global_number
       JOIN surahs s ON s.number = a.surah_number
       WHERE h.haystack LIKE ? ESCAPE '\\'
       ORDER BY pos ASC, a.global_number ASC
       LIMIT ?`,
      [q, like, limit],
    );
    return rows;
  }

  /** Match a surah by Latin name fragment ("baqarah", "yasin", "mulk"). */
  async findSurahByName(query: string): Promise<Surah[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return this.db.getAllAsync<Surah>(
      `SELECT number,name_arabic,name_latin,name_translation,revelation,ayah_count,audio_url
       FROM surahs WHERE lower(name_latin) LIKE ? ORDER BY number LIMIT 5`,
      [`%${q}%`],
    );
  }

  // --------------------------------------------------------------- bookmarks
  async toggleQuranBookmark(globalNumber: number): Promise<boolean> {
    const existing = await this.db.getFirstAsync<{ id: number }>(
      `SELECT id FROM quran_bookmarks WHERE global_number=?`,
      [globalNumber],
    );
    if (existing) {
      await this.db.runAsync(`DELETE FROM quran_bookmarks WHERE global_number=?`, [globalNumber]);
      return false;
    }
    await this.db.runAsync(
      `INSERT INTO quran_bookmarks(global_number,created_at) VALUES(?,?)`,
      [globalNumber, Date.now()],
    );
    return true;
  }

  async getQuranBookmarks(): Promise<(AyahHit & { created_at: number })[]> {
    return this.db.getAllAsync<AyahHit & { created_at: number }>(
      `SELECT b.created_at,a.global_number,a.surah_number,a.number_in_surah,a.text_arabic,a.translation,
              a.juz,a.reference,s.name_latin AS surah_latin,s.name_arabic AS surah_arabic
       FROM quran_bookmarks b
       JOIN ayahs a ON a.global_number=b.global_number
       JOIN surahs s ON s.number=a.surah_number
       ORDER BY b.created_at DESC`,
    );
  }

  async isQuranBookmarked(globalNumber: number): Promise<boolean> {
    const r = await this.db.getFirstAsync<{ id: number }>(
      `SELECT id FROM quran_bookmarks WHERE global_number=?`,
      [globalNumber],
    );
    return !!r;
  }

  // ---------------------------------------------------------------- last read
  async setLastRead(surah: number, ayah: number): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO last_read(id,surah_number,ayah_number,updated_at) VALUES(1,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         surah_number=excluded.surah_number,
         ayah_number=excluded.ayah_number,
         updated_at=excluded.updated_at`,
      [surah, ayah, Date.now()],
    );
  }

  async getLastRead(): Promise<{ surah_number: number; ayah_number: number } | null> {
    return (await this.db.getFirstAsync<{ surah_number: number; ayah_number: number }>(
      `SELECT surah_number,ayah_number FROM last_read WHERE id=1`,
    )) ?? null;
  }

  async stats(): Promise<{ surahs: number; ayahs: number; juz: number }> {
    const s = await this.db.getFirstAsync<{ surahs: number; ayahs: number; juz: number }>(
      `SELECT (SELECT COUNT(*) FROM surahs) AS surahs,
              (SELECT COUNT(*) FROM ayahs)  AS ayahs,
              (SELECT COUNT(DISTINCT juz) FROM ayahs) AS juz`,
    );
    return s ?? { surahs: 0, ayahs: 0, juz: 0 };
  }
}
