// =============================================================================
// PHASE 2 — Repository layer (local SQLite only, no network)
// =============================================================================

import type { SqlDriver, CategoryRow, DuaRow } from '../../core/db/schema';
import { normalizeArabic } from '../../core/db/schema';

export interface DuaWithState extends DuaRow {
  is_bookmarked: number;
  current_count: number;
  target_count: number;
  cycle_count: number;
}

export interface FuzzyHit {
  dua: DuaRow;
  score: number; // higher = better
  matchedField: 'title' | 'latin' | 'translation' | 'arabic';
}

/** Levenshtein distance — used for typo tolerance in fuzzy search. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(
        prev[j] + 1,
        row[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = row;
  }
  return prev[b.length];
}

/** Subsequence bonus: token-prefix matching + typo tolerance. */
function tokenPrefixScore(needle: string, hay: string): number {
  const words = hay.split(/[^a-z0-9\u0600-\u06FF]+/i).filter(Boolean);
  const maxDist = needle.length >= 7 ? 2 : needle.length >= 4 ? 1 : 0;
  let best = 0;
  for (const w of words) {
    if (w.startsWith(needle)) best = Math.max(best, 0.9);
    else if (needle.length >= 3 && w.includes(needle)) best = Math.max(best, 0.6);
    else if (maxDist > 0 && needle.length >= 4) {
      // Compare against the head of the word AND the whole word so that
      // insertions/deletions ("sayidul" -> "sayyidul") still resolve.
      const head = w.slice(0, needle.length);
      const d = Math.min(levenshtein(needle, head), w.length <= 14 ? levenshtein(needle, w) : maxDist + 1);
      if (d <= maxDist) best = Math.max(best, d === 0 ? 0.9 : 0.8);
    }
    if (best >= 0.9) break;
  }
  return best;
}

export class DuaRepository {
  constructor(private db: SqlDriver) {}

  // ------------------------------------------------------------------ reads
  async getCategories(): Promise<CategoryRow[]> {
    return this.db.getAllAsync<CategoryRow>(
      `SELECT id,name,slug,icon,color FROM categories ORDER BY id ASC`,
    );
  }

  async countByCategory(): Promise<Record<string, number>> {
    const rows = await this.db.getAllAsync<{ category_slug: string; n: number }>(
      `SELECT category_slug, COUNT(*) n FROM duas GROUP BY category_slug`,
    );
    return rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.category_slug] = r.n;
      return acc;
    }, {});
  }

  async getDuasByCategory(slug: string): Promise<DuaWithState[]> {
    return this.db.getAllAsync<DuaWithState>(
      `SELECT d.*,
              COALESCE(b.id, 0)            AS is_bookmarked,
              COALESCE(c.current_count, 0) AS current_count,
              COALESCE(c.target_count, d.default_target) AS target_count,
              COALESCE(c.cycle_count, 0)   AS cycle_count
         FROM duas d
         LEFT JOIN bookmarks b      ON b.dua_id = d.id
         LEFT JOIN dhikr_counters c ON c.dua_id = d.id
        WHERE d.category_slug = ?
        ORDER BY d.id ASC`,
      [slug],
    );
  }

  async getDua(id: number): Promise<DuaWithState | null> {
    return this.db.getFirstAsync<DuaWithState>(
      `SELECT d.*,
              COALESCE(b.id, 0)            AS is_bookmarked,
              COALESCE(c.current_count, 0) AS current_count,
              COALESCE(c.target_count, d.default_target) AS target_count,
              COALESCE(c.cycle_count, 0)   AS cycle_count
         FROM duas d
         LEFT JOIN bookmarks b      ON b.dua_id = d.id
         LEFT JOIN dhikr_counters c ON c.dua_id = d.id
        WHERE d.id = ?`,
      [id],
    );
  }

  async getBookmarks(): Promise<DuaWithState[]> {
    return this.db.getAllAsync<DuaWithState>(
      `SELECT d.*,
              1 AS is_bookmarked,
              COALESCE(c.current_count, 0) AS current_count,
              COALESCE(c.target_count, d.default_target) AS target_count,
              COALESCE(c.cycle_count, 0)   AS cycle_count
         FROM duas d
         JOIN bookmarks b           ON b.dua_id = d.id
         LEFT JOIN dhikr_counters c ON c.dua_id = d.id
        ORDER BY b.created_at DESC`,
    );
  }

  // ------------------------------------------------------- fuzzy search
  /**
   * Instant search across Arabic (diacritic-insensitive), Latin transliteration
   * and Indonesian translation. Falls back to scoring in JS so it works even
   * where the SQLite FTS5 extension is unavailable.
   */
  async search(query: string, limit = 40): Promise<FuzzyHit[]> {
    const raw = query.trim();
    if (raw.length < 2) return [];

    const q = raw.toLowerCase();
    const qAr = normalizeArabic(raw);
    const isArabic = /[\u0600-\u06FF]/.test(raw);

    // Stage 1 — cheap SQL prefilter (substring on the mirrored haystack).
    const probe = isArabic ? qAr : q;
    const rows = await this.db.getAllAsync<DuaRow>(
      `SELECT d.* FROM duas d
         JOIN dua_search s ON s.dua_id = d.id
        WHERE s.haystack LIKE ?
        ORDER BY d.id ASC
        LIMIT 200`,
      [`%${probe}%`],
    );

    // Stage 2 — score. If the prefilter returned nothing, fall back to full scan
    // so typo'd queries ("sayidul istigfar") still resolve.
    const pool = rows.length
      ? rows
      : await this.db.getAllAsync<DuaRow>(`SELECT * FROM duas ORDER BY id ASC`);

    const hits: FuzzyHit[] = [];
    for (const d of pool) {
      const fields: [FuzzyHit['matchedField'], string][] = [
        ['title', d.title.toLowerCase()],
        ['latin', d.latin.toLowerCase()],
        ['translation', d.translation.toLowerCase()],
        ['arabic', normalizeArabic(d.arabic)],
      ];
      const needle = isArabic ? qAr : q;
      let best = 0;
      let field: FuzzyHit['matchedField'] = 'title';

      for (const [name, hay] of fields) {
        let s = 0;
        if (hay.includes(needle)) s = 1;
        else s = tokenPrefixScore(needle, hay);
        if (s > best) {
          best = s;
          field = name;
        }
      }
      if (best >= 0.55) hits.push({ dua: d, score: best, matchedField: field });
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // ---------------------------------------------------------------- writes
  async toggleBookmark(duaId: number): Promise<boolean> {
    const existing = await this.db.getFirstAsync<{ id: number }>(
      `SELECT id FROM bookmarks WHERE dua_id = ?`,
      [duaId],
    );
    if (existing) {
      await this.db.runAsync(`DELETE FROM bookmarks WHERE dua_id = ?`, [duaId]);
      return false;
    }
    await this.db.runAsync(`INSERT INTO bookmarks(dua_id,created_at) VALUES(?,?)`, [
      duaId,
      Date.now(),
    ]);
    return true;
  }

  async getCounter(duaId: number): Promise<{ current: number; target: number; cycles: number }> {
    const r = await this.db.getFirstAsync<{
      current_count: number;
      target_count: number;
      cycle_count: number;
    }>(
      `SELECT current_count,target_count,cycle_count FROM dhikr_counters WHERE dua_id = ?`,
      [duaId],
    );
    return {
      current: r?.current_count ?? 0,
      target: r?.target_count ?? 1,
      cycles: r?.cycle_count ?? 0,
    };
  }

  async saveCounter(
    duaId: number,
    current: number,
    target: number,
    cycles: number,
  ): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO dhikr_counters(dua_id,target_count,current_count,cycle_count,last_updated)
       VALUES(?,?,?,?,?)
       ON CONFLICT(dua_id) DO UPDATE SET
         target_count=excluded.target_count,
         current_count=excluded.current_count,
         cycle_count=excluded.cycle_count,
         last_updated=excluded.last_updated`,
      [duaId, target, current, cycles, Date.now()],
    );
  }

  async setCounterTarget(duaId: number, target: number): Promise<void> {
    await this.db.runAsync(
      `UPDATE dhikr_counters SET target_count=?, last_updated=? WHERE dua_id=?`,
      [target, Date.now(), duaId],
    );
  }

  // ------------------------------------------------------- habit tracking
  async checkIn(duaId: number, dayKey: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO habit_checkins(day_key,dua_id,count,done_at) VALUES(?,?,1,?)
       ON CONFLICT(day_key,dua_id) DO UPDATE SET
         count = habit_checkins.count + 1,
         done_at = excluded.done_at`,
      [dayKey, duaId, Date.now()],
    );
  }

  async getCheckins(dayKey: string): Promise<{ dua_id: number; count: number }[]> {
    return this.db.getAllAsync<{ dua_id: number; count: number }>(
      `SELECT dua_id,count FROM habit_checkins WHERE day_key=? ORDER BY done_at ASC`,
      [dayKey],
    );
  }

  async getStreak(dayKey: string): Promise<number> {
    // Counts consecutive days (walking backwards from dayKey) that have >=1 check-in.
    let streak = 0;
    const [y, m, d] = dayKey.split('-').map(Number);
    for (let i = 0; i < 400; i++) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const row = await this.db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) n FROM habit_checkins WHERE day_key=?`,
        [key],
      );
      if ((row?.n ?? 0) > 0) streak++;
      else if (i > 0) break;
      else continue; // today may legitimately be empty yet
    }
    return streak;
  }
}
