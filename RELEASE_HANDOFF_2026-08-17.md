# STUDIHOME — RELEASE HANDOFF

Tanggal: 17 Agustus 2026
Repository: `studihome/studihome-frontend`
Branch: `main`
Hosting: Vercel
Auth/Database: Supabase
Frontend: static HTML + CSS + Vanilla JS

## 1. RELEASE OBJECTIVE
Menjaga Studihome tetap fungsional, aman, minimalis-profesional, responsive, dan mudah digunakan dengan risiko regresi seminimal mungkin.

Prioritas tetap:
1. Security & data integrity
2. Functional correctness
3. Routing/runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual polish
8. Animation

## 2. CANONICAL DAPUR
Route canonical:
- `/dapur` → `dapur.html`
- `/dapur/{username}` → `dapur.html`
- `/{username}` → public Creator profile melalui `index.html`

Runtime canonical:
- `dapur.html` = minimal shell
- `dapur-entry.js` = satu renderer + auth/route/UX orchestration
- `dapur-editor.js` = lazy standalone editor
- `supabase-config.js` = Supabase singleton

Dilarang mengembalikan:
- global `MutationObserver` pada Dapur runtime;
- legacy Dapur script injector;
- renderer kedua;
- route section `/dapur/foyer`, `/dapur/menu`, `/dapur/hidangan`, `/dapur/ambalan`.

Catatan PR 23 Agustus 2026: `dapur-ui-tweaks-v1.js` adalah decorator satu-kali berbasis DOM event, tanpa `MutationObserver`, untuk perubahan label/step dan prefill ringan. Jika perubahan ini nantinya dipindahkan ke renderer canonical, file tersebut dapat dihapus.

## 3. DAPUR ACCESS CONTRACT
Publik:
- dapat melihat landing Dapur;
- CTA `Masuk / Daftar` membuka auth canonical;
- tidak mendapatkan workspace tanpa authorization backend.

Member Premium tanpa Creator:
- CTA `Mulai Membuat Dapur`;
- provisioning harus server-authoritative;
- hasil canonical `/dapur/{username}`.

Member Premium dengan Creator:
- CTA `Kelola Dapur Kamu` / `Kelola Dapurku` sesuai surface;
- masuk ke `/dapur/{username}`.

Member non-Premium:
- workspace tetap terkunci;
- tidak boleh bypass dengan URL manual.

Owner Creator:
- hanya dapat mengelola Creator miliknya.

Admin:
- dapat mengelola Creator sesuai authority backend.

## 4. PUBLIC CREATOR
Public Creator URL tetap:
`https://studihome.id/{username}`

Workspace Creator tetap:
`https://studihome.id/dapur/{username}`

Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

## 5. HOMEPAGE VISUAL LOCK
Homepage hero **tidak didesain ulang**.

Perubahan terakhir hanya memulihkan visual contract yang sudah disepakati setelah migrasi Tailwind CDN → compiled CSS menyebabkan visual drift.

Hero lock menggunakan gradient brand Studihome dan tidak mengubah struktur/copy/layout hero.

Commit pemulihan final:
`9a383cb7e91d389bf51ac76c3717a48f8b52e102`

Production deployment:
`dpl_HRw5bSKV1UM4znuG29Nt3YaAnzbv`

Status:
`READY`

## 6. PRODUCTION CSS / ACCESSIBILITY
Tailwind CDN sudah tidak digunakan pada `index.html`.

Current production source menggunakan:
`/tailwind-compiled.css?v=20260817r2`

Compiled CSS dibuat tanpa Preflight agar tidak mereset desain existing.

Auth form accessibility:
- `#login-email` → `autocomplete="username"`
- `#login-password` → `autocomplete="current-password"`
- `#reg-name` → `autocomplete="name"`
- `#reg-email` → `autocomplete="email"`
- `#reg-phone` → `autocomplete="tel"`
- `#reg-password` → `autocomplete="new-password"`

Tidak ada perubahan pada visual auth modal.

## 7. BACKEND SECURITY STATE
Public-read Creator data dipisahkan dari authorization-only functions.

Anonymous role tidak digunakan untuk authorization function sensitif seperti:
- `is_admin()`
- `has_creator_workspace_access()`
- `has_premium_creator_access()`
- `is_creator_eligible()`
- `can_publish_creator()`

`validate_creator_username(text)` memakai hardened `search_path`.

Public Creator tables hanya memberi read data yang memang public; anonymous write tidak diberikan.

Payment/order logic tidak diubah dalam Dapur refactor ini.

## 8. LEGACY CLEANUP
Runtime Dapur legacy yang sudah terbukti superseded telah dihapus setelah reference/runtime audit.

Yang tetap ditahan karena masih memiliki consumer:
- `dapur-admin-user-route-v1.js`
- `dapur-button.js`
- `admin-dapur-creator-v5.js`
- `admin-dapur-ui-v2.js`

Jangan menghapus compatibility/admin surface tanpa reference proof.

## 9. ROUTING CONTRACT
`vercel.json` wajib tetap memakai rewrite canonical sederhana:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan memakai inline regex parameter di `rewrites.source`; konfigurasi tersebut sebelumnya menyebabkan `Invalid vercel.json file provided`.

## 10. DAPUR PRODUCTION HARDENING — 23 AGUSTUS 2026
Root cause yang diperbaiki:
- wrapper lama diawali fragmen sintaks invalid `(=>){`, sehingga parser berhenti sebelum runtime Dapur berjalan;
- regex normalisasi path juga malformed pada versi rusak;
- update/delete perlu mempertahankan chaining PostgREST seperti `.eq()`/`.match()`;
- operasi mutation non-admin perlu diberi owner constraint, sedangkan admin tidak boleh diblokir oleh constraint frontend yang tidak sesuai authority backend.

Perubahan:
- `dapur-production-hardening-v2.js` memakai IIFE valid;
- `patchClient()` menjaga thenable mutation wrapper;
- owner constraint tetap diterapkan untuk non-admin;
- admin detection memakai RPC `is_admin` dan hasilnya dicache selama sesi wrapper;
- `insert`/`upsert` tetap memetakan `user_id`/`creator_id` dari owner;
- `dapur.html` menaikkan cache-bust production hardening ke `v=20260823prod1`.

Catatan security: wrapper frontend bukan authorization boundary. RLS/backend authority tetap menjadi sumber kebenaran.

## 11. UI TWEAKS — 23 AGUSTUS 2026
`dapur-ui-tweaks-v1.js` menambahkan perubahan non-intrusif:
- label `Edit Profil` → `Edit Foyer`;
- workspace hanya menampilkan tiga step: Menu, Hidangan, Ambalan;
- layout tiga step tetap satu kolom pada viewport mobile;
- saat modal Foyer dibuka, WhatsApp/location dicoba diprefill dari `creator_profiles` milik owner melalui `DapurProductionHardening.owner()`.

Tidak ada perubahan pada business CRUD flow. Prefill hanya mengisi field yang masih kosong dan gagal secara soft jika data/field tidak tersedia.

## 12. GOOGLE PHOTOS MIGRATION NOTE
Jangan menganggap URL `photos.fife.usercontent.google.com` aman untuk production hanya karena source code berhasil memuatnya.

Target migration:
1. pindahkan media Creator ke Supabase Storage bucket yang sesuai;
2. validasi ownership/path dan tipe/ukuran file sesuai Storage policy;
3. gunakan public URL atau signed URL sesuai visibility media;
4. update referensi pada tabel canonical, termasuk `creator_portfolios`/`creator_profiles` bila schema aktual menggunakannya;
5. verifikasi tidak ada reference Google Photos yang tersisa sebelum production cutover.

Status migration pada PR ini: **PENDING**. PR tidak mengarang URL Storage dan tidak mengubah data production tanpa migration yang dapat diverifikasi.

## 13. TEST / RELEASE GATE
Minimal sebelum merge/deploy:
- `node --check dapur-production-hardening-v2.js`
- `node --check dapur-ui-tweaks-v1.js`
- `git diff --check`
- review changed-file list dan secret scan;
- authenticated Dapur smoke test;
- owner vs admin mutation test;
- mobile 375px/768px;
- console/network check;
- Google Photos migration verification jika migration dikerjakan.

CI PASS tidak sama dengan Browser PASS.
Browser PASS tidak sama dengan Production PASS.

## 14. CURRENT PRODUCTION VERIFICATION
Verified production deployment sebelumnya:
- Deployment: `dpl_HRw5bSKV1UM4znuG29Nt3YaAnzbv`
- Commit: `9a383cb7e91d389bf51ac76c3717a48f8b52e102`
- State: `READY`

Deployment tersebut **bukan bukti** bahwa PR 23 Agustus 2026 sudah production verified. Setelah merge, deployment SHA wajib dicocokkan dengan commit PR yang merged.

## 15. RELEASE VERIFICATION LIMITATION
HTTP/deployment/runtime checks sebelumnya sudah terverifikasi.

Authenticated browser E2E penuh tetap harus diperlakukan sebagai manual smoke test final ketika akun uji tersedia:
1. Premium tanpa Creator → `Mulai Membuat Dapur` → `/dapur/{username}`.
2. Premium dengan Creator → `Kelola Dapur Kamu` → `/dapur/{username}`.
3. Non-Premium → workspace ditolak.
4. Creator owner dapat edit; Creator milik akun lain ditolak.
5. Username valid dapat disimpan; username duplicate ditolak.
6. Logout → workspace ditolak.
7. Public `/dapur` → auth popup → login/register.
8. Mobile 375px dan 768px → tidak overflow.

Jangan menganggap source inspection menggantikan authenticated browser E2E.

## 16. DO NOT REGRESS
Jangan:
- mengubah `/dapur` menjadi admin dashboard;
- mengubah public Creator URL `/{username}` menjadi `/dapur/{username}`;
- membuat route section Dapur;
- menambah global `MutationObserver`;
- memasukkan service-role key ke frontend;
- mengubah payment/order logic tanpa audit khusus;
- menyatakan release verified tanpa cocokkan commit SHA dan deployment SHA.

## 17. NEXT CHAT PROTOCOL
Jika percakapan terputus, baca file berikut terlebih dahulu:
1. `MASTER_HANDOFF_PROMPT_STUDIHOME.md`
2. `PROJECT_CONSTITUTION.md`
3. `RELEASE_HANDOFF_2026-08-17.md`

Kemudian:
1. audit `main` HEAD;
2. cocokkan Production deployment SHA;
3. baca `index.html`, `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `vercel.json`;
4. cari references sebelum menghapus file;
5. jangan reset proyek;
6. perubahan kecil, canonical, dan reversible;
7. deploy;
8. verify production;
9. baru laporkan status.

## 18. RELEASE STATUS
Source baseline: **READY**
Production deployment baseline: **READY**
PR 23 Agustus 2026: **PENDING CI + BROWSER + PRODUCTION VERIFICATION**
Google Photos migration: **PENDING**

Status release engineering: **NOT PRODUCTION VERIFIED**
