# Under Construction — Operational Runbook

## Tujuan

Modul Under Construction adalah mode maintenance terisolasi untuk homepage Studihome. Mode ini menutup halaman publik sementara tanpa mematikan akses Admin.

## Lokasi pengelolaan

**Admin → Under Construction**

Fitur ini sengaja dibuat sebagai **menu Admin mandiri**, bukan bergantung pada Gudang. Dengan demikian maintenance tetap mudah ditemukan dan tidak terpengaruh lifecycle modul Gudang.

## Prinsip operasional

1. **Default OFF.** Website tetap normal setelah deployment baru.
2. **Admin bypass.** Route `/admin` tetap dapat diakses ketika mode aktif.
3. **Database sebagai source of truth.** Status dan konten berada di `site_settings.under_construction`.
4. **RLS sebagai otoritas.** Mutasi konfigurasi tidak boleh bergantung pada pengecekan JavaScript saja.
5. **Storage least privilege.** Upload/delete media dibatasi bucket `site-media` dan folder `under-construction` untuk admin.
6. **Preview terisolasi.** Preview dibuat di window/document terpisah dan tidak mengubah dokumen Admin.
7. **No secrets.** Jangan masukkan API key, service-role key, password, token, atau kredensial.
8. **Satu perubahan, satu verifikasi.** Preview dahulu, baru ON/OFF di production.

## Cara mengelola

### 1. Membuka

Masuk ke `/admin`, lalu klik menu **Under Construction** pada navigasi Admin.

### 2. Mengaktifkan

Buka **Under Construction → Mode Under Construction**, isi konten, lakukan **Preview Halaman**, lalu klik **Simpan Perubahan**.

Mode aktif membuat homepage `/` menampilkan halaman maintenance, sementara `/admin` tetap tersedia.

### 3. Menonaktifkan

Buka **Admin → Under Construction**, matikan toggle, lalu **Simpan Perubahan**.

Setelah itu verifikasi homepage dalam incognito/hard refresh.

### 4. Konten

Field yang tersedia:

- Judul
- Deskripsi
- Judul ucapan kemerdekaan
- Pesan ucapan kemerdekaan
- Gambar
- Nomor WhatsApp
- Pesan WhatsApp
- Label tombol WhatsApp

Input teks di-escape sebelum dirender. Hindari HTML/JavaScript mentah.

### 5. Gambar

- JPG
- PNG
- WEBP
- Maksimum 3 MB
- Rekomendasi 16:9 atau 1:1

Media disimpan pada `site-media/under-construction/`.

## Alur kerja aman

**Admin → Under Construction → Edit → Preview → Save → ON/OFF → cek homepage → cek Admin → cek WhatsApp.**

## Checklist sebelum ON

- Konten final.
- Gambar berhasil dipreview.
- Nomor WhatsApp benar.
- Preview sesuai.
- Login Admin tetap berfungsi.
- Route lain tidak berubah.
- Preview deployment `READY`.

## Checklist setelah ON

1. Buka `/`.
2. Pastikan halaman Under Construction tampil.
3. Buka `/admin`.
4. Pastikan menu Under Construction tetap tersedia.
5. Buka panel dan pastikan pengaturan dapat dibaca.
6. Uji WhatsApp.
7. Pantau runtime logs.

## Checklist setelah OFF

1. Matikan toggle.
2. Simpan.
3. Buka homepage dalam incognito/hard refresh.
4. Pastikan homepage normal kembali.

## SEO dan HTTP

Untuk maintenance production yang lebih kuat, idealnya edge/server mengembalikan HTTP `503 Service Unavailable` dengan `Retry-After`, serta maintenance page menggunakan `noindex` sementara. Client-side JavaScript sendiri tidak dapat mengubah status HTTP response yang sudah diterima browser.

## Rollback

1. Matikan Under Construction bila Admin masih tersedia.
2. Jika deployment frontend bermasalah, rollback Vercel ke deployment stabil.
3. Jangan menghapus tabel/bucket production sebagai respons error frontend.
4. Jangan merge sebelum verification gate terpenuhi.

## Status gate

- Public module: feature branch
- Standalone Admin menu: feature branch
- Default: OFF
- Admin bypass: implemented
- Content controls: implemented
- Image upload/delete: implemented
- WhatsApp CTA: implemented
- Isolated preview: implemented
- Browser authenticated E2E: required before production merge
