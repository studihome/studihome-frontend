# Under Construction — Operational Runbook

## Tujuan

Modul Under Construction adalah mode maintenance terisolasi untuk homepage Studihome. Mode ini dibuat untuk memungkinkan admin menutup halaman publik sementara, tanpa mematikan akses Admin.

## Prinsip operasional

1. **Default OFF.** Website harus tetap normal setelah deploy baru.
2. **Admin bypass.** Route `/admin` tetap dapat diakses ketika mode aktif.
3. **Database sebagai source of truth.** Status dan konten disimpan pada `site_settings.under_construction`.
4. **RLS sebagai otoritas.** Perubahan konfigurasi harus ditolak database kecuali memenuhi policy admin yang sudah ada.
5. **Storage least privilege.** Upload/delete media dibatasi ke bucket `site-media`, folder `under-construction`, dan user admin.
6. **Preview tidak mengubah halaman Admin.** Preview dirender pada window/document terpisah.
7. **Jangan menyimpan secret.** Jangan memasukkan API key, service-role key, password, atau kredensial ke field Under Construction.
8. **Satu perubahan, satu verifikasi.** Setelah mengaktifkan/mengubah konten, lakukan Preview lalu uji homepage pada mobile dan desktop.

## Cara mengelola dari Admin

### 1. Membuka panel

Masuk ke `/admin`, buka **Under Construction** pada navigasi Dapur/Admin.

### 2. Mengaktifkan maintenance

Centang **Mode Under Construction**, isi konten yang diperlukan, lalu klik **Simpan Perubahan**.

Setelah aktif:

- Homepage `/` menampilkan halaman Under Construction.
- Admin tetap bisa diakses.
- Isi halaman diambil dari database.
- Tombol WhatsApp hanya muncul jika nomor valid/tersedia.

### 3. Menonaktifkan maintenance

Buka **Under Construction**, matikan toggle, lalu **Simpan Perubahan**.

Homepage kembali menggunakan halaman normal. Disarankan melakukan refresh hard-cache atau membuka incognito untuk verifikasi.

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

**Edit → Preview → Save → ON/OFF → cek homepage → cek Admin → cek WhatsApp → selesai.**

Untuk perubahan besar, jangan langsung menyalakan maintenance di production. Verifikasi dulu melalui Vercel Preview.

## Safety checklist sebelum ON

- Konten sudah final.
- Gambar berhasil dimuat.
- Nomor WhatsApp benar.
- Preview sesuai tampilan yang diinginkan.
- Login Admin masih berfungsi.
- Tidak ada perubahan pada route lain.
- Production deployment yang akan dipakai sudah `READY`.

## Safety checklist setelah ON

1. Buka `/` pada browser biasa.
2. Pastikan Under Construction tampil.
3. Buka `/admin` dan pastikan Admin tetap dapat masuk.
4. Uji tombol WhatsApp.
5. Uji tampilan mobile.
6. Pantau runtime/deployment logs.

## Safety checklist sebelum OFF

- Pastikan homepage normal sudah siap.
- Pastikan tidak ada pekerjaan maintenance yang masih berjalan.
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

1. Matikan **Mode Under Construction** dari Admin bila masih dapat diakses.
2. Bila deployment bermasalah, rollback Vercel ke deployment stabil sebelumnya.
3. Jangan menghapus bucket atau tabel production untuk menyelesaikan error frontend.
4. Jangan merge PR yang belum melewati verification gate.

## Status implementasi saat ini

- Module: implemented on feature branch.
- Default: OFF.
- Admin bypass: implemented.
- Admin content controls: implemented.
- Image upload/delete: implemented.
- WhatsApp CTA: implemented.
- Isolated preview: implemented.
- Preview Vercel: READY.
- Production merge: intentionally blocked until authenticated E2E verification passes.
