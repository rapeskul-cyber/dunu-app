# DoZiR — Pentest, Hardening & Build-Variant Notes

Target: `https://dozir-app.vercel.app` (own property, defensive testing)
Scope: static SPA (Expo / React Native Web + SQLite WASM) on Vercel. **No backend.**

## Threat model first (why the surface is small)
- No server, no API of ours, no server-side database. All user data (tasbih,
  bookmarks, habits, account) lives in SQLite **on the user's own device**.
  There is therefore no injection endpoint, no server-side vuln, no
  cross-tenant leak, no session cookie to steal.
- Consequence: the attack classes that actually apply are (1) XSS / HTML
  injection, (2) missing response hardening headers, (3) injection into the
  *local* SQL (LIKE wildcards), (4) OAuth identity integrity,
  (5) supply chain, (6) the login gate's real strength (see last section).

## Findings

### F-01 · HIGH · Security headers absent in production — FIXED & VERIFIED LIVE
Evidence at review time: `curl -sI` returned only `Strict-Transport-Security`.
No CSP / `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` /
`Permissions-Policy`.
Root cause: `vercel.json` lived only in `dist/`, while the GitHub-integration
build reads it from the **repo root** — so headers silently never applied on
that route.
Impact: no defence-in-depth against injected script, MIME sniffing enabled,
and the page could be framed by a third party — **clickjacking is relevant
because the app has a "Masuk dengan Google" button**.
Fix: single source of truth at repo root; `postexport.py` copies it into
`dist/` so both deploy routes get identical policy. CSP was written *after*
inspecting the bundle (0 inline scripts, worker from `self` + `importScripts`,
WASM needs `'wasm-unsafe-eval'`).
Live verification (`scripts/verify_live.py`, headless Chromium):
all headers present, `app boots under strict CSP (SQLite WASM runs)` OK,
`CSP blocks eval (no unsafe-eval)` OK, zero 404/JS/console errors.

### F-02 · MEDIUM · LIKE wildcard injection in search — FIXED
`src/data/repositories/QuranRepository.ts`
- `findSurahByName()` interpolated user input into `LIKE` with no escaping.
- `search()` had an escape attempt whose regex never escaped the backslash.
Exploit: type `%` in the search box → wildcard matches everything → the entire
6236-ayah corpus returned for one keystroke (garbage results + wasted CPU).
Fix: `escapeLike()` escapes `\`, `%`, `_`; both queries use `ESCAPE '\'`.
Regression test included in the live verifier.

### F-03 · MEDIUM · Unvalidated Google `id_token` claims — FIXED
Was: JWT payload trusted as-is; no `iss` / `aud` / `exp` check. A token minted
for another client, a forged issuer, or an expired session could attach an
identity locally.
Honest note: with no backend there is **no privilege to escalate**, so this is
not an authorisation boundary — but wrong identity still corrupts streak
attribution, so it mattered.
Fix: verify `iss ∈ {accounts.google.com, https://accounts.google.com}`,
`aud === our client id`, `exp > now`. RSA signature verification is impossible
in a pure client — documented in code: move to server-side validation the day
a backend exists.

### F-04 · LOW · Crash on empty profile name — FIXED
`ProfileScreen.tsx` called `profile.name.slice(...)`; an empty/absent name
crashed the whole screen. Now guarded with a fallback initial.

### F-05 · LOW · Resource exhaustion on 1-char queries — MITIGATED
F-02 removed the wildcard amplification. Residual: minimum query length is not
enforced, so a 1-character query still scans 6236 haystacks. Impact is confined
to the user's own device; left as a UX tradeoff rather than silently rejecting
short searches.

### F-06 · INFO · base64 decode correctness on native — FIXED during hardening
`atob` is web-only; the decoder was replaced with a dependency-free base64
implementation so token decoding behaves identically on Android/iOS.

### F-07 · INFO · Supply chain — 10 moderate advisories, dev-only
`npm audit --omit=dev`: all advisories sit in Expo tooling
(`@expo/config-plugins`, `@expo/prebuild-config`, `@expo/inline-modules`) —
build-time only, never shipped to the browser. No HIGH/CRITICAL. Recommendation:
follow Expo SDK updates; do **not** run `npm audit fix --force` (breaks the SDK
dependency chain).

## Verified NOT vulnerable (so the report isn't over-claimed)
- **SQL injection:** every dynamic value is parameter-bound (`?`); regex sweep
  over `src/` found no string interpolation or concatenation into SQL.
- **XSS:** 0 `dangerouslySetInnerHTML`, 0 `innerHTML`, 0 `eval`, 0 `new Function`.
  Qur'an text renders as React **text**, so markup in data cannot execute.
- **Secrets in shipped code:** sweep for `sk-`, `gho_`, `AIza`, `api_key`,
  `password`, `token` found nothing hardcoded.
- **Transport:** every external origin is HTTPS; HSTS with preload is on.
- **Server-side:** none exists to exploit.

## Gate: what it does and does not do  (gated/APK variant only)
The `dozir-app` variant requires Google sign-in before any content renders.
- It **does** stop casual sharing: nobody can open the app and read the mushaf
  or your streak without authenticating, and progress is bound to an account.
- It **does not** stop a motivated user: the check runs client-side, so a
  debugger or a rebuilt APK can bypass it. Content is also cached locally
  after first run.
- Real enforcement requires a server that verifies the ID token and issues
  entitlements (or gates the asset download). Until then, treat the gate as a
  **sharing deterrent with honest wording in the UI**, not DRM.
- The ungated web/PWA variant stays in its own repository, unmodified.

## Reproduce
```bash
npm run typecheck          # tsc (app) + tsc (scripts) clean
npm run verify:db          # 56 assertions: schema, seed, repos, tasbih, habit, quran
npx tsx scripts/verify-quran.mts   # 9 assertions: basmala, BOM, muqatta'at, harakat
python scripts/postexport.py       # relocate node_modules assets + copy security config
python scripts/to_vercel_output.py # Vercel Build Output API (.vercel/output)
npx vercel deploy --prod --prebuilt --yes
python scripts/verify_live.py https://dozir-app.vercel.app   # browser proof, CSP-safe
```
