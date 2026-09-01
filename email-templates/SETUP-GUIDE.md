# 📧 Setup Template Email Reset Password — Studihome

## Template

`password-reset.html` — Email reset kata sandi dengan desain Studihome.

## Setup di Supabase Dashboard

### Langkah 1: Buka Email Templates

1. Buka **https://supabase.com/dashboard**
2. Pilih project **Studihome**
3. Sidebar kiri: **Authentication** → **Email Templates**

### Langkah 2: Pilih Tab "Reset Password"

1. Di bagian atas, klik tab **"Reset Password"**
2. Anda akan melihat editor HTML dengan template default Supabase

### Langkah 3: Ganti Template

1. **Hapus semua isi** di editor
2. **Copy-paste** isi dari file `password-reset.html`
3. **Pastikan** variable `{{ .ConfirmationURL }}` ada di dalam tombol CTA

### Langkah 4: Simpan

1. Klik tombol **Save** di pojok kanan atas
2. Tunggu hingga muncul notifikasi sukses

### Langkah 5: Konfigurasi Redirect URL

**Wajib!** Tanpa ini, link reset tidak berfungsi.

1. Sidebar: **Authentication** → **URL Configuration**
2. Di bagian **"Redirect URLs"**, klik **"Add URL"**
3. Tambahkan:
   ```
   https://studihome.id/**
   ```
4. Klik **Save**

## Testing

1. Buka **https://studihome.id**
2. Klik **"Masuk"** → **"Lupa Password?"**
3. Masukkan email yang terdaftar
4. Klik **"Kirim Link Reset"**
5. Cek inbox email (dan folder **Spam**)
6. Klik tombol **"Atur Kata Sandi Baru"**
7. Masukkan password baru
8. Login dengan password baru

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Email tidak masuk | Cek folder Spam, tunggu 1-2 menit |
| Link tidak berfungsi | Pastikan redirect URL sudah ditambahkan |
| Error "Invalid redirect" | URL harus diawali `https://studihome.id/` |
| Template tidak berubah | Hard refresh browser (`Ctrl+Shift+R`) |

## Variable

| Variable | Fungsi | Wajib? |
|----------|--------|--------|
| `{{ .ConfirmationURL }}` | Link reset password | ✅ Ya |
| `{{ .Email }}` | Email user | Opsional |
| `{{ .Token }}` | Token reset | Opsional |
