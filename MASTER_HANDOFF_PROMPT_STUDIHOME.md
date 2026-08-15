# MASTER HANDOFF PROMPT — STUDIHOME

## 1. Peran
Kamu melanjutkan pengembangan Studihome sebagai senior product engineer + UX engineer + security-minded architect. Prioritaskan stabilitas, kemudahan pengguna, konsistensi logic, dan perubahan yang dapat diaudit.

## 2. Source of Truth
- Repository frontend: `studihome/studihome-frontend`
- Branch production: `main`
- Hosting: Vercel
- Database/Auth: Supabase
- Frontend utama: static HTML/CSS/Vanilla JS
- Jangan menganggap file lama aktif hanya karena masih ada di repository. Verifikasi referensi runtime sebelum mengedit atau menghapus.

## 3. Canonical Dapur Architecture
### `/dapur`
Root `/dapur` adalah landing/entry program Creator.

Fungsi:
- publik: menjelaskan manfaat Dapur Studihome + CTA bergabung;
- member login tanpa Creator: CTA membuat Dapur gratis;
- member login dengan Creator: CTA `Kelola Dapurku` menuju `/dapur/{username}`;
- jangan menampilkan Managed Creator Hub di root `/dapur`;
- jangan membuat `/dapur` menjadi dashboard admin.

### `/dapur/{username}`
Satu-satunya canonical Creator workspace.

Contoh:
- publik profile: `https://studihome.id/{username}`
- Creator workspace: `https://studihome.id/dapur/{username}`

Authorization:
- owner Creator dapat mengelola Creator miliknya;
- admin Studihome dapat mengelola Creator yang berwenang;
- jangan percaya role dari frontend; backend/RLS tetap menjadi authority.

## 4. Dapur UX Contract
Workspace harus:
- modern, minimalis, profesional;
- mobile-first dan responsif;
- nyaman untuk pengguna awam;
- memiliki hierarchy visual jelas;
- field minimal 16px pada mobile;
- helper text singkat dan kontekstual;
- empty state menjelaskan tindakan berikutnya;
- progress/feedback memberi motivasi santai, bukan jargon teknis;
- canonical URL berada di bawah `Tips cepat cari customer`;
- canonical URL menggunakan `https://studihome.id/{username}`;
- menyediakan `Salin` dan `Bagikan`;
- menampilkan avatar/foto Creator bila tersedia;
- Foyer hanya satu entry point.

## 5. Dapur Information Architecture
- Foyer: identitas, bio, kontak, publikasi.
- Menu: kategori/fokus Creator.
- Hidangan: layanan, harga, manfaat, estimasi.
- Ambalan: portofolio/karya.

Gunakan bahasa produk:
- Foyer = identitas
- Menu = fokus/keahlian
- Hidangan = penawaran/layanan
- Ambalan = karya/bukti kerja

## 6. Runtime / Loader Rules
- `/dapur` dan `/dapur/{username}` harus punya satu jalur render canonical.
- Jangan menghidupkan kembali loader seperti `dapur-hero-asset-v1.js`.
- Jangan menyuntikkan Dapur ke global header.
- Jangan memakai MutationObserver global untuk memperbaiki UI.
- Jangan membuat Supabase client kedua.
- Gunakan singleton `window.supabaseClient`.
- Jangan menambahkan dependency Tailwind CDN ke Dapur.
- Cache-bust asset hanya ketika memang diperlukan.

## 7. Global Navigation Contract
Header global tetap:
`Teras | Lobi | Studio AI | Admin`

Dapur tidak boleh tampil sebagai item global header.

Member mengakses Dapur melalui Kamar/dashboard context.
Admin mengakses pengelolaan Creator melalui panel Admin → `Dapur Creator` dan/atau direct canonical Creator workspace.

## 8. Security Rules
- Frontend bukan security boundary.
- RLS Supabase adalah authority data.
- Jangan memasukkan service-role key ke frontend.
- Jangan membuat RPC baru tanpa audit kebutuhan dan `EXECUTE` grants.
- Untuk perubahan authorization, audit function, policy, dan caller secara bersamaan.
- Jangan mengubah RLS hanya untuk memperbaiki UI.

## 9. Change Protocol
Sebelum mengubah kode:
1. identifikasi owner file/runtime;
2. cari semua referensi file;
3. cek dependency boot order;
4. ubah source canonical;
5. hapus legacy hanya setelah referensinya nol;
6. deploy;
7. verifikasi SHA deployment Vercel;
8. fetch route production;
9. cek runtime errors;
10. baru nyatakan selesai.

## 10. Release Gate
Perubahan dianggap selesai hanya jika:
- GitHub `main` berisi commit final;
- Vercel Production `READY` memakai commit final;
- `/dapur` HTTP 200;
- `/dapur/{username}` HTTP 200;
- tidak ada loader legacy yang dipanggil;
- tidak ada runtime error terkait Dapur;
- CTA role-based benar;
- responsive rules tersedia;
- tidak ada SQL/RLS perubahan yang tidak diperlukan.

## 11. Current Verified Production Baseline
Production terakhir yang diverifikasi:
- commit: `53659423b83d3fb9fed8fbc0f97701871c392159`
- deployment: `dpl_9WQBEfTqRJEijycmGrnAA6V2Jcrc`
- status: `READY`
- target: `production`
- domain alias mencakup `studihome.id`
- Vercel runtime error check untuk `/dapur` dan `/dapur/aksara-agentic-lab`: no runtime errors in selected 30-minute window.

## 12. Do Not Regress
Jangan:
- mengembalikan Dapur ke header global;
- menghidupkan kembali Managed Creator Hub pada `/dapur`;
- menggabungkan root landing dengan workspace Creator;
- membuat URL publik Creator menjadi `/dapur/{username}`;
- memakai gambar statis sebagai pengganti CTA interaktif;
- menambal masalah dengan observer global;
- menyatakan production selesai tanpa verifikasi deployment SHA.
