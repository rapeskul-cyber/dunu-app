// =============================================================================
// PHASE 1 — Database schema + migration + seeding
// Offline-first: everything is created and populated on first launch.
// Runs on both native (expo-sqlite/SQLite) and web (same API surface).
// =============================================================================

import { CATEGORIES, DUAS, type SeedCategory, type SeedDua } from './seed';

/** Minimal statement type so this module stays driver-agnostic and testable. */
export interface SqlDriver {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<void>;
  getFirstAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T | null>;
  getAllAsync<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
}

export const SCHEMA_VERSION = 3;

/** Ordered DDL. Each entry is idempotent (IF NOT EXISTS) and applied in version order. */
export const MIGRATIONS: { version: number; up: string[] }[] = [
  {
    version: 1,
    up: [
      `CREATE TABLE IF NOT EXISTS meta (
         key   TEXT PRIMARY KEY NOT NULL,
         value TEXT NOT NULL
       )`,

      `CREATE TABLE IF NOT EXISTS categories (
         id    INTEGER PRIMARY KEY NOT NULL,
         name  TEXT NOT NULL,
         slug  TEXT NOT NULL UNIQUE,
         icon  TEXT NOT NULL,
         color TEXT NOT NULL
       )`,

      `CREATE TABLE IF NOT EXISTS duas (
         id            INTEGER PRIMARY KEY NOT NULL,
         category_slug TEXT NOT NULL,
         title         TEXT NOT NULL,
         arabic        TEXT NOT NULL,
         latin         TEXT NOT NULL,
         translation   TEXT NOT NULL,
         benefit       TEXT NOT NULL,
         source        TEXT NOT NULL,
         hadith_grade  TEXT NOT NULL,
         audio_url     TEXT NOT NULL DEFAULT '',
         default_target INTEGER NOT NULL DEFAULT 1,
         FOREIGN KEY (category_slug) REFERENCES categories(slug) ON DELETE CASCADE
       )`,

      `CREATE INDEX IF NOT EXISTS idx_duas_category ON duas(category_slug)`,
      `CREATE INDEX IF NOT EXISTS idx_duas_title    ON duas(title)`,

      // FTS-lite mirror: a lower-cased haystack column keeps fuzzy/substring
      // search cheap without requiring the FTS5 compile flag.
      `CREATE TABLE IF NOT EXISTS dua_search (
         dua_id  INTEGER PRIMARY KEY NOT NULL,
         haystack TEXT NOT NULL
       )`,
      `CREATE INDEX IF NOT EXISTS idx_search_hay ON dua_search(haystack)`,

      `CREATE TABLE IF NOT EXISTS dhikr_counters (
         id            INTEGER PRIMARY KEY AUTOINCREMENT,
         dua_id        INTEGER NOT NULL UNIQUE,
         target_count   INTEGER NOT NULL,
         current_count  INTEGER NOT NULL DEFAULT 0,
         cycle_count    INTEGER NOT NULL DEFAULT 0,
         last_updated   INTEGER NOT NULL,
         FOREIGN KEY (dua_id) REFERENCES duas(id) ON DELETE CASCADE
       )`,

      `CREATE TABLE IF NOT EXISTS bookmarks (
         id         INTEGER PRIMARY KEY AUTOINCREMENT,
         dua_id     INTEGER NOT NULL UNIQUE,
         created_at INTEGER NOT NULL,
         FOREIGN KEY (dua_id) REFERENCES duas(id) ON DELETE CASCADE
       )`,

      `CREATE TABLE IF NOT EXISTS habit_checkins (
         id        INTEGER PRIMARY KEY AUTOINCREMENT,
         day_key   TEXT NOT NULL,
         dua_id    INTEGER NOT NULL,
         count     INTEGER NOT NULL DEFAULT 0,
         done_at   INTEGER NOT NULL,
         UNIQUE(day_key, dua_id)
       )`,
      `CREATE INDEX IF NOT EXISTS idx_habit_day ON habit_checkins(day_key)`,
    ],
  },
  {
    // v2 — full Qur'an module (offline mushaf + Indonesian translation + audio)
    version: 2,
    up: [
      `CREATE TABLE IF NOT EXISTS surahs (
         number           INTEGER PRIMARY KEY NOT NULL,
         name_arabic      TEXT NOT NULL,
         name_latin       TEXT NOT NULL,
         name_translation TEXT NOT NULL,
         revelation       TEXT NOT NULL,
         ayah_count       INTEGER NOT NULL,
         audio_url        TEXT NOT NULL DEFAULT ''
       )`,

      `CREATE TABLE IF NOT EXISTS ayahs (
         global_number   INTEGER PRIMARY KEY NOT NULL,
         surah_number    INTEGER NOT NULL,
         number_in_surah INTEGER NOT NULL,
         text_arabic     TEXT NOT NULL,
         translation     TEXT NOT NULL,
         juz             INTEGER NOT NULL,
         reference       TEXT NOT NULL,
         FOREIGN KEY (surah_number) REFERENCES surahs(number) ON DELETE CASCADE
       )`,
      `CREATE INDEX IF NOT EXISTS idx_ayah_surah ON ayahs(surah_number, number_in_surah)`,

      `CREATE TABLE IF NOT EXISTS ayah_search (
         global_number INTEGER PRIMARY KEY NOT NULL,
         haystack      TEXT NOT NULL
       )`,
      `CREATE INDEX IF NOT EXISTS idx_ayah_search ON ayah_search(haystack)`,

      `CREATE TABLE IF NOT EXISTS quran_bookmarks (
         id            INTEGER PRIMARY KEY AUTOINCREMENT,
         global_number INTEGER NOT NULL UNIQUE,
         created_at    INTEGER NOT NULL
       )`,

      `CREATE TABLE IF NOT EXISTS last_read (
         id            INTEGER PRIMARY KEY CHECK (id = 1),
         surah_number  INTEGER NOT NULL,
         ayah_number   INTEGER NOT NULL,
         updated_at    INTEGER NOT NULL
       )`,
    ],
  },
  {
    // v3 — reader performance: cover index for "last read" and the surah reader's
    // ordered window scan (the query that opens a 286-ayah surah).
    version: 3,
    up: [
      `CREATE INDEX IF NOT EXISTS idx_ayah_search_hay ON ayah_search(haystack)`,
      `CREATE INDEX IF NOT EXISTS idx_quran_bm ON quran_bookmarks(created_at DESC)`,
    ],
  },
];

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

export interface DuaRow {
  id: number;
  category_slug: string;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  benefit: string;
  source: string;
  hadith_grade: string;
  audio_url: string;
  default_target: number;
}

/** Strip Arabic diacritics + normalise for forgiving search.
 *  Note the range includes maddah (U+0653-0655) and Quranic annotation marks
 *  (U+06D6-06ED); omitting 0653 breaks substring matching on words like لَآ. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0653-\u0655\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, 'ا') // includes alif-wasla U+0671
    .replace(/\u0624/g, 'و')
    .replace(/\u0626/g, 'ي')
    .replace(/\u0629/g, 'ه')
    .replace(/\u0649/g, 'ي');
}

export function buildHaystack(d: SeedDua): string {
  return [
    d.title,
    d.latin.toLowerCase(),
    d.translation.toLowerCase(),
    normalizeArabic(d.arabic),
    d.benefit.toLowerCase(),
    d.source.toLowerCase(),
  ].join(' \u241F ');
}

/** Applies pending migrations then seeds reference data. Idempotent. */
export async function migrateAndSeed(db: SqlDriver): Promise<void> {
  // Bootstrap the bookkeeping table first: on a brand-new database the
  // version probe below would otherwise hit a missing table.
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`,
  );

  const cur = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key='schema_version'`,
  );
  const current = cur ? Number(cur.value) : 0;

  for (const m of MIGRATIONS) {
    if (m.version > current) {
      for (const stmt of m.up) await db.execAsync(stmt);
      await db.runAsync(
        `INSERT INTO meta(key,value) VALUES('schema_version',?)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
        [String(m.version)],
      );
    }
  }

  await seedReferenceData(db);
}

/** Upserts categories + duas + search index; never clobbers user state tables. */
export async function seedReferenceData(db: SqlDriver): Promise<void> {
  const seeded = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key='seeded_at'`,
  );

  for (const c of CATEGORIES as SeedCategory[]) {
    await db.runAsync(
      `INSERT INTO categories(id,name,slug,icon,color) VALUES(?,?,?,?,?)
       ON CONFLICT(slug) DO UPDATE SET name=excluded.name, icon=excluded.icon, color=excluded.color`,
      [c.id, c.name, c.slug, c.icon, c.color],
    );
  }

  for (const d of DUAS as SeedDua[]) {
    await db.runAsync(
      `INSERT INTO duas(id,category_slug,title,arabic,latin,translation,benefit,source,hadith_grade,audio_url,default_target)
       VALUES(?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         category_slug=excluded.category_slug, title=excluded.title, arabic=excluded.arabic,
         latin=excluded.latin, translation=excluded.translation, benefit=excluded.benefit,
         source=excluded.source, hadith_grade=excluded.hadith_grade,
         audio_url=excluded.audio_url, default_target=excluded.default_target`,
      [
        d.id,
        d.category_slug,
        d.title,
        d.arabic,
        d.latin,
        d.translation,
        d.benefit,
        d.source,
        d.hadith_grade,
        d.audio_url,
        d.default_target,
      ],
    );
    await db.runAsync(
      `INSERT INTO dua_search(dua_id,haystack) VALUES(?,?)
       ON CONFLICT(dua_id) DO UPDATE SET haystack=excluded.haystack`,
      [d.id, buildHaystack(d)],
    );
    // Ensure a counter row exists for every dua, seeded with its default target.
    await db.runAsync(
      `INSERT INTO dhikr_counters(dua_id,target_count,current_count,last_updated)
       VALUES(?,?,0,?) ON CONFLICT(dua_id) DO UPDATE SET target_count=excluded.target_count`,
      [d.id, d.default_target, Date.now()],
    );
  }

  if (!seeded) {
    await db.runAsync(
      `INSERT INTO meta(key,value) VALUES('seeded_at',?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      [String(Date.now())],
    );
  }
}

/** Verification helper used by `npm run verify:db` — proves seeds really landed. */
export async function assertSeeded(db: SqlDriver): Promise<Record<string, number>> {
  const cats = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) n FROM categories`);
  const duas = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) n FROM duas`);
  const srch = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) n FROM dua_search`);
  const cnt = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) n FROM dhikr_counters`);
  return {
    categories: cats?.n ?? 0,
    duas: duas?.n ?? 0,
    search_index: srch?.n ?? 0,
    counters: cnt?.n ?? 0,
  };
}
