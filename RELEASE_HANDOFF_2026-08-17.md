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
- second-stage DOM decorator;
- legacy Dapur script injector;
- renderer kedua;
- route section `/dapur/foyer`, `/dapur/menu`, `/dapur/hidangan`, `/dapur/ambalan`.

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

## 10. CURRENT PRODUCTION VERIFICATION
Verified production deployment:
- Deployment: `dpl_HRw5bSKV1UM4znuG29Nt3YaAnzbv`
- Commit: `9a383cb7e91d389bf51ac76c3717a48f8b52e102`
- State: `READY`

Latest runtime log check for this deployment:
- window: 1 hour
- error/warning logs: **none found**

Source verification pada commit final:
- compiled Tailwind CSS reference present;
- Tailwind CDN absent;
- `login-email` has `autocomplete="username"`;
- password autocomplete attributes present;
- homepage hero visual lock present;
- no change to auth modal visual structure.

## 11. RELEASE VERIFICATION LIMITATION
HTTP/deployment/runtime checks sudah terverifikasi.

Browser console evidence dari user menunjukkan:
- public console sudah bersih;
- member/admin warning sebelumnya berasal dari autocomplete dan sudah dikoreksi di source final.

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

## 12. DO NOT REGRESS
Jangan:
- mengubah `/dapur` menjadi admin dashboard;
- mengubah public Creator URL `/{username}` menjadi `/dapur/{username}`;
- membuat route section Dapur;
- menambah renderer/decorator/observer baru;
- memasukkan service-role key ke frontend;
- mengubah payment/order logic tanpa audit khusus;
- menyatakan release verified tanpa cocokkan commit SHA dan deployment SHA.

## 13. NEXT CHAT PROTOCOL
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

## 14. RELEASE STATUS
Source final: **READY**
Production deployment final: **READY**
Runtime errors/warnings pada deployment final: **NONE FOUND**
UI/UX contract: **PRESERVED**
Homepage hero contract: **RESTORED/LOCKED**
Tailwind CDN warning: **REMOVED**
Auth autocomplete warning: **REMOVED IN SOURCE**

Status release engineering: **READY FOR FINAL MANUAL AUTHENTICATED SMOKE TEST**

Jangan meng-upgrade status menjadi `FULLY VERIFIED` sebelum manual authenticated smoke test di atas selesai.
