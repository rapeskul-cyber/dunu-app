// Full Qur'an seeding: 114 surahs / 6236 ayahs. Everything runs inside
// transactions in batches so first launch stays fast and the whole thing is
// idempotent across app restarts (meta flag + row counts).
//
// NOTE: the payload (~2.6 MB) is loaded with dynamic import() so it becomes its
// own bundle chunk — the app shell and dhikr module stay small, and the text is
// only fetched on the run that actually seeds. After that all queries are local.

import { normalizeArabic, type SqlDriver } from './schema';

interface SurahRow {
  number: number;
  name_arabic: string;
  name_latin: string;
  name_translation: string;
  revelation: string;
  ayah_count: number;
  audio_url: string;
}
interface AyahRow {
  s: number;
  a: number;
  g: number;
  t: string;
  i: string;
  j: number;
}

let _cache: { SURAHS: SurahRow[]; AYAHS: AyahRow[] } | null = null;

async function loadPayload(): Promise<{ SURAHS: SurahRow[]; AYAHS: AyahRow[] }> {
  if (_cache) return _cache;
  const [s, a] = await Promise.all([
    import('./data/surahs.json'),
    import('./data/ayahs.json'),
  ]);
  _cache = {
    SURAHS: (s.default ?? s) as unknown as SurahRow[],
    AYAHS: (a.default ?? a) as unknown as AyahRow[],
  };
  return _cache;
}

// ---------------------------------------------------------------------------
// Basmala handling. The Uthmani edition prepends the basmala to the first ayah
// of every surah except Al-Fatihah (where it IS ayah 1) and At-Tawbah (none).
// Mushaf convention prints it as its own header line, so strip it from the ayah
// text and render it at surah level. Matched by leading words after diacritic
// removal — deliberately not a loose regex, which could eat real ayah text.
// ---------------------------------------------------------------------------
/** Strip BOM/zero-width chars the API occasionally embeds in the first ayah. */
const sanitize = (s: string) => s.replace(/[\ufeff\u200b-\u200f\u2060]/g, '');

const stripMarks = (s: string) =>
  sanitize(s)
    .replace(/[\u064B-\u0652\u0653-\u0655\u0670\u06D6-\u06ED\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0627\u0671]/g, 'ا')
    .replace(/\u0629/g, 'ه')
    .trim();

const BASMALA_NORM = ['بسم', 'الله', 'الرحمن', 'الرحيم'].map(stripMarks);

function stripBasmala(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= BASMALA_NORM.length) return text;
  const got = words.slice(0, BASMALA_NORM.length).map(stripMarks);
  if (got.every((w, i) => w === BASMALA_NORM[i])) return words.slice(BASMALA_NORM.length).join(' ');
  return text; // safe no-op when the shape differs
}

/** Surahs that display a standalone basmala header in the reader. */
export const hasBasmalaHeader = (surahNumber: number) => surahNumber !== 1 && surahNumber !== 9;

export const QURAN_META_KEY = 'quran_seeded_v1';

export interface QuranSeedResult {
  seeded: boolean;
  surahs: number;
  ayahs: number;
  searchRows: number;
}

/** Idempotent: skips all work when the DB already holds the complete text.
 *  onProgress is called every batch so the UI can show a truthful loader. */
export async function seedQuran(
  db: SqlDriver,
  onProgress?: (done: number, total: number) => void,
): Promise<QuranSeedResult> {
  const flag = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key=?`,
    [QURAN_META_KEY],
  );
  const existing = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ayahs`);
  const existingSearch = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM ayah_search`,
  );

  const { SURAHS, AYAHS } = await loadPayload();

  // build the cleaned ayah list once per seeding run
  const clean: AyahRow[] = AYAHS.map((a) => {
    const t0 = sanitize(a.t);
    const t = a.a === 1 && hasBasmalaHeader(a.s) ? stripBasmala(t0) : t0;
    return t === a.t ? a : { ...a, t };
  });

  if (
    flag?.value === 'complete' &&
    (existing?.n ?? 0) === clean.length &&
    (existingSearch?.n ?? 0) === clean.length
  ) {
    return { seeded: false, surahs: SURAHS.length, ayahs: existing?.n ?? 0, searchRows: existingSearch?.n ?? 0 };
  }

  // ---- surahs: small, always upsert so metadata corrections ship ----
  await db.execAsync('BEGIN');
  try {
    for (const s of SURAHS) {
      await db.runAsync(
        `INSERT INTO surahs(number,name_arabic,name_latin,name_translation,revelation,ayah_count,audio_url)
         VALUES(?,?,?,?,?,?,?)
         ON CONFLICT(number) DO UPDATE SET
           name_arabic=excluded.name_arabic, name_latin=excluded.name_latin,
           name_translation=excluded.name_translation, revelation=excluded.revelation,
           ayah_count=excluded.ayah_count, audio_url=excluded.audio_url`,
        [s.number, s.name_arabic, s.name_latin, s.name_translation, s.revelation, s.ayah_count, s.audio_url],
      );
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }

  // ---- ayahs + search haystacks, batched under SQLite's 999-param ceiling ----
  // On the web the worker round-trip dominates, so we push the batch size to
  // the parameter limit (7 cols * 142 = 994) and keep everything in ONE
  // transaction with synchronous OFF for the duration of the import.
  const COLS = 7;
  const CHUNK = Math.floor(994 / COLS);
  await db.execAsync('PRAGMA synchronous = OFF');
  await db.execAsync('BEGIN');
  try {
    for (let i = 0; i < clean.length; i += CHUNK) {
      const slice = clean.slice(i, i + CHUNK);
      const ph = slice.map(() => '(?,?,?,?,?,?,?)').join(',');
      const sPh = slice.map(() => '(?,?)').join(',');
      const params: unknown[] = [];
      const searchParams: unknown[] = [];
      for (const a of slice) {
        params.push(a.s, a.a, a.g, a.t, a.i, a.j, `${a.s}:${a.a}`);
        const hay = [`surah ${a.s}`, a.i.toLowerCase(), normalizeArabic(a.t)].join(' \u241F ');
        searchParams.push(a.g, hay);
      }
      await db.runAsync(
        `INSERT INTO ayahs
           (surah_number,number_in_surah,global_number,text_arabic,translation,juz,reference)
         VALUES ${ph}
         ON CONFLICT(global_number) DO UPDATE SET
           text_arabic=excluded.text_arabic,
           translation=excluded.translation,
           juz=excluded.juz`,
        params,
      );
      await db.runAsync(
        `INSERT INTO ayah_search(global_number,haystack) VALUES ${sPh}
         ON CONFLICT(global_number) DO UPDATE SET haystack=excluded.haystack`,
        searchParams,
      );
      if (onProgress) onProgress(Math.min(i + CHUNK, clean.length), clean.length);
    }
    await db.runAsync(
      `INSERT INTO meta(key,value) VALUES(?,?)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
      [QURAN_META_KEY, 'complete'],
    );
    await db.execAsync('COMMIT');
    await db.execAsync('PRAGMA synchronous = FULL');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    await db.execAsync('PRAGMA synchronous = FULL');
    throw e;
  }

  const after = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ayahs`);
  const afterSearch = await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ayah_search`);
  return {
    seeded: true,
    surahs: SURAHS.length,
    ayahs: after?.n ?? 0,
    searchRows: afterSearch?.n ?? 0,
  };
}

/** Exposed for the verification script so it can test the pure helpers. */
export async function __testPayload() {
  const { SURAHS, AYAHS } = await loadPayload();
  const clean = AYAHS.map((a) => {
    const t0 = sanitize(a.t);
    const t = a.a === 1 && hasBasmalaHeader(a.s) ? stripBasmala(t0) : t0;
    return t === a.t ? a : { ...a, t };
  });
  return { SURAHS, AYAHS, CLEAN_AYAHS: clean, stripBasmala, stripMarks, hasBasmalaHeader };
}
