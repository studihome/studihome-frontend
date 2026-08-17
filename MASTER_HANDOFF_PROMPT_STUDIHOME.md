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
- Pada baseline tersebut Tailwind masih dimuat melalui CDN; target produksi sekarang tetap harus **tanpa CDN**, tetapi hasil render harus mempertahankan tampilan baseline.
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
- Static CSS harus diregenerasi dari source menggunakan Tailwind CLI, bukan hand-written pseudo-build.
- Untuk menjaga parity dengan tampilan lama, build Tailwind harus mempertahankan Preflight/base layer dan utility classes yang terdeteksi dari seluruh HTML/JS.
- Jangan menghapus Preflight hanya demi memperkecil file karena dapat menyebabkan visual regression pada hero dan elemen native.
- Jangan mengubah class UI hanya untuk menyesuaikan hasil build CSS.

## 9. REGRESSION YANG TERJADI
Recent production commit sebelum fix:
`19a9ff7385cfb312521fd0d1b9a4dd634c333ece`

Deployment:
`dpl_Bnfo4zFye4XkPoHtkDKRTzw8xszU`

Commit tersebut sudah menghilangkan Tailwind CDN warning dan memperbaiki sebagian auth autocomplete, tetapi setelah static CSS dipakai, hero homepage mengalami perubahan visual yang tidak disetujui.

Perbandingan dengan baseline menunjukkan `index.html` hanya berubah pada layer loading Tailwind/auth, bukan karena redesign hero. Fokus perbaikan adalah mengembalikan parity rendering, bukan mengubah markup hero.

## 10. CURRENT ONE-SHOT FIX
Workflow sementara telah dibuat untuk:
1. generate ulang `tailwind-compiled.css` menggunakan Tailwind CLI 3.4.17;
2. menggunakan `@tailwind base`, `components`, `utilities` agar Preflight tetap tersedia;
3. scanning seluruh HTML dan JS agar utility class hero tidak hilang;
4. menambahkan autocomplete semantic pada field auth;
5. menolak build bila CDN Tailwind masih ada;
6. commit hasil;
7. menghapus workflow itu sendiri setelah selesai.

Workflow file:
`.github/workflows/one-shot-visual-regression-fix.yml`

Workflow harus **tidak tersisa** setelah fix selesai.

## 11. GUARDRAILS
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

## 12. LEGACY POLICY
Legacy Dapur yang sudah diaudit/dihapus tidak boleh dihidupkan kembali hanya karena error:
- `dapur-app-v1.js` … `dapur-app-v4.js`
- `dapur-entry-v6.js`, `dapur-entry-v7.js`
- `dapur-runtime-v4.js`
- `dapur-workspace-v2.js`, `dapur-workspace-v3.js`
- `dapur-cta-v1.js`
- `dapur-design-v2.js`
- `dapur-enhancements-v1.js`

Compatibility/admin surfaces hanya dihapus setelah reference proof kuat.

## 13. CHANGE PROTOCOL
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

## 14. RELEASE GATE HOMEPAGE
Sebelum menyatakan selesai:
- production deployment `READY`;
- deployment SHA sama dengan commit final;
- homepage HTTP 200;
- tidak ada `cdn.tailwindcss.com` pada production HTML;
- hero tidak berubah dari locked visual baseline;
- member login email tidak lagi memunculkan warning username;
- login password memakai `current-password`;
- registration password memakai `new-password`;
- public page tetap sama secara visual dengan canonical homepage;
- tidak ada error runtime yang baru.

## 15. RELEASE GATE DAPUR
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- canonical public Creator URL benar;
- CTA role-based benar;
- owner/admin authorization tetap authority backend;
- no legacy runtime unexpectedly active;
- no SQL/RLS changes dari visual/auth fix.

## 16. CATATAN TENTANG PESAN “BATAS PANJANG PERCAPAKAN”
Pesan:
`Anda telah mencapai panjang maksimum untuk percakapan ini, tetapi Anda bisa terus berbicara dengan memulai obrolan baru.`

Ini adalah **notifikasi UI ChatGPT**, bukan error aplikasi Studihome, bukan error Vercel, bukan browser console error. Jangan mengubah frontend Studihome untuk menghilangkan pesan tersebut.

## 17. CURRENT STATUS SEBELUM FINAL FIX
- Production masih menggunakan commit `19a9ff7385cfb312521fd0d1b9a4dd634c333ece` sebagai titik awal perbaikan.
- Baseline hero yang dijaga: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.
- Public console yang dilaporkan user sudah bersih.
- Warning member yang tersisa: `autocomplete="username"` pada `#login-email`.
- Admin tidak memiliki error browser yang relevan dari log terakhir selain pesan batas panjang percakapan ChatGPT.

## 18. NEXT-CHAT STARTER PROMPT
Mulai chat baru dengan:

> Lanjutkan Studihome dari `MASTER_HANDOFF_PROMPT_STUDIHOME.md` di branch `main`. Jangan redesign. Fokus hanya pada release verification dari fix terakhir: hero homepage harus parity dengan baseline `7406c1fdb8e614e0e3907f2c082bf94811a4beef`, production tetap tanpa Tailwind CDN, auth autocomplete harus semantic, dan public/homepage harus memakai canonical visual yang sama. Verifikasi commit SHA vs Vercel deployment SHA, HTTP 200, build/runtime error, lalu lakukan audit browser console sebelum mengubah apa pun.

## 19. SUCCESS CRITERIA FINAL
Satu-satunya definisi “selesai” adalah:
**fungsi tetap bekerja + desain hero kembali ke kontrak sebelumnya + production tidak memakai Tailwind CDN + auth autocomplete benar + public/admin/member tidak mendapat regression baru + deployment final terverifikasi.**
