# PROJECT CONSTITUTION — STUDIHOME

## Article I — Product Principle
Studihome harus sederhana bagi pengguna dan disiplin secara teknis.

Prioritas:
1. Security & data integrity
2. Functional correctness
3. Routing & runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual polish
8. Animation

`Logic first, UI second.` Visual yang indah tetapi logic salah dianggap gagal.

## Article II — Single Source of Truth
Satu source of truth untuk route, authentication/authorization, branding/UI contract, data, dan runtime renderer.

YAGNI berlaku: jangan membuat layer, loader, observer, atau abstraction baru bila source canonical sudah cukup.

## Article III — Canonical Routes
### Public Creator profile
`/{username}`

Fungsi: profil publik Creator yang dapat dibagikan.

### Creator workspace
`/dapur/{username}`

Fungsi: workspace pengelolaan Creator tertentu.

### Dapur root
`/dapur`

Fungsi: landing/entry program Dapur Studihome.

Root bukan dashboard admin dan bukan Managed Creator Hub.

Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

## Article IV — Role Boundaries
### Public
Dapat melihat landing Dapur dan profil publik yang published.

### Member
Dapat membuat dan mengelola Creator miliknya sendiri sesuai authority backend.

### Admin
Dapat mengelola Creator sesuai otoritas Studihome.

Authorization sensitif wajib diputuskan Supabase/RLS/backend. Frontend hanya presentation/control surface.

## Article V — Dapur Runtime Constitution
Canonical runtime:
- `dapur.html` = shell;
- `dapur-entry.js` = satu renderer canonical;
- `dapur-editor.js` = editor standalone lazy-loaded;
- `vercel.json` = route contract;
- `supabase-config.js` = Supabase singleton.

Wajib:
- satu canonical render path;
- deterministic boot order;
- singleton `window.supabaseClient`;
- no global MutationObserver;
- no post-render workspace decorator;
- no legacy script injector untuk Dapur;
- no Tailwind CDN/FontAwesome dependency untuk shell/editor canonical.

Dilarang menyelesaikan bug renderer dengan membuat renderer kedua.

## Article VI — UX Constitution
Setiap halaman Dapur wajib:
- mobile-first;
- responsive desktop/tablet/mobile;
- tap target nyaman;
- body text mudah dibaca;
- input form minimal 16px di mobile;
- helper text singkat;
- actionable empty state;
- loading state jelas;
- error state manusiawi;
- success state informatif;
- keyboard accessible;
- menghormati `prefers-reduced-motion`.

Animasi hanya digunakan untuk feedback/hierarchy.

## Article VII — Dapur Design System
Gaya:
- clean;
- premium namun ringan;
- whitespace cukup;
- navy Studihome sebagai anchor;
- biru untuk action;
- amber untuk emphasis;
- border lembut;
- shadow ringan;
- radius konsisten;
- typography hierarchy tegas.

`/dapur` menggunakan hero visual kuat dan CTA jelas.
`/dapur/{username}` menggunakan dashboard/editor minimal yang mempercepat pekerjaan.

## Article VIII — Dapur Information Architecture
1. Foyer — identitas, bio, kontak, publikasi.
2. Menu — kategori/fokus keahlian.
3. Hidangan — layanan, harga, manfaat, estimasi.
4. Ambalan — portofolio/bukti kerja.

Editor bersifat progresif; jangan menampilkan form panjang sekaligus tanpa kebutuhan.

Canonical public link:
`https://studihome.id/{username}`

Posisi link: setelah `Tips cepat cari customer`.
Aksi wajib: `Salin` + `Bagikan`.

## Article IX — Data & Backend
Supabase adalah source of truth auth + data Creator.

Jangan mengubah database untuk masalah UI/router.

Sebelum perubahan RLS:
- audit table;
- policy;
- function/RPC;
- execute grants;
- frontend callers.

Service-role key tidak pernah berada di frontend.

Refactor canonical Dapur terakhir tidak mengubah SQL/RLS.

## Article X — Routing Contract
`vercel.json` menjaga route Dapur canonical:
- `/dapur` → `dapur.html`
- `/dapur/:username` → `dapur.html`

Username divalidasi lagi di runtime.

Jangan membuat route section:
- `/dapur/foyer`
- `/dapur/menu`
- `/dapur/hidangan`
- `/dapur/ambalan`

## Article XI — Legacy Policy
Kode lama tidak dihapus karena terlihat tua.

Sebelum delete:
1. cari seluruh references;
2. tentukan runtime owner;
3. pastikan replacement canonical sudah live;
4. pahami rollback;
5. pastikan tidak ada consumer aktif.

Generasi legacy Dapur boleh tetap ada sementara sampai bukti references = 0 tersedia.

## Article XII — Change Protocol
1. identifikasi owner;
2. audit references;
3. audit boot order;
4. ubah canonical source;
5. validasi syntax/config;
6. deploy;
7. cocokkan commit SHA dengan deployment SHA;
8. fetch production route;
9. cek runtime/console errors;
10. verifikasi browser pada route utama;
11. baru declare done.

## Article XIII — Deployment Discipline
Tidak boleh menyebut `selesai`, `live`, atau `production ready` bila:
- deployment final belum `READY`;
- deployment bukan commit final;
- `/dapur` belum diuji;
- `/dapur/{username}` belum diuji;
- error runtime/console belum diperiksa;
- legacy resource request belum diperiksa.

## Article XIV — Current Release State
Refactor canonical Dapur sudah merge ke `main`.

Merge commit:
`0ad1b33b7704623beb8b9ca72b895a06e0b862bd`

Production aktif yang terakhir terverifikasi masih:
`53659423b83d3fb9fed8fbc0f97701871c392159`

Artinya: `merged` belum sama dengan `production verified`. Deployment production baru dengan merge commit wajib diverifikasi.

## Article XV — Communication Rule
Setiap laporan perubahan wajib menyebut:
- apa yang berubah;
- alasan perubahan;
- file/runtime utama;
- status backend bila relevan;
- commit SHA;
- deployment SHA bila tersedia;
- hasil verification;
- keterbatasan verification.

Jangan mengklaim sesuatu sudah diverifikasi bila belum benar-benar diuji.

## Article XVI — Freeze Rules
Tanpa alasan eksplisit, jangan ubah:
- global header structure;
- canonical public Creator URL `/{username}`;
- arti `/dapur`;
- arti `/dapur/{username}`;
- role boundaries;
- RLS/security contracts;
- payment/order logic yang sudah PASS.

## Article XVII — Definition of Done
Fitur Dapur dianggap selesai hanya bila:
- pengguna awam dapat menyelesaikan tugas utama tanpa bantuan developer;
- data tersimpan benar;
- authorization benar;
- route canonical benar;
- tampilan responsive;
- accessibility dasar terpenuhi;
- production memakai commit final;
- browser/console dan runtime production sudah diverifikasi.
