# PROJECT CONSTITUTION — STUDIHOME

## Article I — Product Principle
Studihome harus terasa sederhana bagi pengguna dan tetap disiplin secara teknis.

Prinsip utama:
1. `Kemudahan` di atas kompleksitas.
2. `Logic first, UI second`: alur harus benar sebelum kosmetik.
3. `Single source of truth` untuk route, auth, branding, dan data.
4. `YAGNI`: jangan membuat layer baru bila layer yang ada cukup.
5. `No regression`: fitur yang sudah PASS tidak boleh rusak oleh perubahan baru.

## Article II — Canonical Routes
### Public profile
`/{username}`

Tujuan: profil publik Creator yang dapat dibagikan.

### Creator workspace
`/dapur/{username}`

Tujuan: pengelolaan Creator tertentu.

### Dapur root
`/dapur`

Tujuan: landing program Dapur Studihome dan entry point Creator.

Root bukan dashboard Creator dan bukan Managed Creator Hub.

## Article III — Role Boundaries
### Public
Dapat melihat landing Dapur dan profil publik yang memang published.

### Member
Dapat membuat Creator dan mengelola Creator miliknya sendiri.

### Admin
Dapat mengelola Creator sesuai otoritas Studihome.

Semua authorization sensitif harus divalidasi melalui Supabase/RLS/backend authority.

## Article IV — UX Constitution
Setiap halaman baru harus memenuhi:
- mobile-first;
- responsive pada desktop, tablet, mobile;
- target tap nyaman;
- body text mudah dibaca;
- form input minimal 16px pada mobile;
- helper text singkat;
- empty state actionable;
- loading state jelas;
- error state manusiawi;
- success state informatif;
- keyboard accessible;
- `prefers-reduced-motion` dihormati.

Animasi hanya berfungsi sebagai feedback/hierarchy, bukan dekorasi berlebihan.

## Article V — Dapur Design System
Gaya visual:
- clean;
- premium namun ringan;
- whitespace cukup;
- navy Studihome sebagai anchor;
- biru sebagai action accent;
- amber sebagai emphasis;
- border lembut;
- shadow ringan;
- radius konsisten;
- typography hierarchy tegas.

Root `/dapur` menggunakan hero visual yang kuat.
Workspace `/dapur/{username}` menggunakan dashboard/editor minimal yang membantu pengguna menyelesaikan pekerjaan dengan cepat.

## Article VI — Dapur Editor
Urutan pengalaman:
1. Foyer — identitas.
2. Menu — fokus/keahlian.
3. Hidangan — penawaran.
4. Ambalan — karya.

Editor harus memudahkan progres bertahap, bukan menampilkan form panjang sekaligus.

Canonical link:
`https://studihome.id/{username}`

Posisi canonical di workspace: setelah `Tips cepat cari customer`.
Aksi wajib: `Salin` + `Bagikan`.

## Article VII — Frontend Runtime
- Gunakan Vanilla JS/HTML/CSS yang ringan bila tidak ada kebutuhan framework.
- Hindari global DOM observers.
- Hindari script injector legacy.
- Setiap route harus punya single canonical renderer.
- Dependency boot order harus deterministik.
- Supabase hanya melalui singleton.
- Jangan menambahkan Tailwind CDN ke production Dapur.

## Article VIII — Data & Backend
Supabase adalah source of truth untuk auth dan data Creator.

Jangan mengubah database untuk masalah yang sebenarnya berada di UI/router.

Sebelum mengubah RLS:
- audit table;
- policy;
- function/RPC;
- execute grants;
- frontend callers.

Service-role key tidak pernah berada di frontend.

## Article IX — Deployment Discipline
Tidak ada pernyataan `selesai`, `live`, atau `production ready` sebelum:
- commit final teridentifikasi;
- deployment Vercel `READY`;
- deployment SHA sama dengan commit final;
- route production diuji;
- runtime errors diperiksa;
- legacy resource requests diperiksa.

## Article X — Legacy Policy
Kode legacy tidak dihapus karena terlihat lama.
Kode legacy dihapus setelah:
- semua references dicari;
- runtime owner ditentukan;
- replacement canonical sudah live;
- rollback path dipahami.

Setelah aman, hapus legacy agar tidak ada dua sumber kebenaran.

## Article XI — Change Priority
Urutan prioritas:
1. Security & data integrity.
2. Functional correctness.
3. Routing & runtime stability.
4. Accessibility.
5. Performance.
6. Maintainability.
7. Visual polish.
8. Animation.

Visual yang indah tetapi logic salah dianggap gagal.

## Article XII — Communication Rule
Setiap laporan perubahan harus menyebut:
- apa yang berubah;
- kenapa berubah;
- file/runtime utama;
- status backend bila relevan;
- commit SHA;
- deployment SHA;
- hasil verifikasi production;
- keterbatasan verifikasi bila ada.

Jangan mengklaim telah memverifikasi sesuatu yang belum benar-benar diverifikasi.

## Article XIII — Freeze Rules
Jangan mengubah hal berikut tanpa alasan eksplisit:
- global header structure;
- canonical Creator URL;
- meaning of `/dapur`;
- meaning of `/dapur/{username}`;
- role boundaries;
- existing RLS/security contracts;
- payment/order logic yang sudah PASS.

## Article XIV — Definition of Done
Sebuah fitur dianggap selesai bila pengguna awam dapat menyelesaikan tugas utama tanpa bantuan developer, data tersimpan benar, authorization benar, tampilan responsif, dan production sudah diverifikasi.
