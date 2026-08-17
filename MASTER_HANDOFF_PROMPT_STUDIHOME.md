# MASTER HANDOFF — STUDIHOME

Tanggal pembaruan: 17 Agustus 2026

## 1. TUJUAN
Lanjutkan Studihome sebagai senior product engineer, UX engineer, security-minded architect, dan release engineer. Prinsip utama: perbaikan deterministik, blast radius kecil, tidak redesign, tidak menambah layer tanpa alasan, dan selalu verifikasi source → build → deployment.

## 2. SOURCE OF TRUTH
- Repository: `studihome/studihome-frontend`
- Branch produksi: `main`
- Hosting: Vercel
- Frontend: static HTML/CSS/Vanilla JS
- Backend/Auth: Supabase
- Security authority: Supabase Auth + RLS/policies/functions
- Jangan menganggap file legacy aktif hanya karena masih tersimpan; cari reference/runtime owner terlebih dahulu.

## 3. VISUAL CONTRACT — HOMEPAGE
Hero homepage adalah **LOCKED VISUAL CONTRACT**.

Aturan absolut:
- Jangan redesign.
- Jangan mengganti layout, komposisi, typography, spacing, warna, ilustrasi, CTA, atau hierarchy hero tanpa persetujuan eksplisit.
- Jangan membuat versi hero baru hanya karena ada masalah teknis.
- Baseline visual sebelum regression: commit `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.
- Baseline tersebut menggunakan Tailwind CDN. Production sekarang memakai static CSS, tetapi hasil render harus mempertahankan tampilan baseline.
- Public homepage menggunakan sumber/kontrak visual yang sama. Jangan membuat desain publik yang berbeda hanya untuk menutupi regression.

## 4. ROOT + PUBLIC
- `/` = homepage publik Studihome.
- Public Creator URL tetap `/{username}`.
- `/portfolio/...` tetap mengikuti rewrite canonical yang sudah ada.
- Jika homepage berubah visual, perbaiki source canonical sekali; jangan patch route per halaman.

## 5. DAPUR CONTRACT
### `/dapur`
Landing/entry Creator, bukan admin dashboard.

State:
- publik → manfaat + CTA Masuk/Daftar;
- member tanpa Creator → CTA membuat Dapur;
- member dengan Creator → `Kelola Dapurku` → `/dapur/{username}`.

### `/dapur/{username}`
Satu canonical Creator workspace.

Public Creator URL tetap `https://studihome.id/{username}`.
Workspace URL `https://studihome.id/dapur/{username}`.
Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

## 6. CANONICAL DAPUR RUNTIME
Source utama:
- `dapur.html`
- `dapur-entry.js`
- `dapur-editor.js`
- `vercel.json`
- `supabase-config.js`

Kontrak:
- satu canonical renderer;
- tidak ada second-stage DOM decorator;
- tidak ada global MutationObserver;
- tidak ada legacy script injector;
- singleton Supabase;
- auth event hanya melalui bootstrap canonical.

## 7. AUTH UX / AUTOCOMPLETE CONTRACT
Gunakan semantic autocomplete yang benar, tanpa mengubah UI:
- login email → `autocomplete="username"`
- login password → `autocomplete="current-password"`
- register email → `autocomplete="email"`
- register password → `autocomplete="new-password"`
- confirm/second register password, bila ada → `autocomplete="new-password"`

Jangan menggunakan `current-password` untuk password registrasi.

## 8. TAILWIND PRODUCTION CONTRACT
- `cdn.tailwindcss.com` tidak boleh digunakan di production.
- `index.html` memakai static `/tailwind-compiled.css`.
- Static CSS sekarang dibangun dengan Tailwind CLI `3.4.17`.
- Build mempertahankan Preflight/base layer dan utility classes yang dipindai dari HTML + JS.
- Jangan menghapus Preflight hanya demi memperkecil file karena dapat menyebabkan visual regression pada hero dan elemen native.
- Jangan mengubah class UI hanya untuk menyesuaikan hasil build CSS.

## 9. REGRESSION + ROOT CAUSE
Production sebelum fix berada di commit `19a9ff7385cfb312521fd0d1b9a4dd634c333ece`.

Pada saat static Tailwind CSS pertama dipasang, hasil render hero berubah walaupun markup hero tidak sedang didesain ulang. Static stylesheet tersebut tidak mempertahankan base/Preflight yang sebelumnya diberikan Tailwind CDN.

Perbaikan final: regenerate static Tailwind CSS dengan Preflight + utility extraction penuh menggunakan Tailwind CLI 3.4.17. Hero markup/design tidak diubah.

## 10. FINAL FIX YANG SUDAH DILAKUKAN
Commit final visual/auth fix:
`ad6e138b597eca67e7324e747c3d116f283c2255`

Isi:
1. regenerate `tailwind-compiled.css` dengan Tailwind CLI 3.4.17;
2. mempertahankan `@tailwind base`, `components`, `utilities`;
3. scan seluruh HTML/JS agar utility hero tetap tersedia;
4. `#login-email` → `autocomplete="username"`;
5. `#login-password` → `autocomplete="current-password"`;
6. tidak mengubah desain/markup hero.

Workflow one-shot yang dipakai untuk codemod sudah self-delete dan **tidak boleh kembali ke repository**.

## 11. PRODUCTION DEPLOYMENT FINAL APLIKASI
Deployment yang menggunakan fix visual/auth:
- Vercel: `dpl_517inXipdvZGQfxGgtrRy6caxUvF`
- URL: `studihome-frontend-a30ey09fo-studihome.vercel.app`
- state: `READY`
- target: `production`
- commit SHA: `ad6e138b597eca67e7324e747c3d116f283c2255`

Commit dokumentasi setelahnya tidak mengubah aplikasi selain handoff markdown.

## 12. CURRENT HEAD
Commit dokumentasi handoff final:
`1d4104dd51c3e58e8bf27893f94c3ad1f31e6f0c`

Perbedaan antara commit ini dan `ad6e138b...` hanya dokumentasi `MASTER_HANDOFF_PROMPT_STUDIHOME.md`; tidak ada perubahan terhadap UI/runtime aplikasi pada commit finalisasi handoff ini.

## 13. GUARDRAILS
Jangan:
- mengembalikan Tailwind CDN;
- menambah framework UI baru;
- mengubah desain hero;
- membuat hero kedua untuk route publik;
- menambah global observer sebagai patch;
- menaruh service-role key di frontend;
- mengubah RLS/SQL untuk masalah UI;
- menghidupkan kembali route Dapur section;
- menghidupkan kembali runtime legacy tanpa reference proof.

## 14. LEGACY POLICY
Legacy Dapur yang sudah diaudit/dihapus tidak boleh dihidupkan kembali hanya karena error:
- `dapur-app-v1.js` … `dapur-app-v4.js`
- `dapur-entry-v6.js`, `dapur-entry-v7.js`
- `dapur-runtime-v4.js`
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`
- `dapur-cta-v1.js`
- `dapur-design-v2.js`
- `dapur-enhancements-v1.js`

Compatibility/admin surfaces hanya dihapus setelah reference proof kuat.

## 15. CHANGE PROTOCOL
Setiap perubahan wajib:
1. identifikasi owner file;
2. cari reference dan dependency;
3. ubah source canonical;
4. gunakan perubahan sekecil mungkin;
5. validasi syntax/config;
6. pastikan tidak ada regression visual/functional;
7. deploy;
8. verifikasi commit SHA = deployment SHA;
9. fetch halaman utama dan route terdampak;
10. cek runtime/build errors;
11. cek browser console untuk warning/error yang memang menjadi target;
12. baru tandai selesai.

## 16. RELEASE GATE HOMEPAGE
- production deployment `READY`;
- deployment aplikasi final menggunakan `ad6e138b...` sudah terverifikasi `READY`;
- homepage HTTP 200;
- tidak ada `cdn.tailwindcss.com` pada production HTML;
- hero menggunakan canonical markup dan static CSS yang memulihkan parity baseline;
- member login email memiliki `autocomplete="username"`;
- login password memiliki `autocomplete="current-password"`;
- registration password memakai `new-password`;
- public page tetap memakai canonical homepage visual;
- tidak ada error runtime yang baru dari fix ini.

## 17. RELEASE GATE DAPUR
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- canonical public Creator URL benar;
- CTA role-based benar;
- owner/admin authorization tetap authority backend;
- no legacy runtime unexpectedly active;
- no SQL/RLS changes dari visual/auth fix.

## 18. CATATAN TENTANG PESAN “BATAS PANJANG PERCAPAKAN”
Pesan:
`Anda telah mencapai panjang maksimum untuk percakapan ini, tetapi Anda bisa terus berbicara dengan memulai obrolan baru.`

Ini adalah **notifikasi UI ChatGPT**, bukan error aplikasi Studihome, bukan error Vercel, bukan browser console error. Jangan mengubah frontend Studihome untuk menghilangkan pesan tersebut.

## 19. STATUS CONSOLE TERAKHIR
- Public console yang dilaporkan user sudah bersih.
- Warning member `login-email` sudah diperbaiki secara source: `autocomplete="username"`.
- Login password sudah `current-password`.
- Admin tidak memiliki error aplikasi yang relevan dari log terakhir; pesan batas panjang percakapan adalah milik ChatGPT.
- Tailwind CDN warning sudah dihilangkan dan tidak ada lagi reference `cdn.tailwindcss.com` pada `index.html` production.

## 20. NEXT-CHAT STARTER PROMPT
Mulai chat baru dengan:

> Lanjutkan Studihome dari `MASTER_HANDOFF_PROMPT_STUDIHOME.md` di branch `main`. Jangan redesign. Release fix aplikasi terakhir adalah `ad6e138b597eca67e7324e747c3d116f283c2255` dan production deployment terkait adalah `dpl_517inXipdvZGQfxGgtrRy6caxUvF`. Hero wajib parity dengan baseline `7406c1fdb8e614e0e3907f2c082bf94811a4beef`. Production tetap tanpa Tailwind CDN. Autocomplete auth harus semantic. Sebelum mengubah apa pun, verifikasi current HEAD, Vercel deployment SHA, homepage HTTP 200, `/dapur`, `/dapur/{username}`, runtime/build errors, dan browser console.

## 21. SUCCESS CRITERIA FINAL
**fungsi tetap bekerja + desain hero kembali ke kontrak sebelumnya + production tidak memakai Tailwind CDN + auth autocomplete benar + public/admin/member tidak mendapat regression baru + deployment final terverifikasi.**
