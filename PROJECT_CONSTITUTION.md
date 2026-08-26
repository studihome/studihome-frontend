# PROJECT CONSTITUTION — STUDIHOME

Tanggal pembaruan: 26 Agustus 2026

## ARTICLE I — PRODUCT PRINCIPLE
Studihome harus sederhana bagi pengguna dan disiplin secara teknis.

Prioritas:
1. Security & data integrity
2. Functional correctness
3. Routing/runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual fidelity
8. Animation

**Logic first, UI second.** Visual yang indah tetapi logic salah dianggap gagal.

## ARTICLE II — SINGLE SOURCE OF TRUTH
Satu source of truth untuk route, auth/authorization, data, branding/UI contract, dan runtime renderer.

YAGNI berlaku. Jangan membuat layer, loader, observer, decorator, renderer, atau abstraction baru bila canonical source sudah cukup.

## ARTICLE III — HOMEPAGE VISUAL CONTRACT — LOCKED
Homepage `/` adalah kontrak visual locked.

Hero wajib mempertahankan baseline yang telah disepakati:
- gradient `#151c75 → #3f48bf`;
- text putih;
- amber/yellow untuk emphasis dan CTA;
- markup/layout/spacing/typography/hierarchy/CTA baseline tidak boleh didesain ulang;
- historical visual baseline: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

Jika utility/build CSS mengubah tampilan hero, perbaiki cascade/build artifact. Jangan mengubah desain hero untuk menutupi efek samping build.

**Current status (26 Aug 2026):** Gate A **OPEN**. Hero visual parity requires browser verification. Previous Handoff claim of 'verified' not supported by source audit.

## ARTICLE IV — PRODUCTION CSS CONTRACT
- `cdn.tailwindcss.com` dilarang di production.
- `index.html` menggunakan `/tailwind-compiled.css?v=20260825r3`.
- **⚠ Current compiled CSS uses Tailwind v3.4.17 WITH Preflight.** This is a known contract violation that needs resolution.
- Utility CSS harus dapat dibangun secara reproducible dari source HTML/JS.
- Jangan menyalakan Preflight secara sembarangan jika berpotensi mengubah existing visual contract.
- Jangan mengganti framework CSS untuk sekadar menghilangkan satu warning.

## ARTICLE V — CANONICAL ROUTES
- `/` = homepage
- `/{username}` = public Creator profile
- `/dapur` = Dapur root
- `/dapur/{username}` = Creator workspace

Foyer/Menu/Hidangan/Ambalan adalah section editor, **bukan route**.

Canonical Vercel:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan gunakan inline regex parameter pada `rewrites.source`; konfigurasi semacam itu pernah menyebabkan `Invalid vercel.json file provided`.

## ARTICLE VI — ROLE BOUNDARIES
### Public
- melihat homepage;
- melihat landing Dapur;
- melihat Creator profile yang published;
- membeli produk melalui checkout public existing.

### Member
- mengelola data akunnya;
- Premium menjadi entitlement untuk workspace Creator sesuai product contract;
- hanya boleh mengelola Creator miliknya sendiri.

### Admin
- mengelola Creator sesuai backend authority Studihome.

Authorization sensitif **wajib** diputuskan Supabase/RLS/backend. Frontend hanya control/presentation surface.

## ARTICLE VII — DAPUR PUBLIC/MEMBER CONTRACT
`/dapur` adalah satu landing/entry canonical untuk public dan member.

Public:
- shell Dapur tetap terlihat;
- informasi singkat syarat menjadi Creator;
- hanya CTA `Masuk / Daftar` aktif → popup auth canonical;
- public shell tidak boleh menunggu auth sebelum render;
- Flash Sale boleh memuat tepat satu produk Premium aktif dengan diskon terbesar;
- pembelian Flash Sale menggunakan existing Lobi checkout/order logic.

Premium member tanpa Creator:
- CTA `Mulai Membuat Dapur`;
- provisioning Creator tetap backend-authoritative;
- setelah draft siap → `/dapur/{username}`.

Premium member dengan Creator:
- CTA kelola Creator → `/dapur/{username}`.

Non-Premium:
- URL workspace tidak boleh menjadi bypass entitlement;
- denial harus tetap aman dan backend-authoritative.

## ARTICLE VIII — CANONICAL DAPUR RUNTIME
Runtime canonical:
- `dapur.html` = minimal shell;
- `dapur-entry.js` = satu renderer + routing/auth orchestration;
- `dapur-editor.js` = standalone editor lazy-loaded;
- `vercel.json` = route contract;
- `supabase-config.js` = singleton.

Dilarang pada canonical Dapur runtime:
- global `MutationObserver`;
- second-stage DOM decorator;
- legacy script injector/access gate;
- renderer kedua;
- section-specific routes.

Dapur canonical tidak boleh bergantung pada Tailwind CDN atau FontAwesome runtime dependency.

## ARTICLE IX — DAPUR UX/DESIGN CONSTITUTION
Gaya: clean, premium-light, modern, minimalis, profesional.

Wajib:
- mobile-first;
- responsive desktop/tablet/mobile;
- comfortable tap target;
- readable body text;
- input ≥16px pada mobile;
- clear hierarchy;
- human-readable helper/loading/error/success/empty states;
- keyboard accessible;
- `prefers-reduced-motion` respected.

Design tokens:
- navy sebagai anchor;
- blue untuk action;
- amber untuk emphasis;
- whitespace cukup;
- border lembut;
- shadow ringan;
- radius konsisten;
- typography hierarchy tegas.

Information architecture:
1. Foyer — identitas, bio, kontak, publikasi
2. Menu — kategori/fokus keahlian
3. Hidangan — layanan, harga, manfaat, estimasi
4. Ambalan — karya/bukti kerja

Canonical public URL:
`https://studihome.id/{username}`

Workspace wajib menyediakan `Tips cepat cari customer`, `Salin`, dan `Bagikan`.

## ARTICLE X — AUTH ACCESSIBILITY
Tanpa mengubah desain/auth logic:
- `login-email` → `autocomplete="username"`
- `login-password` → `autocomplete="current-password"`
- `reg-name` → `autocomplete="name"`
- `reg-email` → `autocomplete="email"`
- `reg-phone` → `autocomplete="tel"`
- `reg-password` → `autocomplete="new-password"`

**Status (26 Aug 2026):** Gate B **OPEN**. Login email autocomplete attributes are in JS runtime, not verifiable from static source. Previous Handoff claimed VERIFIED — conflict with Constitution status.

## ARTICLE XI — DATA/BACKEND SECURITY
Supabase adalah source of truth auth + Creator data.

Anonymous public-read hanya untuk data yang memang public/published/active.

Anonymous write terhadap Creator tables dilarang.

Authorization-only RPC/function tidak boleh mempunyai EXECUTE untuk `anon`, termasuk:
- `is_admin`
- `has_creator_workspace_access`
- `has_premium_creator_access`
- `is_creator_eligible`
- `can_publish_creator`

`validate_creator_username(text)` wajib:
- safe `search_path`;
- authenticated-only execution.

Sebelum perubahan SQL/RLS wajib audit:
`table → policy → function/RPC → grants → frontend callers`.

Jangan memakai SQL/RLS sebagai workaround untuk problem UI/router.

## ARTICLE XII — LEGACY POLICY
Legacy dihapus hanya bila reference proof + runtime owner + replacement live + rollback path + consumer audit lulus.

Generasi Dapur yang sudah dianggap superseded:
- `dapur-app-v1.js` … `dapur-app-v4.js`
- `dapur-entry-v6.js`, `dapur-entry-v7.js`
- `dapur-runtime-v4.js`
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`
- `dapur-cta-v1.js`
- `dapur-design-v2.js`
- `dapur-enhancements-v1.js`
- `dapur-access-gate.js`
- `dapur-workspace.js`

Compatibility/admin surfaces masih ditahan:
- `dapur-admin-user-route-v1.js`
- `dapur-button.js`
- `admin-dapur-creator-v5.js`
- `admin-dapur-ui-v2.js`

Jangan hidupkan kembali runtime lama.

## ARTICLE XIII — CHANGE PROTOCOL
Setiap perubahan harus melalui:
1. identifikasi owner;
2. reference audit;
3. boot-order audit;
4. backend caller audit bila relevan;
5. patch canonical source dengan blast radius minimum;
6. syntax/config validation;
7. deploy;
8. commit SHA = deployment SHA;
9. route verification;
10. runtime/build verification;
11. browser/console verification;
12. status declaration.

## ARTICLE XIV — DEPLOYMENT DISCIPLINE
Jangan menyebut `selesai`, `live`, atau `production ready` jika:
- deployment final belum READY;
- deployment bukan commit final;
- route utama belum diuji;
- runtime/build error belum diperiksa;
- target console warning/error belum diperiksa;
- authenticated E2E belum dilakukan ketika diperlukan.

## ARTICLE XV — CURRENT BASELINE
Latest known Production deployment:
**UNVERIFIABLE** — 3 docs cite different SHAs and deployment IDs. Must verify via Vercel dashboard.

Production SHA claimed by different docs:
- MASTER_HANDOFF (22 Aug): `bc2ec31`
- CONSTITUTION Art XV (was): `19a9ff73…` / `dpl_Bnfo4zFye…`
- PROJECT_STATE (22 Aug): `a0de53e`
- RELEASE_HANDOFF (17 Aug): `9a383cb7…` / `dpl_HRw5bSKV1…`

State:
`AUDIT OPEN`

Current homepage source includes `/tailwind-compiled.css?v=20260825r3` (updated since previous baseline). No Tailwind CDN reference. fileciteturn694file0L2-L6

## ARTICLE XVI — OPEN RELEASE GATES
### Gate A — Homepage hero parity
**OPEN.** Hero visual parity requires browser verification against baseline `7406c1f…`. Previous claim of 'verified' not supported.

### Gate B — Login email autocomplete
**OPEN.** Autocomplete attributes are in JS runtime. Previous claim of 'verified' not supported.

### Gate C — Authenticated browser E2E
**OPEN.** Must use actual sessions for:
- public popup login/register;
- Premium no Creator → create Dapur;
- Premium with Creator → manage Dapur;
- username update + duplicate denial;
- owner isolation;
- logout → workspace denial.

### Gate D — Visual parity after compiled CSS
**OPEN.** CSS now at `?v=20260825r3` (was `?v=20260817r1`). Preflight present in compiled CSS (violates Art IV). Browser verification required.

### Gate E — RC15/RC16 contradiction
**RESOLVED ✅ (26 Aug 2026).** RC15 updated to `PASS`, aligned with RC16 `FINAL_LOCKED` owner-supplied evidence. No internal contradiction.

### Gate F — Pending migrations
**OPEN — READY TO RUN.** Migrations 10, 11, 12 have SQL files in repo, all 3 hardened (26 Aug 2026), but have NOT been run to production. Recommended order: M10 → M11 → M12 via Supabase SQL Editor.

Hardening status:
- M10: `search_path=""` ✅ | REVOKE EXECUTE ✅ | idempotent ✅ | verification ✅ | rollback ✅
- M11: Constitution Art XI alignment ✅ | CHECK verification ✅ | rollback ✅
- M12: RLS pre-check ✅ | policy verification ✅ | rollback ✅

### Gate G — Security headers
**RESOLVED ✅ (26 Aug 2026).** `Strict-Transport-Security`, `X-Content-Type-Options`, and `Referrer-Policy` added to vercel.json. All 4 security headers complete.

## ARTICLE XVII — DO NOT REGRESS
Do not:
- redesign homepage hero;
- reintroduce Tailwind CDN;
- change public Creator URL `/{username}`;
- change meaning of `/dapur` or `/dapur/{username}`;
- create Dapur second renderer/decorator;
- use global MutationObserver as UI patch;
- put service-role key in frontend;
- duplicate checkout/order logic;
- change proven RLS just to solve presentation bugs;
- resurrect deleted legacy runtime.

## ARTICLE XVIII — DEFINITION OF DONE
A change is done only when:
- functionally correct;
- authorization correct;
- data integrity preserved;
- route canonical;
- UI visual contract preserved;
- responsive/accessibility basic checks pass;
- production uses final SHA;
- runtime + browser console inspected;
- known limitations explicitly reported.

## ARTICLE XIX — COMMUNICATION RULE
Every engineering report must include:
- what changed;
- why;
- primary runtime/file;
- backend/security impact;
- commit SHA;
- deployment SHA if available;
- verification result;
- limitations.

ChatGPT message `Anda telah mencapai panjang maksimum untuk percakapan ini...` is a ChatGPT UI notice, not a Studihome application error.
