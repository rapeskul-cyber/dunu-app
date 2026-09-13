// Runs the REAL schema + repository + tasbih engine in Node against a temp file,
// proving Phase 1 (migration/seed) and Phase 2 (queries/counter) work.
// Usage: npx tsx scripts/verify-node.ts

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { migrateAndSeed, assertSeeded, type SqlDriver } from '../src/core/db/schema';
import { CATEGORIES, DUAS } from '../src/core/db/seed';
import { DuaRepository, levenshtein } from '../src/data/repositories/DuaRepository';
import {
  createTasbih,
  increment,
  decrement,
  reset,
  resetAll,
  setTarget,
  progress,
} from '../src/domain/tasbih';

const tmp = path.join(os.tmpdir(), `dunu-verify-${Date.now()}.db`);
const raw = new DatabaseSync(tmp);
const driver: SqlDriver = {
  execAsync: async (sql) => { raw.exec(sql); },
  runAsync: async (sql, params) => {
    const st = raw.prepare(sql);
    st.run(...((params ?? []) as never[]));
  },
  getFirstAsync: async (sql, params) =>
    (raw.prepare(sql).get(...((params ?? []) as never[])) ?? null) as never,
  getAllAsync: async (sql, params) =>
    raw.prepare(sql).all(...((params ?? []) as never[])) as never,
};

let pass = 0;
let fail = 0;
function ok(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log(`  ✅ ${name}${extra ? ' ' + extra : ''}`); }
  else { fail++; console.log(`  ❌ ${name}${extra ? ' ' + extra : ''}`); }
}

async function main() {
  console.log('\n=== PHASE 1: migration + seed ===');
  await migrateAndSeed(driver);
  const counts = await assertSeeded(driver);
  ok('categories seeded', counts.categories === CATEGORIES.length, `(${counts.categories})`);
  ok('duas seeded', counts.duas === DUAS.length, `(${counts.duas})`);
  ok('search index built', counts.search_index === DUAS.length, `(${counts.search_index})`);
  ok('counters pre-created', counts.counters === DUAS.length, `(${counts.counters})`);

  // idempotency: running twice must not duplicate or wipe user state
  await driver.runAsync(`UPDATE dhikr_counters SET current_count = 7 WHERE dua_id = 1`);
  await migrateAndSeed(driver);
  const preserved = await driver.getFirstAsync<{ current_count: number }>(
    `SELECT current_count FROM dhikr_counters WHERE dua_id = 1`,
  );
  ok('re-seed keeps user counter state', preserved?.current_count === 7);

  // harakat present
  const withHarakat = DUAS.filter((d) => /[\u064B-\u0652]/.test(d.arabic)).length;
  ok('arabic carries harakat', withHarakat === DUAS.length, `(${withHarakat}/${DUAS.length})`);
  ok('all duas have Indonesian translation', DUAS.every((d) => d.translation.length > 20));
  ok('all duas have source + grade', DUAS.every((d) => d.source.length > 3 && d.hadith_grade.length > 2));

  console.log('\n=== PHASE 2: repository queries ===');
  const repo = new DuaRepository(driver);
  ok('getCategories', (await repo.getCategories()).length === CATEGORIES.length);
  const pagi = await repo.getDuasByCategory('dzikir-pagi');
  ok('filter by category', pagi.length === 5, `(${pagi.length} zikir pagi)`);
  ok('state columns joined', pagi.every((d) => 'target_count' in d && 'is_bookmarked' in d));

  const b1 = await repo.toggleBookmark(2);
  ok('bookmark ON', b1 === true);
  ok('bookmark visible in list', (await repo.getBookmarks()).some((x) => x.id === 2));
  const b2 = await repo.toggleBookmark(2);
  ok('bookmark OFF', b2 === false && (await repo.getBookmarks()).length === 0);

  console.log('\n=== PHASE 2/3: fuzzy search ===');
  ok('levenshtein sanity', levenshtein('kitten', 'sitting') === 3);
  const cases: [string, number][] = [
    ['istighfar', 1],
    ['sayidul', 1], // typo of sayyidul
    ['ampuni', 1], // Indonesian meaning
    ['rezeki', 1],
    ['kursi', 1],
    ['tidur', 1],
    ['falaq', 1],
  ];
  for (const [q, min] of cases) {
    const hits = await repo.search(q);
    ok(`search "${q}"`, hits.length >= min, `(${hits.length} hits, top: ${hits[0]?.dua.title ?? '—'})`);
  }
  const ar = await repo.search('الرحيم');
  ok('arabic diacritic-insensitive search', ar.length >= 1, `(${ar.length} hits)`);

  console.log('\n=== PHASE 2: smart tasbih engine ===');
  let s = createTasbih(13, 33, 0, 0);
  for (let i = 0; i < 32; i++) {
    const e = increment(s);
    s = e.state;
    if (e.haptic !== 'tick') throw new Error('expected tick haptic before target');
  }
  ok('counts to 32 without completing', s.current === 32 && s.cycles === 0);
  const doneEv = increment(s);
  ok('completion fires autoAdvance', doneEv.autoAdvance === true);
  ok('completion banks cycle', doneEv.state.current === 0 && doneEv.state.cycles === 1);
  ok('completion uses distinct haptic', doneEv.haptic === 'targetReached');
  s = doneEv.state;
  ok('progress() = 0 after wrap', progress(s) === 0);
  s = increment(s).state;
  ok('next tap starts cycle 2 at 1', s.current === 1);
  const dn = decrement(s);
  ok('undo decrements', dn.state.current === 0 && dn.haptic === 'undo');
  const borrow = decrement(dn.state);
  ok('undo borrows previous cycle', borrow.state.cycles === 0 && borrow.state.current === 32);
  const noop = decrement(createTasbih(1, 33, 0, 0));
  ok('noop at absolute zero', noop.type === 'noop' && noop.haptic === null);
  ok('reset keeps target', reset(s).state.current === 0);
  ok('resetAll clears cycles', resetAll(s).state.cycles === 0);
  const chg = setTarget(s, 100);
  ok('setTarget normalises', chg.state.target === 100);
  ok('setTarget guards current overflow', setTarget(createTasbih(1, 33, 30, 0), 10).state.current === 0);
  ok('target floor = 1', setTarget(s, 0).state.target === 1);

  // persistence round-trip through SQLite
  const st2 = createTasbih(13, 33, 5, 2);
  await repo.saveCounter(13, st2.current, st2.target, st2.cycles);
  const back = await repo.getCounter(13);
  ok('counter persisted round-trip', back.current === 5 && back.target === 33 && back.cycles === 2);
  await repo.setCounterTarget(13, 99);
  ok('target change persisted', (await repo.getCounter(13)).target === 99);

  console.log('\n=== PHASE 4: habit tracking ===');
  const day = '2026-09-13';
  await repo.checkIn(1, day);
  await repo.checkIn(1, day);
  await repo.checkIn(2, day);
  const ci = await repo.getCheckins(day);
  ok('check-ins recorded', ci.length === 2 && ci[0].count === 2);
  await repo.checkIn(3, '2026-09-12');
  await repo.checkIn(3, '2026-09-11');
  const streak = await repo.getStreak(day);
  ok('streak counts consecutive days', streak === 3, `(${streak})`);

  raw.close();
  try { fs.rmSync(tmp, { force: true }); } catch { /* temp file cleanup is best-effort */ }
  console.log(`\n────────── RESULT: ${pass} passed, ${fail} failed ──────────`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error('\n💥 FATAL:', e);
  try { fs.rmSync(tmp, { force: true }); } catch {}
  process.exit(1);
});
