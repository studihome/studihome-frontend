# Under Construction — Operational Runbook

## Tujuan

Modul Under Construction adalah mode maintenance terisolasi untuk homepage Studihome. Mode ini memungkinkan admin menutup halaman publik sementara tanpa mematikan akses Admin.

## Prinsip operasional

1. **Default OFF.** Website tetap normal setelah deploy baru.
2. **Admin bypass.** Route `/admin` tetap dapat diakses ketika mode aktif.
3. **Gudang sebagai lokasi pengelolaan.** Kontrol Under Construction berada di dalam menu **Gudang**, bukan menu Admin tingkat atas.
4. **Database sebagai source of truth.** Status dan konten disimpan pada `site_settings.under_construction`.
5. **RLS sebagai otoritas.** Perubahan konfigurasi harus tetap ditolak database kecuali memenuhi policy admin yang ada.
6. **Storage least privilege.** Upload/delete media dibatasi ke bucket `site-media`, folder `under-construction`, dan user admin.
7. **Preview tidak mengubah halaman Gudang/Admin.** Preview dirender pada window/document terpisah.
8. **Jangan menyimpan secret.** Jangan memasukkan API key, service-role key, password, atau kredensial ke field Under Construction.
9. **Satu perubahan, satu verifikasi.** Setelah mengubah konten, lakukan Preview lalu uji homepage.

## Cara mengelola dari Admin

### 1. Membuka panel

Masuk ke `/admin`, pilih menu **Gudang**. Di dalam panel Gudang tersedia bagian **Under Construction**.

Klik **Buka Pengaturan** untuk membuka kontrol lengkap.

### 2. Mengaktifkan maintenance

Di panel Under Construction:

1. Atur judul, deskripsi, ucapan, gambar, dan WhatsApp.
2. Klik **Preview Halaman** untuk memeriksa hasil.
3. Klik **Simpan Perubahan**.
4. Aktifkan **Mode Under Construction**.
5. Klik **Simpan Perubahan** lagi jika toggle diubah setelah konten tersimpan.

Setelah aktif:

- Homepage `/` menampilkan halaman Under Construction.
- Admin tetap dapat diakses.
- Isi halaman dibaca dari `site_settings.under_construction`.
- Tombol WhatsApp hanya muncul jika nomor tersedia.

### 3. Menonaktifkan maintenance

Buka `/admin` → **Gudang** → **Under Construction**.

Matikan toggle **Mode Under Construction**, lalu simpan.

Homepage kembali ke halaman normal. Verifikasi dengan refresh hard-cache atau sesi incognito.

### 4. Mengubah konten

Field yang tersedia:

- **Judul** — headline utama.
- **Deskripsi** — penjelasan singkat kepada pengunjung.
- **Judul ucapan** — pesan kontekstual/event.
- **Pesan ucapan** — isi pesan pendukung.
- **Gambar** — media utama.
- **Nomor WhatsApp** — gunakan format internasional, contoh `62812xxxx`.
- **Pesan WhatsApp** — pesan pembuka otomatis.
- **Label WhatsApp** — teks tombol.

Semua input teks dirender dengan escaping pada frontend. Tetap hindari memasukkan HTML/JavaScript mentah.

### 5. Upload gambar

Format yang diterima:

- JPG
- PNG
- WEBP
- Maksimum 3 MB

Rekomendasi rasio: 16:9 atau 1:1.

Media berada di folder `under-construction` pada bucket `site-media`.

## Alur kerja yang direkomendasikan

**Gudang → Under Construction → Edit → Preview → Simpan → ON/OFF → cek homepage → cek Admin → cek WhatsApp → selesai.**

Untuk perubahan besar, verifikasi dulu melalui Vercel Preview sebelum mengaktifkan maintenance production.

## Safety checklist sebelum ON

- Konten sudah final.
- Gambar berhasil dimuat.
- Nomor WhatsApp benar.
- Preview sesuai.
- Login Admin masih berfungsi.
- Menu Gudang masih membuka panel normal.
- Tidak ada perubahan pada route lain.
- Deployment yang akan dipakai berstatus `READY`.

## Safety checklist setelah ON

1. Buka `/` pada browser biasa.
2. Pastikan Under Construction tampil.
3. Buka `/admin` → **Gudang** dan pastikan panel tetap dapat dibuka.
4. Uji tombol WhatsApp.
5. Uji tampilan mobile.
6. Pantau runtime/deployment logs.

## Safety checklist sebelum OFF

- Pastikan homepage normal sudah siap.
- Pastikan pekerjaan maintenance selesai.
- Matikan toggle dan simpan.
- Refresh homepage dalam sesi incognito.
- Pastikan halaman normal kembali.

## Aturan SEO dan HTTP

Mode maintenance idealnya diperlakukan sebagai temporary maintenance state. Untuk implementasi production yang lebih kuat, response HTTP maintenance sebaiknya menggunakan status `503 Service Unavailable` dengan `Retry-After` dan halaman maintenance memberi `noindex` sementara. Static frontend client-side tidak dapat mengubah HTTP status response setelah request berlangsung; implementasi status 503 harus dilakukan pada edge/server/rewrite layer.

## Catatan keamanan Supabase

`site_settings` memiliki data lain selain `under_construction`, sehingga jangan menganggap policy `SELECT` publik sebagai mekanisme kerahasiaan kolom. Jangan menaruh secret di row tersebut. Untuk desain jangka panjang, public configuration yang benar-benar publik sebaiknya dipisahkan dari data admin/sensitif.

Perubahan Admin harus tetap dilindungi RLS/authorization. Jangan mengganti model tersebut dengan pengecekan role yang hanya dilakukan di JavaScript.

## Rollback

Jika modul bermasalah:

1. Matikan **Mode Under Construction** dari `/admin` → **Gudang** bila masih dapat diakses.
2. Bila deployment bermasalah, rollback Vercel ke deployment stabil sebelumnya.
3. Jangan menghapus bucket atau tabel production untuk menyelesaikan error frontend.
4. Jangan merge PR yang belum melewati verification gate.

## Status implementasi saat ini

- Module: implemented on feature branch.
- Default: OFF.
- Admin bypass: implemented.
- Gudang integration: implemented on feature branch.
- Admin content controls: implemented.
- Image upload/delete: implemented.
- WhatsApp CTA: implemented.
- Isolated preview: implemented.
- Preview Vercel: verify after latest commit.
- Production merge: intentionally blocked until authenticated E2E verification passes.
