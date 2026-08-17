# MASTER HANDOFF — STUDIHOME

Tanggal pembaruan: 17 Agustus 2026

## 1. MISSION
Lanjutkan Studihome sebagai senior product engineer, UX engineer, security-minded architect, dan release engineer. Prioritas wajib: security/data integrity → functional correctness → routing/runtime stability → accessibility → performance → maintainability → visual fidelity → animation.

Aturan kerja: jangan reset proyek, jangan redesign tanpa permintaan eksplisit, jangan menambah layer baru jika source canonical sudah cukup, dan jangan menyatakan selesai tanpa verifikasi source → build → deployment → runtime.

## 2. SOURCE OF TRUTH
- Repository: `studihome/studihome-frontend`
- Production branch: `main`
- Hosting: Vercel
- Frontend: static HTML/CSS/Vanilla JS
- Auth/data authority: Supabase Auth + RLS/policies/functions
- Payment/order authority: logic existing Studihome; jangan membuat checkout kedua.
- Legacy file tidak dianggap aktif hanya karena masih tersimpan. Cari reference dan runtime owner sebelum delete.

## 3. HOMEPAGE VISUAL CONTRACT — LOCKED
Homepage `/` adalah visual contract yang tidak boleh berubah tanpa instruksi eksplisit.

Hero wajib mempertahankan baseline yang sudah disepakati:
- background gradient: `#151c75` → `#3f48bf`;
- heading/subheading memakai kontras putih;
- amber/yellow untuk emphasis/CTA;
- markup, layout, typography, spacing, hierarchy, CTA, dan komposisi tidak boleh didesain ulang untuk menyelesaikan bug teknis;
- baseline visual historis: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

Regression yang sudah diperbaiki:
- migrasi Tailwind CDN → compiled CSS sempat membuat hero putih karena `.card-3d { background:#fff }` mengalahkan utility gradient;
- solusi yang dipilih hanya memperbaiki cascade pada static CSS;
- guard canonical hero sekarang mengunci `background: linear-gradient(135deg,#151c75 0%,#3f48bf 100%)` untuk kombinasi class hero yang tepat;
- tidak ada perubahan markup, spacing, typography, atau CTA hero.

## 4. PRODUCTION CSS CONTRACT
- `cdn.tailwindcss.com` dilarang di production.
- `index.html` memakai `/tailwind-compiled.css` sebagai utility layer canonical.
- CSS dibangun secara reproducible dari source HTML/JS menggunakan Tailwind CLI.
- Jangan menghapus base/Preflight secara sembarangan.
- Jangan mengganti seluruh CSS framework sebagai respons terhadap satu warning.

## 5. AUTH ACCESSIBILITY CONTRACT
Tanpa mengubah visual/UI:
- login email → `autocomplete="username"`;
- login password → `autocomplete="current-password"`;
- register name → `autocomplete="name"`;
- register email → `autocomplete="email"`;
- register WhatsApp → `autocomplete="tel"`;
- register password → `autocomplete="new-password"`.

## 6. CANONICAL ROUTES
### Public homepage
`/`

### Public Creator profile
`/{username}`

### Dapur root
`/dapur`

### Creator workspace
`/dapur/{username}`

Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

Canonical Vercel rewrites:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan memakai inline regex parameter pada `rewrites.source`; konfigurasi tersebut pernah menyebabkan `Invalid vercel.json file provided`.

## 7. DAPUR PUBLIC + MEMBER CONTRACT
`/dapur` adalah landing/entry Creator.

Public:
- tampil shell Dapur yang sama;
- informasi singkat syarat menjadi Creator;
- hanya CTA `Masuk / Daftar` yang membuka popup auth canonical;
- satu produk Flash Sale boleh tampil bila berasal dari katalog aktif dengan diskon terbesar;
- checkout Flash Sale tetap memakai existing Lobi/order flow, bukan mesin order baru.

Member Premium tanpa Creator:
- CTA `Mulai Membuat Dapur`;
- target `/dapur` lalu provisioning backend;
- setelah draft tersedia → `/dapur/{username}`.

Member Premium dengan Creator:
- CTA `Kelola Dapur Kamu` / copy canonical yang sedang aktif;
- target `/dapur/{username}`.

Non-Premium:
- tidak boleh membuka workspace hanya dengan URL;
- entitlement dan authorization diputuskan backend/RLS.

## 8. CANONICAL DAPUR RUNTIME
Runtime owner tunggal:
- `dapur.html` — minimal shell;
- `dapur-entry.js` — satu renderer + route/auth orchestration;
- `dapur-editor.js` — editor modal standalone, lazy-loaded;
- `vercel.json` — route contract;
- `supabase-config.js` — singleton Supabase.

Dilarang:
- second-stage DOM decorator;
- global `MutationObserver` pada canonical Dapur runtime;
- legacy script injector untuk Dapur;
- renderer kedua;
- route section Foyer/Menu/Hidangan/Ambalan.

## 9. DAPUR INFORMATION ARCHITECTURE
- Foyer: identitas, bio, kontak, publikasi.
- Menu: kategori/fokus keahlian.
- Hidangan: layanan, harga, manfaat, estimasi.
- Ambalan: karya/bukti kerja.

Editor progresif, mobile-first, mudah untuk pengguna awam, dengan helper/error/success/empty state manusiawi.

Canonical public link Creator:
`https://studihome.id/{username}`

Aksi workspace:
- `Salin`;
- `Bagikan`.

## 10. SECURITY / BACKEND
- Frontend bukan security boundary.
- Supabase/RLS/backend adalah authority.
- Owner Creator hanya mengelola Creator miliknya sendiri.
- Admin mengikuti authority backend.
- Service-role key tidak boleh berada di frontend.
- Jangan mengubah RLS/SQL untuk masalah UI/router sebelum audit table + policy + RPC + grants + caller.

Public Creator read policies hanya boleh membuka data yang memang public/published/active. Anonymous tidak boleh mempunyai write access ke tabel Creator.

Authorization-only functions seperti `is_admin`, `has_creator_workspace_access`, `has_premium_creator_access`, `is_creator_eligible`, `can_publish_creator` tidak boleh dieksekusi oleh `anon`.

`validate_creator_username(text)` harus memiliki `search_path` aman dan dibatasi ke authenticated.

## 11. LEGACY POLICY
Generasi lama Dapur yang telah diaudit dan dihapus tidak boleh dihidupkan kembali:
- `dapur-app-v1.js` … `dapur-app-v4.js`;
- `dapur-entry-v6.js`, `dapur-entry-v7.js`;
- `dapur-runtime-v4.js`;
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`;
- `dapur-cta-v1.js`;
- `dapur-design-v2.js`;
- `dapur-enhancements-v1.js`;
- `dapur-access-gate.js`;
- `dapur-workspace.js`.

Compatibility/admin surfaces yang masih ditahan sampai reference proof kuat:
- `dapur-admin-user-route-v1.js`;
- `dapur-button.js`;
- `admin-dapur-creator-v5.js`;
- `admin-dapur-ui-v2.js`.

## 12. CHANGE PROTOCOL
Sebelum mengubah apa pun:
1. identifikasi owner file/runtime;
2. cari semua references;
3. audit boot order dan dependency;
4. ubah source canonical sekali;
5. gunakan perubahan sekecil mungkin;
6. validasi syntax/config;
7. deploy;
8. cocokkan commit SHA dengan deployment SHA;
9. fetch route terdampak;
10. cek build/runtime errors;
11. cek browser console sesuai target perubahan;
12. baru declare selesai.

## 13. RELEASE VERIFICATION — CURRENT BASELINE
Functional application source SHA:
`b9f1d117be2a5f67e68f4fb31f278ea2d888f600`

Production deployment:
`dpl_CGXbrFMZ4Re2CkTZc6zrg7QospkT`

Production state:
`READY`

Target:
`production`

Verified baseline:
- Vercel build completed successfully;
- Production functional deployment matches the functional source SHA above;
- `index.html` no longer references `cdn.tailwindcss.com`;
- `/tailwind-compiled.css?v=20260817r2` is the production utility layer;
- homepage hero has the canonical blue gradient guard without markup/layout redesign;
- `login-email` uses `autocomplete="username"`;
- `login-password` uses `autocomplete="current-password"`;
- register semantic autocomplete tokens are present;
- `/dapur` and `/dapur/{username}` remain canonical routes;
- canonical Dapur does not use global MutationObserver, second-stage decorator, or legacy access-gate runtime;
- latest Production runtime error check for `/`, `/kamar`, `/admin`, `/dapur` found no runtime errors.

Documentation-only commits may create additional Vercel deployments while leaving the functional application source unchanged. For release decisions, track the functional source SHA and the latest Production deployment together.

## 14. E2E LIMITATION
Source/runtime verification bukan pengganti authenticated browser E2E. Browser test nyata masih diperlukan untuk membuktikan:
- Premium tanpa Creator → create Dapur;
- Premium dengan Creator → manage Dapur;
- edit username dan duplicate protection;
- owner isolation;
- logout → workspace denied;
- public popup auth → login/register.

Jangan menyebut skenario tersebut PASS jika belum benar-benar dieksekusi menggunakan sesi nyata.

## 15. DO NOT REGRESS
Do not:
- redesign homepage hero;
- reintroduce Tailwind CDN;
- change public Creator URL from `/{username}`;
- change meaning of `/dapur` or `/dapur/{username}`;
- create second Dapur renderer/decorator;
- add a global observer to fix UI;
- put service-role key in frontend;
- modify payment/order logic that already works;
- modify RLS to solve a presentation-only problem;
- revive deleted legacy runtime.

## 16. CHATGPT MESSAGE NOTE
Pesan:
`Anda telah mencapai panjang maksimum untuk percakapan ini, tetapi Anda bisa terus berbicara dengan memulai obrolan baru.`

adalah notifikasi antarmuka ChatGPT, bukan error Studihome. Jangan mengubah frontend untuk pesan tersebut.

## 17. NEXT-CHAT STARTER
> Lanjutkan Studihome dari `MASTER_HANDOFF_PROMPT_STUDIHOME.md` dan `PROJECT_CONSTITUTION.md` pada branch `main`. Jangan reset dan jangan redesign. Verifikasi current HEAD + Vercel Production SHA + `/` + `/dapur` + `/dapur/{username}` + runtime/build/console sebelum perubahan. Pertahankan homepage hero sebagai locked blue visual contract dan gunakan static Tailwind CSS, bukan CDN.
