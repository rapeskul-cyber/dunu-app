// Proves basmala stripping is correct on the REAL bundled data:
// - surahs != 1,9 : ayah 1 must no longer start with the basmala
// - fatihah ayah 1 keeps its text (basmala IS its first ayah)
// - no ayah loses real content (length delta == exactly 4 removed words)
import { __testPayload } from '../src/core/db/quranSeed';

const payload = await __testPayload();


const { CLEAN_AYAHS, stripBasmala, hasBasmalaHeader } = payload;
let pass = 0, fail = 0;
const ok = (n: string, c: boolean, e = '') => { c ? (pass++, console.log('  ✅ ' + n + (e ? ' ' + e : ''))) : (fail++, console.log('  ❌ ' + n + ' ' + e)); };

ok('114 surahs / 6236 ayahs parsed', CLEAN_AYAHS.length === 6236);

let stripped = 0;
for (const a of CLEAN_AYAHS) {
  if (a.a === 1 && hasBasmalaHeader(a.s)) {
    const first = a.t.split(/\s+/)[0];
    if (!/^\s*بسم/.test(a.t)) stripped++;
    if (/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s/.test(a.t)) {
      fail++; console.log('  ❌ basmala still present in surah', a.s, ':', a.t.slice(0, 40));
    }
  }
}
ok('basmala removed from every standalone header surah', stripped === 112, `(${stripped}/112)`);

// Al-Fatihah ayah 1 must KEEP its basmala (it is the ayah itself)
const fatihah1 = CLEAN_AYAHS.find((a) => a.s === 1 && a.a === 1)!;
ok('Al-Fatihah ayah 1 keeps basmala', /^بِسْمِ/.test(fatihah1.t), fatihah1.t.slice(0, 30));

// At-Tawbah ayah 1 must NOT gain/lose anything special (no basmala to strip)
const tawbah1 = CLEAN_AYAHS.find((a) => a.s === 9 && a.a === 1)!;
ok('At-Tawbah ayah 1 has no basmala header', !hasBasmalaHeader(9) && !/^بِسْمِ/.test(tawbah1.t));

// Content preservation: strip must only remove the 4 basmala words.
// Compare against raw JSON for a few surahs.
import fs from 'node:fs';
const raw = JSON.parse(fs.readFileSync(new URL('../src/core/db/data/ayahs.json', import.meta.url), 'utf8'));
let checked = 0, contentOk = 0;
for (const r of raw.filter((x: any) => x.a === 1 && x.s !== 1 && x.s !== 9)) {
  const clean = CLEAN_AYAHS.find((a) => a.s === r.s && a.a === 1)!;
  const rawWords = r.t.trim().split(/\s+/);
  const cleanWords = clean.t.trim().split(/\s+/);
  if (rawWords.length - cleanWords.length === 4 && rawWords.slice(4).join(' ') === cleanWords.join(' ')) contentOk++;
  checked++;
}
ok('strip removes EXACTLY 4 leading words, rest identical', checked === 112 && contentOk === 112, `(${contentOk}/${checked})`);

// spot-check well-known ayahs survived intact
const ikhlas1 = CLEAN_AYAHS.find((a) => a.s === 112 && a.a === 1)!;
ok('Al-Ikhlas 1 = قُلْ هُوَ ٱللَّهُ أَحَدٌ', /^قُلْ هُوَ/.test(ikhlas1.t), ikhlas1.t);
// Compare diacritic-insensitively using the SAME normaliser the search index
// uses (single source of truth) — mushaf orthography mixes alif-wasla (U+0671),
// dagger-alif (U+06E3) and maddah (U+0653).
import { normalizeArabic } from '../src/core/db/schema';
const normG = (s: string) => normalizeArabic(s).replace(/\s+/g, '');

const kursi = CLEAN_AYAHS.find((a) => a.s === 2 && a.a === 255)!;
ok('Ayat Kursi present with harakat',
   normG(kursi.t).includes(normG('الله لَا إِلَٰهَ إِلَّا هُوَ')) && /[\u064B-\u0652]/.test(kursi.t),
   kursi.t.slice(0, 30));
ok('no BOM/zero-width leaked into text', !CLEAN_AYAHS.some((a) => /[\ufeff\u200b-\u200f]/.test(a.t)));

// Ayahs without harakat are the muqatta'at openers (الم, يس, عٓسٓقٓ ...) — bare
// letters in the mushaf, so absence of harakat there is CORRECT. Invariant:
// exactly 20 such ayahs, each at the very start of its surah, all short.
const noHarakat = CLEAN_AYAHS.filter((a) => !/[\u064B-\u0652]/.test(a.t));
ok('harakat-free ayahs are muqatta\'at openers only',
   noHarakat.length === 20 &&
     noHarakat.every((a) => a.a <= 2 && a.t.length <= 14 && /^[\u0600-\u06FF\s\u0653]+$/.test(a.t)),
   `(${noHarakat.length} ayahs, e.g. ${noHarakat.slice(0, 3).map((a) => a.s + ':' + a.a).join(', ')})`);

console.log(`\n── basmala/quran data: ${pass} passed, ${fail} failed ──`);
process.exit(fail ? 1 : 0);
