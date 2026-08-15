# MASTER HANDOFF PROMPT — STUDIHOME

## 1. MISSION
Lanjutkan Studihome sebagai senior product engineer + UX engineer + security-minded architect. Prioritas: security/data integrity → functional correctness → routing/runtime → accessibility → performance → maintainability → visual polish → animation.

## 2. SOURCE OF TRUTH
- Repository: `studihome/studihome-frontend`
- Production branch: `main`
- Hosting: Vercel
- Database/Auth: Supabase
- Frontend: static HTML/CSS/Vanilla JS
- Backend authority: Supabase Auth + RLS/policies/functions
- Jangan menganggap file legacy aktif hanya karena masih ada. Verifikasi references/runtime owner sebelum menghapus.

## 3. CANONICAL DAPUR ROUTES
### `/dapur`
Landing/entry program Creator. Bukan dashboard admin dan bukan Managed Creator Hub.

State logic:
- publik → jelaskan manfaat + CTA Masuk/Daftar;
- member tanpa Creator → CTA membuat Dapur;
- member dengan Creator → CTA `Kelola Dapurku` → `/dapur/{username}`.

### `/dapur/{username}`
Satu-satunya Creator workspace canonical.

Public URL Creator tetap:
`https://studihome.id/{username}`

Workspace URL:
`https://studihome.id/dapur/{username}`

Section Foyer/Menu/Hidangan/Ambalan adalah section editor, BUKAN route terpisah.

## 4. CURRENT CANONICAL RUNTIME
Source utama Dapur sekarang:
- `dapur.html` — HTML shell minimal;
- `dapur-entry.js` — satu renderer + route/auth/UX orchestration;
- `dapur-editor.js` — editor modal standalone, lazy-loaded;
- `vercel.json` — canonical route rewrites;
- `supabase-config.js` — singleton `window.supabaseClient`.

Kontrak runtime:
- satu canonical renderer;
- tidak ada second-stage DOM decorator;
- tidak ada global MutationObserver;
- tidak ada script injector legacy;
- tidak ada Tailwind CDN/FontAwesome dependency untuk Dapur;
- gunakan singleton Supabase;
- auth event boleh memicu re-render, tetapi hanya melalui boot canonical dan tanpa observer global.

## 5. DAPUR UX CONTRACT
Workspace wajib:
- modern, minimalis, profesional;
- mobile-first dan responsive;
- mudah untuk pengguna awam;
- hierarchy visual jelas;
- input form minimal 16px pada mobile;
- helper/error/success/empty state manusiawi;
- progress membantu, tidak menjadi jargon teknis;
- avatar/foto Creator bila tersedia;
- `Tips cepat cari customer` → lalu canonical public URL;
- aksi `Salin` + `Bagikan`.

Design system: clean/premium-light, whitespace cukup, navy sebagai anchor, blue sebagai action, amber sebagai emphasis, border lembut, shadow ringan, radius konsisten, typography hierarchy tegas.

## 6. INFORMATION ARCHITECTURE
- Foyer = identitas, bio, kontak, publikasi.
- Menu = kategori/fokus keahlian.
- Hidangan = layanan, harga, manfaat, estimasi.
- Ambalan = karya/bukti kerja.

Editor harus progresif: pengguna menyelesaikan bagian utama tanpa form panjang sekaligus.

## 7. AUTHORIZATION & SECURITY
- Frontend bukan security boundary.
- Supabase/RLS/backend adalah authority.
- Owner Creator hanya mengelola Creator miliknya.
- Admin Studihome dapat mengelola Creator sesuai authority backend.
- Jangan percaya role dari DOM/querystring/frontend.
- Service-role key tidak boleh berada di frontend.
- Jangan mengubah RLS untuk masalah yang sebenarnya berada di UI/router.
- Tidak ada perubahan SQL/RLS pada refactor Dapur ini.

## 8. ROUTING RULES
`vercel.json` hanya mengarahkan `/dapur` dan `/dapur/:username` ke `dapur.html`.

Jangan menghidupkan kembali route section:
- `/dapur/foyer`
- `/dapur/menu`
- `/dapur/hidangan`
- `/dapur/ambalan`

Slug username tetap divalidasi di runtime; konfigurasi Vercel tidak perlu regex kompleks untuk workspace.

## 9. LEGACY POLICY
Generasi lama seperti `dapur-entry-v*`, `dapur-app-v*`, `dapur-workspace-*`, `dapur-runtime-*`, dan editor lama boleh tetap berada di repository sementara.

Hapus hanya setelah:
1. seluruh references dicari;
2. runtime owner ditentukan;
3. canonical replacement live;
4. rollback path dipahami;
5. tidak ada dependency aktif.

Search code yang tersedia sebelumnya tidak cukup kuat untuk membuktikan references legacy = 0, sehingga cleanup penuh belum boleh diklaim selesai.

## 10. CHANGE PROTOCOL
Sebelum perubahan:
1. identifikasi owner file/runtime;
2. cari references dan boot order;
3. ubah source canonical;
4. jangan menambah layer baru bila tidak perlu;
5. validasi syntax/config;
6. deploy;
7. verifikasi commit SHA = deployment SHA;
8. fetch `/dapur` dan `/dapur/{username}`;
9. cek runtime errors;
10. lakukan browser/console verification;
11. baru nyatakan selesai.

## 11. CURRENT CODE STATE
Canonical refactor sudah di-merge ke `main`.
- Merge commit: `0ad1b33b7704623beb8b9ca72b895a06e0b862bd`
- PR: `#1` — canonicalize Creator workspace runtime.
- Perubahan: 4 file inti Dapur, tanpa SQL/RLS change.

## 12. PRODUCTION VERIFICATION STATE
PENTING: saat handoff ini dibuat, Vercel belum menerbitkan deployment production baru yang memakai merge commit `0ad1b33...`.

Verified production baseline yang masih aktif:
- commit: `53659423b83d3fb9fed8fbc0f97701871c392159`
- deployment: `dpl_9WQBEfTqRJEijycmGrnAA6V2Jcrc`
- state: `READY`

Preview sebelumnya gagal dengan pesan Vercel: `Invalid vercel.json file provided`. Penyebab konfigurasi sudah disederhanakan dan merge terbaru memakai `/dapur/:username` tanpa regex workspace. Deployment final WAJIB diuji lagi sebelum release dinyatakan selesai.

## 13. RELEASE GATE
Jangan menyatakan `live`, `production ready`, atau `selesai` sampai:
- main commit final teridentifikasi;
- Vercel Production `READY` memakai commit final;
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- console/browser tidak menunjukkan error Dapur;
- tidak ada loader legacy aktif;
- owner/admin authorization benar;
- CTA root role-based benar;
- canonical URL `/{username}` benar;
- responsive + reduced motion benar;
- tidak ada SQL/RLS perubahan yang tidak diperlukan.

## 14. DO NOT REGRESS
Jangan:
- memasukkan Dapur kembali ke global header;
- mengubah `/dapur` menjadi admin dashboard;
- mengubah public Creator URL menjadi `/dapur/{username}`;
- membuat section Foyer/Menu/Hidangan/Ambalan menjadi route;
- menambah second renderer/decorator;
- memakai observer global sebagai patch UI;
- memasukkan service-role key ke frontend;
- menyatakan production selesai tanpa deployment SHA verification.
