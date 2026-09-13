"""Fetch the COMPLETE Qur'an (Uthmani script + Indonesian translation) and write
compact JSON into src/core/db/data/ for offline seeding.

Source: api.alquran.cloud (AlQuran Cloud), editions:
  - quran-uthmani   : Uthmani text with full harakat
  - id.indonesian   : Kemenag Indonesian translation
Audio (per surah, Mishary Alafasy 128kbps) is verified separately.
"""
import json
import os
import sys
import time
import urllib.request

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "src", "core", "db", "data")
os.makedirs(OUT, exist_ok=True)


def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=45) as r:
                return json.load(r)
        except Exception as e:  # transient network / rate limit
            last = e
            time.sleep(1.5 * (i + 1))
    raise RuntimeError(f"failed {url}: {last}")


surahs = []
ayahs = []
total = 0

for n in range(1, 115):
    d = get(f"https://api.alquran.cloud/v1/surah/{n}/editions/quran-uthmani,id.indonesian")
    editions = d["data"]
    ar = next(e for e in editions if e["edition"]["identifier"] == "quran-uthmani")
    idn = next(e for e in editions if e["edition"]["identifier"] == "id.indonesian")

    meta = ar
    surahs.append({
        "number": n,
        "name_arabic": meta["name"],
        "name_latin": meta["englishName"],
        "name_translation": meta["englishNameTranslation"],
        "revelation": meta["revelationType"].lower(),  # 'meccan' | 'medinan'
        "ayah_count": meta["numberOfAyahs"],
        "audio_url": f"https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{n}.mp3",
    })

    # Indonesian ayah list must line up 1:1 with the Arabic list
    assert len(ar["ayahs"]) == len(idn["ayahs"]) == meta["numberOfAyahs"], f"surah {n} mismatch"
    for a, t in zip(ar["ayahs"], idn["ayahs"]):
        assert a["numberInSurah"] == t["numberInSurah"]
        ayahs.append({
            "s": n,                                   # surah number
            "a": a["numberInSurah"],                  # ayah number in surah
            "g": a["number"],                         # global ayah number
            "t": a["text"],                           # Uthmani text
            "i": t["text"],                           # Indonesian translation
            "j": a["juz"],
        })
    total += len(ar["ayahs"])
    if n % 20 == 0 or n == 114:
        print(f"  surah {n}/114  (ayahs so far: {total})", flush=True)

assert len(surahs) == 114, len(surahs)
assert total == 6236, f"expected 6236 ayahs, got {total}"

# --- sanity: harakat present, translations non-empty ---
with_harakat = sum(1 for a in ayahs if any("\u064b" <= c <= "\u0652" for c in a["t"]))
assert with_harakat > 6000, with_harakat
assert all(a["i"].strip() for a in ayahs)
assert all(a["t"].strip() for a in ayahs)

# specific well-known checks (compare harakat/orthography-insensitively: the
# Uthmani edition writes alif-hamza as ٱ where plain text uses ا, and adds
# tatweel/kashida; strip marks AND whitespace before substring checks.)
def find(s, a):
    return next(x for x in ayahs if x["s"] == s and x["a"] == a)

import unicodedata
def norm(s):
    d = unicodedata.normalize('NFD', s)
    d = ''.join(c for c in d if not unicodedata.combining(c))
    d = d.replace('\u0671', 'ا').replace('\u0640', '')  # wasla -> alif, drop tatweel
    return ''.join(c for c in d if not c.isspace())

kursi = find(2, 255)
assert 'اللهلاالهالاهو' in norm(kursi['t']), kursi['t'][:60]
ikhlas = [find(112, i) for i in range(1, 5)]
assert 'قلهواللهاحد' in norm(ikhlas[0]['t']), ikhlas[0]['t']
print("\nverified: ayat kursi ->", kursi["t"][:50])
print("verified: al-ikhlas 1 ->", ikhlas[0]["t"])
print("verified: al-ikhlas 1 (id) ->", ikhlas[0]["i"])

with open(os.path.join(OUT, "surahs.json"), "w", encoding="utf-8") as f:
    json.dump(surahs, f, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(OUT, "ayahs.json"), "w", encoding="utf-8") as f:
    json.dump(ayahs, f, ensure_ascii=False, separators=(",", ":"))

sz1 = os.path.getsize(os.path.join(OUT, "surahs.json"))
sz2 = os.path.getsize(os.path.join(OUT, "ayahs.json"))
print(f"\nwrote {len(surahs)} surahs ({sz1/1024:.0f} KB) + {total} ayahs ({sz2/1024/1024:.2f} MB)")
