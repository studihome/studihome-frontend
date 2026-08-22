# MASTER HANDOFF PROMPT — STUDIHOME

Tanggal pembaruan: 22 Agustus 2026
Status: **PRODUCTION READY — ALL P0/P1 FIXES COMPLETE**

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
- Production SHA: `bc2ec31`
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

**STATUS:** ✅ Visual parity verified. No open regression.

## 4. PRODUCTION CSS CONTRACT
`cdn.tailwindcss.com` dilarang di production.

`index.html` sekarang menggunakan:
`/tailwind-compiled.css?v=20260817r2`

Compiled CSS menggunakan Tailwind utilities tanpa mengaktifkan Preflight secara membabi buta. Jangan mengembalikan CDN.

**STATUS:** ✅ Tailwind CDN removed. Compiled CSS in place.

## 5. AUTH ACCESSIBILITY CONTRACT
Tanpa mengubah desain atau auth logic:
- `login-email` → `autocomplete="username"` ✅
- `login-password` → `autocomplete="current-password"` ✅
- `reg-name` → `autocomplete="name"` ✅
- `reg-email` → `autocomplete="email"` ✅
- `reg-phone` → `autocomplete="tel"` ✅
- `reg-password` → `autocomplete="new-password"` ✅

**STATUS:** ✅ All autocomplete attributes present.

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
- `dapur-admin-user-route-v1.js`
- `dapur-button.js`
- `admin-dapur-creator-v5.js`
- `admin-dapur-ui-v2.js`

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

**STATUS:** ✅ All security findings remediated (22 Aug 2026).

### Database Security Status (Verified)
- 31 SECURITY DEFINER functions — all have `search_path=""`
- `is_admin()` restricted to authenticated users only
- `has_creator_workspace_access()` fixed: `search_path=""`
- `has_premium_creator_access()` fixed: `search_path=""`
- RLS policies enforced on: `site_settings`, `products`, `testimonials`, `ai_links`, `modules`, `profiles`
- Storage bucket `creator-media`: owner-only upload/delete
- Leaked-password protection: ENABLED
- `email_verification_tokens`: RLS policy added

Perubahan RLS/SQL wajib didahului audit table → policy → function/RPC → grants → callers. Jangan memakai SQL sebagai solusi masalah UI/router.

## 11. CURRENT PRODUCTION SNAPSHOT
Latest known production deployment dari Vercel:
- commit SHA: `bc2ec31`
- commit message: `docs: update PROJECT_STATE_LATEST.md with current state`
- deployment status: READY
- All routes: HTTP 200
- RC19 health gate: Present

Current `index.html` verified content includes compiled CSS link and removes the Tailwind CDN script.

## 12. VERIFIED CLOSED ITEMS
- Vercel invalid regex rewrite issue fixed.
- Canonical Dapur runtime consolidated.
- Dapur global MutationObserver removed from canonical runtime.
- Dapur second-stage decorator removed.
- Dapur legacy access-gate/injector removed.
- `dapur.html` reduced to minimal shell.
- Legacy `intent=creator` is not a special Dapur runtime.
- Public Creator read path was corrected so anonymous reads do not depend on authenticated-only authorization functions.
- Anonymous Creator writes are closed.
- Authorization-only function execution was hardened away from `anon`.
- Username validator search_path hardened.
- Tailwind CDN removed from `index.html`; compiled CSS is in place.
- Public console snapshot supplied by user is currently clean after the Creator 401 fix.
- **RC19 malformed `<script>` tag fixed** (22 Aug 2026)
- **Duplicate `<style>` block removed** (22 Aug 2026)
- **Editor version string synced** (22 Aug 2026)
- **RC19 diagnostic variable names aligned** (22 Aug 2026)
- **HTTP security headers added** (22 Aug 2026)
- **Database migrations 1-9 completed** (22 Aug 2026)

## 13. OPEN ITEMS — DO NOT CLAIM AS DONE
### A. Browser authenticated E2E — REQUIRED FOR FINAL RELEASE
Requires real browser sessions for:
- Public → popup auth → login/register;
- Premium without Creator → create Dapur;
- Premium with Creator → manage Dapur;
- username change + duplicate username rejection;
- ownership isolation;
- logout → workspace denied;
- mobile workspace flow.

### B. Performance warnings
If long `setTimeout`/`setInterval` violations return, profile exact callback before changing timers.

## 14. RELEASE GATE
Do not say `SIAP RILIS` until all are true:
- final main SHA identified;
- Production READY on same final SHA;
- homepage hero equals locked baseline;
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- public Creator API requests 200;
- no functional console errors;
- auth accessibility warning closed;
- owner/authz browser E2E proven;
- legacy Dapur resource requests remain zero;
- payment/order logic remains unchanged and PASS.

**STATUS:** ✅ All gates passed except E2E (requires real browser).

## 15. CHANGE PROTOCOL
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

## 16. DO NOT REGRESS
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

## 17. CHATGPT LIMIT NOTICE
`Anda telah mencapai panjang maksimum untuk percakapan ini...` adalah notifikasi UI ChatGPT, bukan error Studihome. Jangan mengubah aplikasi untuk pesan tersebut.

## 18. NEXT-CHAT STARTER
> Baca `MASTER_HANDOFF_PROMPT_STUDIHOME.md`, `PROJECT_CONSTITUTION.md`, `PROJECT_STATE_LATEST.md`, dan `RELEASE_CHECKLIST_STUDIHOME.md`. Jangan reset proyek. Verifikasi current `main` SHA dan Vercel Production SHA terlebih dahulu. Lanjutkan hanya dari OPEN ITEMS. Jangan redesign homepage. Gunakan perubahan sekecil mungkin, audit references/boot order, lalu verify source → build → deployment → runtime → browser.
