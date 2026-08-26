# MASTER HANDOFF PROMPT — STUDIHOME

Tanggal pembaruan: 26 Agustus 2026  
Status: **AUDIT OPEN — Production SHA Verified, Migrations Ready**

## 1. MISSION
Lanjutkan Studihome sebagai senior product engineer + UX engineer + security-minded architect + release engineer.

Prioritas wajib:
1. Security & data integrity
2. Functional correctness
3. Routing/runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual fidelity
8. Animation

Aturan mutlak: **jangan reset proyek, jangan redesign tanpa instruksi eksplisit, jangan menambah runtime layer jika canonical source sudah cukup, dan jangan menyebut selesai tanpa bukti source → build → deployment → runtime/browser.**

## 2. SOURCE OF TRUTH
- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Production SHA: **`f9c6d51`** ✅ VERIFIED via Vercel dashboard (26 Aug 2026)
- Hosting: Vercel
- Frontend: static HTML/CSS/Vanilla JS
- Auth/data authority: Supabase Auth + RLS/policies/functions
- Payment/order authority: existing Studihome checkout/order logic

Legacy file tidak dianggap aktif hanya karena masih ada. Selalu cari reference + boot order + runtime owner sebelum delete.

## 3. LOCKED HOMEPAGE VISUAL CONTRACT
Homepage `/` tidak boleh didesain ulang.

Hero baseline yang harus dipertahankan:
- gradient `#151c75 → #3f48bf`;
- text putih;
- amber/yellow untuk emphasis/CTA;
- markup, layout, spacing, typography, hierarchy, CTA dan komposisi mengikuti baseline yang telah disepakati;
- historical baseline: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

**STATUS:** ⚠ **OPEN** — Constitution Gate A. Hero visual parity requires browser verification. Previous claim of "verified" not supported by source audit.

## 4. PRODUCTION CSS CONTRACT
`cdn.tailwindcss.com` dilarang di production.

`index.html` sekarang menggunakan:
`/tailwind-compiled.css?v=20260825r3`

**⚠ IMPORTANT:** Compiled CSS uses Tailwind v3.4.17 **with Preflight enabled**. Constitution Art IV states "tanpa Preflight". This is an open contract violation that needs resolution (either regenerate CSS without Preflight, or update Constitution to accept current state).

**STATUS:** ⚠ **CONTRACT VIOLATION** — Preflight present despite Constitution prohibition.

## 5. AUTH ACCESSIBILITY CONTRACT
Tanpa mengubah desain atau auth logic:
- `login-email` → `autocomplete="username"`
- `login-password` → `autocomplete="current-password"`
- `reg-name` → `autocomplete="name"`
- `reg-email` → `autocomplete="email"`
- `reg-phone` → `autocomplete="tel"`
- `reg-password` → `autocomplete="new-password"`

**STATUS:** ⚠ **CONFLICT** — Constitution Gate B says OPEN ("login-email browser warning"). Previous Handoff claimed VERIFIED. Autocomplete attributes are in JS runtime, not verifiable from static source alone.

## 6. CANONICAL ROUTES
- `/` → homepage
- `/{username}` → public Creator profile
- `/dapur` → Dapur root
- `/dapur/{username}` → Creator workspace

Canonical Vercel rewrites:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan memakai inline regex parameter pada `rewrites.source`; sebelumnya menghasilkan `Invalid vercel.json file provided`.

Jangan menghidupkan kembali route:
- `/dapur/foyer`
- `/dapur/menu`
- `/dapur/hidangan`
- `/dapur/ambalan`

## 7. DAPUR PUBLIC/MEMBER CONTRACT
`/dapur` adalah landing/entry Creator yang sama untuk publik dan member.

### Public
- tampil shell Dapur;
- informasi singkat syarat Creator;
- hanya CTA `Masuk / Daftar` aktif → popup auth canonical;
- tidak menunggu auth untuk merender shell publik;
- Flash Sale boleh menampilkan tepat **1** produk Premium aktif dengan diskon terbesar;
- tombol Flash Sale memakai existing Lobi checkout/order logic.

### Premium member tanpa Creator
- CTA `Mulai Membuat Dapur`;
- provisioning Creator dilakukan backend;
- setelah draft tersedia → `/dapur/{username}`.

### Premium member dengan Creator
- CTA `Kelola Dapur Kamu` / copy canonical yang sedang aktif;
- target `/dapur/{username}`.

### Non-Premium
- workspace tidak boleh dapat dibuka hanya dengan URL;
- entitlement dan authorization backend/RLS adalah authority.

## 8. CANONICAL DAPUR RUNTIME
Runtime owner tunggal:
- `dapur.html` — minimal shell
- `dapur-entry.js` — satu renderer + route/auth orchestration
- `dapur-editor.js` — standalone editor, lazy-loaded
- `vercel.json` — route contract
- `supabase-config.js` — singleton

Dilarang:
- global `MutationObserver` pada canonical Dapur runtime;
- second-stage DOM decorator;
- legacy access-gate/injector;
- renderer kedua;
- section route tambahan.

Generasi superseded berikut sudah dihapus dan jangan dihidupkan kembali:
- `dapur-app-v1.js` … `dapur-app-v4.js`
- `dapur-entry-v6.js`, `dapur-entry-v7.js`
- `dapur-runtime-v4.js`
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`
- `dapur-cta-v1.js`
- `dapur-design-v2.js`
- `dapur-enhancements-v1.js`
- `dapur-access-gate.js`
- `dapur-workspace.js`

Compatibility/admin surfaces yang masih harus diaudit sebelum delete:
- `dapur-admin-user-route-v1.js` — **NOT in repo** (verify before removing from docs)
- `dapur-button.js` — **NOT in repo** (referenced in Constitution + vercel.json headers, but file absent)
- `admin-dapur-creator-v5.js` — present in repo (16.7KB)
- `admin-dapur-ui-v2.js` — present in repo (11.9KB)

## 9. DAPUR INFORMATION ARCHITECTURE
- Foyer = identitas, bio, kontak, publikasi
- Menu = kategori/fokus keahlian
- Hidangan = layanan, harga, manfaat, estimasi
- Ambalan = karya/bukti kerja

Workspace wajib mudah dipakai pengguna awam, responsive, mobile-first, dengan:
- `Tips cepat cari customer`
- canonical public URL `https://studihome.id/{username}`
- `Salin`
- `Bagikan`

## 10. SECURITY / BACKEND CONTRACT
- Frontend bukan security boundary.
- Supabase/RLS/backend adalah authority.
- Owner Creator hanya boleh mengelola Creator sendiri.
- Admin mengikuti backend authority.
- Service-role key tidak boleh ada di frontend.
- Anonymous public-read hanya pada data Creator yang memang public/published/active.
- Anonymous write Creator data ditutup.
- Authorization-only RPC seperti `is_admin`, `has_creator_workspace_access`, `has_premium_creator_access`, `is_creator_eligible`, `can_publish_creator` tidak boleh EXECUTE oleh `anon`.
- `validate_creator_username(text)` wajib safe `search_path` dan authenticated-only.

**STATUS:** ⚠ Previous audit claimed all remediated. RC15 gate still reports `is_admin()` anon active. RC16 overrides with owner-supplied evidence. **Requires fresh live verification.**

### Database Security Status (Previous Audit Claim — Not Re-verified 26 Aug)
- 31 SECURITY DEFINER functions — claimed all have `search_path=""`
- `is_admin()` restricted to authenticated users only (claimed)
- `has_creator_workspace_access()` fixed (claimed)
- `has_premium_creator_access()` fixed (claimed)
- RLS policies enforced on: `site_settings`, `products`, `testimonials`, `ai_links`, `modules`, `profiles`
- Storage bucket `creator-media`: owner-only upload/delete
- Leaked-password protection: ENABLED
- `email_verification_tokens`: RLS policy added

Perubahan RLS/SQL wajib didahului audit table → policy → function/RPC → grants → callers. Jangan memakai SQL sebagai solusi masalah UI/router.

## 11. PENDING DATABASE MIGRATIONS (HARDENED — 26 Aug 2026)

Three SQL migration files exist in repo, all **hardened** but **NOT yet run to production**:

1. **Migration 10** — `validate_creator_publish()` trigger fix ✅ HARDENED
   - `search_path=""` ✅ | REVOKE EXECUTE from PUBLIC/anon ✅ | idempotent DROP TRIGGER ✅ | verification queries ✅ | rollback ✅
2. **Migration 11** — `contact_email DROP NOT NULL` ✅ HARDENED
   - Constitution Art XI alignment ✅ | CHECK constraint verification ✅ | NULL audit ✅ | rollback with safety guard ✅
3. **Migration 12** — `hero_promo_modules JSONB` column ✅ HARDENED
   - RLS pre-check (pg_tables + pg_policies) ✅ | Constitution Art XI audit chain ✅ | rollback ✅ | data validation ✅

Run sequence: M10 → M11 → M12 via Supabase SQL Editor. Backup database before running.

## 12. NEW RUNTIME FILES (26 Aug 2026)

Files present in repo not documented in previous handoff:

| File | Purpose |
|------|---------|
| `dapur-production-hardening-v2.js` | Dapur runtime hardening |
| `dapur-editor-hardening-v1.js` | Editor hardening |
| `dapur-interaction-recovery-v1.js` | Interaction recovery |
| `dapur-profile-edit-fix-v1.js` | Profile edit fix |
| `dapur-profile-enhancements.js` | Profile enhancements |
| `studio-ai-creator-card.js` | Creator card component |
| `studio-ai-enhancements.js` | Studio AI enhancements |
| `studio-ai-production-enhancements.js` | Studio AI production |
| `studio-ai-search.js` | Studio AI search |
| `admin-gudang-v2.js` | Admin gudang v2 |
| `under-construction.js` | Under construction renderer |
| `under-construction-gudang.js` | Under construction admin panel |
| `maintenance-gate.js` | Maintenance mode gate |
| `supabase-sdk-loader-v1.js` | Supabase SDK fallback loader |
| `creator-public.js` | Public creator profile |
| `DATABASE_MIGRATION_10.sql` | Pending migration |
| `DATABASE_MIGRATION_11.sql` | Pending migration |
| `DATABASE_MIGRATION_12.sql` | Pending migration |

## 13. CURRENT PRODUCTION STATE
Production SHA: **`f9c6d51`** ✅ VERIFIED via Vercel dashboard (26 Aug 2026, Status: Ready, Environment: Production).

Local HEAD matches production SHA. Routing, runtime, and security status documented in PROJECT_STATE_LATEST.md.

## 14. VERIFIED CLOSED ITEMS
- Vercel invalid regex rewrite issue fixed.
- Canonical Dapur runtime consolidated.
- Dapur global MutationObserver removed from canonical runtime.
- Dapur second-stage decorator removed.
- Dapur legacy access-gate/injector removed.
- `dapur.html` reduced to minimal shell.
- Legacy `intent=creator` is not a special Dapur runtime.
- Public Creator read path was corrected.
- Anonymous Creator writes closed.
- Authorization-only function execution hardened.
- Username validator search_path hardened.
- Tailwind CDN removed from `index.html`; compiled CSS in place.
- RC19 malformed `<script>` tag fixed.
- Duplicate `<style>` block removed.
- Editor version string synced.
- RC19 diagnostic variable names aligned.

## 15. OPEN ITEMS — DO NOT CLAIM AS DONE

### P0 — Must resolve before release
1. ~~**Verify true production SHA**~~ ✅ DONE (26 Aug — verified `f9c6d51` via Vercel dashboard)
2. ~~**Resolve RC15/RC16 contradiction**~~ ✅ DONE (26 Aug — RC15 updated to PASS)
3. **Run Migrations 10–12** to production — files **READY TO RUN** (all 3 hardened 26 Aug)
4. ~~**Fix Migration 10**~~ ✅ DONE (26 Aug — fully hardened)
5. ~~**Harden Migration 11**~~ ✅ DONE (26 Aug)
6. ~~**Harden Migration 12**~~ ✅ DONE (26 Aug)
7. ~~**Add missing security headers**~~ ✅ DONE (26 Aug — HSTS + X-Content-Type-Options added to vercel.json)

### P1 — Contract violations / conflicts
5. **Preflight in compiled CSS** — Constitution says "tanpa Preflight"
6. **Auth autocomplete conflict** — Constitution Gate B OPEN vs Handoff CLOSED
7. **Homepage hero parity** — Constitution Gate A OPEN vs Handoff CLOSED
8. **Dead reference** — `dapur-button.js` in vercel.json (file absent)
9. **CSS version drift** — all docs must reference `?v=20260825r3`

### P2 — Documentation
10. Document 13+ new runtime files
11. Update all 3 state docs to same SHA and status

### P3 — E2E (requires real browser)
12. Full authenticated browser E2E

## 16. RELEASE GATE
Do not say `SIAP RILIS` until all are true:
- final main SHA identified and consistent across all docs;
- Production READY on same final SHA;
- homepage hero equals locked baseline (browser-verified);
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- public Creator API requests 200;
- no functional console errors;
- auth accessibility warning closed (browser-verified);
- owner/authz browser E2E proven;
- legacy Dapur resource requests remain zero;
- payment/order logic remains unchanged and PASS;
- ~~RC15/RC16 contradiction resolved~~ ✅;
- Migrations 10–12 complete (files ready, awaiting production run);
- ~~security headers complete~~ ✅.

**STATUS:** ⚠ **CONDITIONAL** — Production SHA verified ✅ + Migrations ready to run + browser E2E pending.

## 17. CHANGE PROTOCOL
For every change:
1. identify owner;
2. search references;
3. inspect boot order;
4. patch canonical source only;
5. keep blast radius minimal;
6. syntax/config validation;
7. deploy;
8. verify commit SHA = deployment SHA;
9. verify affected HTTP routes;
10. check runtime logs;
11. inspect browser console for affected page;
12. only then declare status.

## 18. DO NOT REGRESS
Do not:
- redesign homepage hero;
- reintroduce Tailwind CDN;
- alter public Creator URL `/{username}`;
- change meaning of `/dapur` or `/dapur/{username}`;
- create a second Dapur renderer/decorator;
- use global observer as a UI patch;
- put service-role key in frontend;
- duplicate checkout/order logic;
- change RLS for presentation-only bugs;
- resurrect deleted legacy runtime.

## 19. CHATGPT LIMIT NOTICE
`Anda telah mencapai panjang maksimum untuk percakapan ini...` adalah notifikasi UI ChatGPT, bukan error Studihome. Jangan mengubah aplikasi untuk pesan tersebut.

## 20. NEXT-CHAT STARTER
> Baca `MASTER_HANDOFF_PROMPT_STUDIHOME.md`, `PROJECT_CONSTITUTION.md`, `PROJECT_STATE_LATEST.md`, dan `RELEASE_CHECKLIST_STUDIHOME.md`. Jangan reset proyek. Verifikasi current `main` SHA dan Vercel Production SHA terlebih dahulu. **Jangan klaim READY atau SIAP RILIS sampai semua P0 items di atas terselesaikan.** Gunakan perubahan sekecil mungkin, audit references/boot order, lalu verify source → build → deployment → runtime → browser.
