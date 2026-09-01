# 📧 Panduan Setup Email Templates — Studihome

## Template yang Tersedia

| Template | Fungsi | Variable |
|----------|--------|----------|
| `password-reset.html` | Email reset kata sandi | `{{ .ConfirmationURL }}` |
| `email-confirmation.html` | Verifikasi email saat daftar | `{{ .ConfirmationURL }}` |

## Desain

Kedua template menggunakan desain yang konsisten:
- **Brand colors**: `#151c75` (navy), `#3f48bf` (blue), `#f59e0b` (amber)
- **Typography**: Segoe UI / Roboto, weight 800 untuk headings
- **Layout**: Centered card (480px max), rounded corners (16px), subtle shadow
- **CTA**: Gradient button dengan hover-friendly radius
- **Responsive**: Tabel-based layout yang kompatibel dengan semua email client

## Cara Setup di Supabase

### 1. Password Reset Email

**Via Supabase Dashboard:**

1. Buka **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Pilih tab **"Reset Password"**
3. Ganti isi template dengan isi file `password-reset.html`
4. Klik **Save**

**Via Supabase CLI:**

```bash
# Pastikan sudah login
supabase link --project-ref <your-project-ref>

# Upload template
supabase functions deploy send-password-reset-email
```

### 2. Email Confirmation

**Via Supabase Dashboard:**

1. Buka **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Pilih tab **"Confirm Signup"**
3. Ganti isi template dengan isi file `email-confirmation.html`
4. Klik **Save**

### 3. Redirect URL Configuration

**Penting!** Tambahkan redirect URL untuk password reset:

1. Buka **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Di bagian **"Redirect URLs"**, tambahkan:
   ```
   https://studihome.id/reset-password
   https://studihome.id/**
   ```
3. Klik **Save**

### 4. SMTP Configuration (Opsional)

Jika ingin menggunakan SMTP custom (Gmail, SendGrid, dll):

1. Buka **Supabase Dashboard** → **Project Settings** → **Authentication**
2. Scroll ke **"SMTP Settings"**
3. Enable SMTP dan isi konfigurasi

**Contoh Gmail SMTP:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: [App Password dari Google]
Sender Email: noreply@studihome.id
Sender Name: Studihome
```

## Testing

### Test Password Reset

1. Buka halaman login Studihome
2. Klik "Lupa Password?"
3. Masukkan email yang terdaftar
4. Klik "Kirim Link Reset"
5. Cek inbox email (dan folder Spam)
6. Klik tombol "Atur Kata Sandi Baru"
7. Masukkan password baru
8. Login dengan password baru

### Test Email Confirmation

1. Buka halaman registrasi Studihome
2. Isi data dan klik "Buat Akun Sekarang"
3. Cek inbox email
4. Klik "Konfirmasi Email"
5. Akun terverifikasi

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Email tidak masuk | Cek folder Spam/Junk |
| Link reset tidak berfungsi | Pastikan redirect URL sudah ditambahkan di Supabase |
| Template tidak berubah | Clear cache browser, hard refresh |
| SMTP error | Cek kredensial SMTP di Supabase Dashboard |

## Desain System

### Warna
```
Primary:    #151c75 (Navy)
Secondary:  #3f48bf (Blue)
Accent:     #f59e0b (Amber)
Success:    #22c55e (Green)
Text:       #1e293b (Dark)
Muted:      #64748b (Slate)
Background: #f1f5f9 (Light Gray)
Card:       #ffffff (White)
```

### Spacing
```
Card padding:   40px horizontal, 32px vertical
Section gap:    24px
Element gap:    8-12px
Border radius:  16px (card), 12px (button), 10px (info box)
```

### Typography
```
Brand name:     20px, weight 800
Heading:        18px, weight 800
Body:           14px, weight 400
Small:          12px, weight 400
Tiny:           10-11px, weight 400
```
