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
Homepage/Teras adalah visual contract yang tidak boleh berubah tanpa instruksi eksplisit.

Hero:
- pertahankan markup, layout, typography, spacing, hierarchy, CTA, warna, dan visual yang sudah disepakati;
- gradient utama hero: `#151c75` → `#3f48bf`;
- heading/subheading tetap menggunakan kontras putih sesuai baseline;
- amber/yellow menjadi emphasis/CTA;
- jangan mengganti desain hanya karena ada masalah CSS/build;
- baseline visual historis yang dikunci: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

Regression yang baru diselesaikan:
- migrasi Tailwind CDN → static compiled CSS sempat membuat hero putih karena `.card-3d { background:#fff }` mengalahkan utility gradient;
- perbaikannya hanya memperbaiki cascade/static CSS, bukan mengubah desain hero;
- current production static CSS memuat guard khusus gradient hero agar parity visual tetap terjaga.

## 4. PRODUCTION CSS CONTRACT
- `cdn.tailwindcss.com` dilarang di production.
- `index.html` memakai `/tailwind-compiled.css` sebagai utility layer canonical.
- CSS dibangun dari source HTML/JS menggunakan Tailwind CLI.
- Jangan menghapus base/Preflight secara sembarangan karena dapat memunculkan visual regression pada homepage.
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

Jangan memakai inline regex parameter pada `rewrites.source`; pernah menyebabkan `Invalid vercel.json file provided`.

## 7. DAPUR PUBLIC + MEMBER CONTRACT
`/dapur` adalah landing/entry Creator.

Public:
- tampil shell Dapur yang sama;
- informasi singkat syarat menjadi Creator;
- hanya CTA `Masuk / Daftar` yang membuka popup auth canonical;
- produk Flash Sale boleh tampil sebagai public offer jika berasal dari catalog aktif, tetapi checkout tetap memakai existing Lobi flow.

Member tanpa Creator + Premium:
- CTA `Mulai Membuat Dapur`;
- target `/dapur` lalu provisioning backend;
- setelah draft tersedia → `/dapur/{username}`.

Member dengan Creator + Premium:
- CTA `Kelola Dapur Kamu` / `Kelola Dapurku` sesuai copy canonical saat ini;
- target `/dapur/{username}`.

Non-Premium:
- tidak boleh membuka workspace hanya dengan URL;
- akses ditentukan backend/RLS.

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

Editor progresif, mobile-first, mudah untuk pengguna awam, dengan helper/error/success/empty state yang manusiawi.

Canonical public link Creator:
`https://studihome.id/{username}`

Aksi wajib pada workspace:
- `Salin`;
- `Bagikan`.

## 10. SECURITY / BACKEND
- Frontend bukan security boundary.
- Supabase/RLS/backend adalah authority.
- Owner Creator hanya mengelola Creator miliknya sendiri.
- Admin mengikuti authority backend.
- Service-role key tidak boleh berada di frontend.
- Jangan mengubah RLS/SQL untuk masalah UI/router sebelum audit table + policy + RPC + grants + caller.

Public Creator read policies harus memungkinkan anonymous SELECT hanya pada data yang memang public/published/active. Anonymous tidak boleh mempunyai write access ke tabel Creator.

Authorization-only functions seperti `is_admin`, `has_creator_workspace_access`, `has_premium_creator_access`, `is_creator_eligible`, `can_publish_creator` tidak boleh dieksekusi oleh `anon`.

`validate_creator_username(text)` harus memiliki `search_path` aman dan dipanggil hanya oleh `authenticated`.

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

## 13. RELEASE VERIFICATION — CURRENT
Current application commit:
`0e1a53ed1fc9931f0fa5c3e3cff64e40ec96a59b`

Production deployment:
`dpl_DUGyQFVJduxWgbNU7snFerQKGRLr`

Production state:
`READY`

Deployment commit metadata:
`0e1a53ed1fc9931f0fa5c3e3cff64e40ec96a59b`

Verified:
- Vercel build completed successfully;
- production runtime error/fatal/warning query for the latest verification window returned no logs;
- `/tailwind-compiled.css?v=20260817r1` returns HTTP 200;
- production CSS contains the canonical hero gradient guard;
- `index.html` no longer references `cdn.tailwindcss.com`;
- `login-email` uses `autocomplete="username"`;
- `login-password` uses `autocomplete="current-password"`.

## 14. E2E LIMITATION
Source/runtime verification is not a substitute for authenticated browser E2E. A full member test still requires a real authenticated session covering:
- Premium without Creator → create Dapur;
- Premium with Creator → manage Dapur;
- edit username;
- owner isolation;
- logout → workspace denied;
- public popup auth → successful login/register.

Do not claim those flows PASS unless actually executed in a browser session.

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

adalah notifikasi antarmuka ChatGPT, bukan error Studihome. Jangan mengubah aplikasi untuk menghapus pesan tersebut.

## 17. NEXT-CHAT STARTER
> Lanjutkan Studihome dari `MASTER_HANDOFF_PROMPT_STUDIHOME.md` dan `PROJECT_CONSTITUTION.md` pada branch `main`. Jangan reset dan jangan redesign. Verifikasi current HEAD + Vercel Production SHA + `/` + `/dapur` + `/dapur/{username}` + runtime/build/console sebelum perubahan. Pertahankan homepage hero sebagai locked visual contract dan gunakan static Tailwind CSS, bukan CDN.
