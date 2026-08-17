# PROJECT CONSTITUTION — STUDIHOME

Tanggal pembaruan: 17 Agustus 2026

## Article I — Product Principle
Studihome harus sederhana bagi pengguna dan disiplin secara teknis.

Prioritas:
1. Security & data integrity
2. Functional correctness
3. Routing & runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual fidelity
8. Animation

`Logic first, UI second.` Visual yang indah tetapi logic salah dianggap gagal.

## Article II — Single Source of Truth
Satu source of truth untuk route, auth/authorization, data, branding/UI contract, dan runtime renderer.

YAGNI berlaku. Jangan membuat layer, loader, observer, renderer, atau abstraction baru jika source canonical sudah cukup.

## Article III — Homepage Visual Contract — LOCKED
Homepage `/` memiliki visual contract yang locked dan tidak boleh berubah tanpa instruksi eksplisit.

Hero wajib mempertahankan:
- gradient `#151c75 → #3f48bf`;
- text putih pada hero;
- amber/yellow untuk emphasis dan CTA;
- markup, layout, spacing, typography, hierarchy, dan CTA baseline;
- baseline visual historis `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

Bug CSS/build harus diperbaiki pada cascade/build source, bukan dengan mendesain ulang hero.

Regression terbaru yang sudah diperbaiki:
`.card-3d { background:#fff }` mengalahkan utility gradient setelah migrasi ke compiled Tailwind CSS. Solusi canonical adalah static CSS guard yang mengunci gradient hero tanpa mengubah markup maupun layout.

## Article IV — Production CSS Contract
- `cdn.tailwindcss.com` dilarang di production.
- Production memakai `/tailwind-compiled.css`.
- Utility CSS dibangun secara reproducible dari source HTML/JS.
- Jangan menghapus base/Preflight sembarangan.
- Jangan mengganti CSS framework hanya untuk menghilangkan warning.

## Article V — Canonical Routes
### Public homepage
`/`

### Public Creator profile
`/{username}`

### Dapur root
`/dapur`

### Creator workspace
`/dapur/{username}`

Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

Vercel canonical:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan menggunakan inline regex parameter seperti `/:username([a-z0-9]...)` pada `rewrites.source`.

## Article VI — Role Boundaries
### Public
- melihat homepage;
- melihat landing Dapur;
- melihat Creator profile yang published.

### Member
- membuat/mengelola Creator sendiri sesuai backend authority;
- Premium wajib untuk workspace Creator sesuai kontrak produk.

### Admin
- mengelola Creator sesuai authority Studihome.

Authorization sensitif wajib diputuskan Supabase/RLS/backend. Frontend hanya presentation/control surface.

## Article VII — Dapur Runtime Constitution
Canonical runtime:
- `dapur.html` = minimal shell;
- `dapur-entry.js` = satu renderer canonical + route/auth orchestration;
- `dapur-editor.js` = editor standalone lazy-loaded;
- `vercel.json` = route contract;
- `supabase-config.js` = singleton.

Wajib:
- deterministic boot order;
- satu canonical render path;
- no global MutationObserver pada canonical Dapur runtime;
- no post-render decorator;
- no legacy script injector;
- no Tailwind CDN/FontAwesome dependency untuk canonical Dapur shell/editor;
- auth re-render hanya melalui canonical entry.

Dilarang memperbaiki renderer dengan membuat renderer kedua.

## Article VIII — Dapur UX Constitution
- mobile-first;
- responsive desktop/tablet/mobile;
- tap target nyaman;
- body text mudah dibaca;
- input minimal 16px di mobile;
- helper/loading/error/success/empty state manusiawi;
- keyboard accessible;
- `prefers-reduced-motion` dihormati;
- hierarchy visual jelas;
- pengguna awam dapat menyelesaikan tugas utama tanpa pengetahuan developer.

## Article IX — Dapur Information Architecture
1. Foyer — identitas, bio, kontak, publikasi.
2. Menu — kategori/fokus keahlian.
3. Hidangan — layanan, harga, manfaat, estimasi.
4. Ambalan — portofolio/bukti kerja.

Editor progresif; jangan menampilkan form panjang sekaligus tanpa kebutuhan.

Canonical public Creator link:
`https://studihome.id/{username}`

Wajib tersedia pada workspace:
- `Salin`;
- `Bagikan`.

## Article X — Authentication Accessibility
Semantic autocomplete wajib digunakan tanpa mengubah desain:
- login email → `username`;
- login password → `current-password`;
- registration email → `email`;
- registration name → `name`;
- registration phone → `tel`;
- registration password → `new-password`.

## Article XI — Data & Backend Security
Supabase adalah source of truth auth + Creator data.

Sebelum perubahan RLS:
- audit table;
- policy;
- function/RPC;
- execute grants;
- frontend callers.

Service-role key tidak pernah di frontend.

Anonymous public-read hanya boleh membaca data yang memang public/published/active. Anonymous write terhadap Creator data dilarang.

Authorization-only RPC seperti `is_admin`, `has_creator_workspace_access`, `has_premium_creator_access`, `is_creator_eligible`, dan `can_publish_creator` tidak boleh memiliki EXECUTE untuk `anon`.

`validate_creator_username(text)` harus memakai `search_path` aman dan dibatasi ke authenticated.

Jangan ubah SQL/RLS untuk masalah yang sebenarnya hanya UI/router.

## Article XII — Legacy Policy
Legacy tidak dihapus hanya karena terlihat tua.

Generasi Dapur yang sudah aman dihapus:
- `dapur-app-v1.js` … `dapur-app-v4.js`;
- `dapur-entry-v6.js`, `dapur-entry-v7.js`;
- `dapur-runtime-v4.js`;
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`;
- `dapur-cta-v1.js`;
- `dapur-design-v2.js`;
- `dapur-enhancements-v1.js`;
- `dapur-access-gate.js`;
- `dapur-workspace.js`.

Compatibility/admin surfaces yang masih ditahan:
- `dapur-admin-user-route-v1.js`;
- `dapur-button.js`;
- `admin-dapur-creator-v5.js`;
- `admin-dapur-ui-v2.js`.

Delete hanya setelah reference proof, runtime owner, replacement live, rollback path, dan consumer audit lulus.

## Article XIII — Change Protocol
1. identifikasi owner;
2. audit references;
3. audit boot order;
4. ubah canonical source;
5. minimalkan blast radius;
6. validasi syntax/config;
7. deploy;
8. cocokkan commit SHA dengan deployment SHA;
9. fetch route production;
10. cek build/runtime errors;
11. cek browser console sesuai target;
12. baru declare done.

## Article XIV — Deployment Discipline
Tidak boleh menyatakan `selesai`, `live`, atau `production ready` jika:
- deployment final belum READY;
- deployment bukan commit final;
- route utama belum diuji;
- runtime/build error belum diperiksa;
- target console warning/error belum diverifikasi;
- legacy request belum diperiksa.

## Article XV — Current Release State
The final verified production source is:
`9f27388690e984278b3d4ca4fcd16f1bb01c6288`

That functional source was deployed successfully to Production as:
`dpl_GfX5GYb1tKeCWHNtpbFjSfrqfZ9T`

Latest Production deployment, including documentation-only lineage updates:
`dpl_5goqrmzUamPSjEnHHRXTpsXqSzBd`
with state `READY`.

This documentation update creates a new commit and therefore requires a fresh final deployment verification before declaring release complete.

## Article XVI — E2E Boundary
Authenticated browser E2E tidak boleh dianggap PASS hanya dari source inspection.

E2E wajib menggunakan sesi nyata untuk membuktikan:
- Premium tanpa Creator → create Dapur;
- Premium dengan Creator → manage Dapur;
- username validation;
- owner isolation;
- logout → workspace deny;
- public popup auth → login/register.

## Article XVII — Freeze Rules
Tanpa alasan eksplisit jangan ubah:
- global homepage/header visual contract;
- homepage hero;
- canonical public Creator URL `/{username}`;
- arti `/dapur`;
- arti `/dapur/{username}`;
- role boundaries;
- payment/order logic yang sudah PASS;
- security contracts yang sudah PASS.

## Article XVIII — Definition of Done
Fitur/perbaikan dianggap selesai hanya bila:
- logic benar;
- data tersimpan benar;
- authorization benar;
- route canonical benar;
- UI tetap sesuai visual contract;
- responsive;
- accessibility dasar terpenuhi;
- production memakai commit final;
- build/runtime/console production diperiksa;
- keterbatasan E2E dinyatakan secara jujur bila belum dilakukan.

## Article XIX — Communication Rule
Setiap laporan engineering wajib mencantumkan:
- perubahan;
- alasan;
- runtime/file utama;
- backend/security impact bila ada;
- commit SHA;
- deployment SHA jika tersedia;
- verification result;
- limitation.

Pesan ChatGPT `Anda telah mencapai panjang maksimum untuk percakapan ini...` adalah notifikasi UI ChatGPT dan bukan error aplikasi Studihome. Jangan mengubah frontend untuk pesan tersebut.


## Article XIX — Current Production CSS & Auth Accessibility
- Production homepage uses compiled Tailwind CSS; CDN runtime is prohibited.
- Tailwind compilation preserves the base/preflight layer to maintain visual parity with the previously locked homepage.
- Login email uses `autocomplete="username"`; password and registration fields use semantic autocomplete tokens.
- Homepage hero visual contract remains locked; technical fixes must not redesign its markup or composition.
