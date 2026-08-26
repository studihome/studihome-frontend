-- ============================================================
-- MIGRASI 12: Add hero_promo_modules JSONB to site_settings
-- ============================================================
-- Created:  26 Aug 2026 (initial)
-- Revised:  26 Aug 2026 (best-practice hardening)
--
-- MASALAH:
--   Hero promo modules disimpan di localStorage (per-device).
--   Mobile dan device lain tidak punya data yang sama.
--
-- SOLUSI:
--   Tambah kolom JSONB hero_promo_modules ke site_settings
--   agar semua device bisa akses module yang sama.
--
-- IDEMPOTENCY:
--   ADD COLUMN IF NOT EXISTS aman dijalankan berulang kali.
--   UPDATE hanya menyentuh NULL rows (idempotent untuk non-null data).
--
-- CONSTITUTION ALIGNMENT:
--   Art XI: Audit chain = table → policy → function/RPC → grants → callers.
--   - Table: site_settings (existing, verified)
--   - Policy: admin-only write + public read (existing, verified via Langkah 0)
--   - Function/RPC: tidak ada yang baru (DDL only)
--   - Grants: tidak ada perubahan (RLS menangani)
--   - Callers: frontend existing (admin panel + public homepage)
--   Kolom baru otomatis terkena RLS policy yang sudah ada.
--   Tidak ada SECURITY DEFINER involvement.
--
-- EXECUTION ORDER:
--   Tidak ada dependency ke Migration 10 atau 11. Bisa dijalankan sendiri.
--   ⚠ REKOMENDASI: jalankan SETELAH Migration 10-11 untuk menjaga
--     urutan audit trail yang bersih.
--
-- PRA-RUN CHECKLIST:
--   ☐ Backup database sebelum menjalankan
--   ☐ RLS aktif pada site_settings (dipastikan oleh Langkah 0)
--   ☐ Admin-only write policy ada (dipastikan oleh Langkah 0b)
--   ☐ Jalankan via Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Langkah 0a: Verifikasi RLS aktif pada site_settings
--
-- Jika rls_enabled = false → STOP, aktifkan RLS dulu sebelum
-- menjalankan migration ini. Tanpa RLS, semua user bisa write
-- ke kolom baru.
-- ============================================================
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'site_settings'
    AND schemaname = 'public';

-- ============================================================
-- Langkah 0b: Verifikasi admin-only write policy ada
--
-- Expected: minimal 1 row dengan
--   cmd IN ('INSERT','UPDATE','ALL')
--   qual atau with_check yang mengandung is_admin()
--
-- Jika tidak ada admin write policy → STOP. Kolom baru
-- akan writable oleh semua user tanpa policy.
-- ============================================================
SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS policy_command,
    roles,
    qual AS using_expression,
    with_check AS check_expression
FROM pg_policies
WHERE tablename = 'site_settings'
    AND schemaname = 'public'
    AND cmd IN ('INSERT', 'UPDATE', 'ALL', '*')
ORDER BY policyname;

-- ============================================================
-- Langkah 1: Cek apakah kolom sudah ada
--
-- Expected: 0 rows jika belum ada, 1 row jika sudah ada
-- ============================================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'site_settings'
    AND column_name = 'hero_promo_modules';

-- ============================================================
-- Langkah 2: Tambah kolom JSONB dengan default array kosong
--
-- Idempotent: IF NOT EXISTS aman dijalankan berulang kali.
-- DEFAULT '[]'::jsonb menjamin baris baru selalu punya value.
-- ============================================================
ALTER TABLE site_settings
    ADD COLUMN IF NOT EXISTS hero_promo_modules JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- Langkah 3: Set default value untuk baris yang sudah ada
--
-- ⚠ PERHATIAN: UPDATE ini hanya menyentuh baris dengan NULL.
--   Jika hero_promo_modules sudah punya data (dari run sebelumnya),
--   baris itu TIDAK akan di-overwrite.
--   Untuk jumlah baris site_settings yang kecil, ini aman.
-- ============================================================
UPDATE site_settings
SET hero_promo_modules = '[]'::jsonb
WHERE hero_promo_modules IS NULL;

-- ============================================================
-- Langkah 4: Verifikasi kolom
--
-- Expected:
--   data_type = 'jsonb'
--   column_default = '[]'::jsonb
--   is_nullable = 'YES'
-- ============================================================
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'site_settings'
    AND column_name = 'hero_promo_modules';

-- ============================================================
-- Langkah 5: Verifikasi data di kolom
--
-- Semua baris harus punya array kosong [] atau data module yang valid.
-- Jika ada NULL setelah Langkah 3 → sesuatu salah.
-- ============================================================
SELECT
    id,
    jsonb_typeof(hero_promo_modules) AS value_type,
    jsonb_array_length(hero_promo_modules) AS module_count,
    hero_promo_modules
FROM site_settings
WHERE hero_promo_modules IS NOT NULL;

-- ============================================================
-- Langkah 6: Verifikasi RLS policy masih aktif setelah ADD COLUMN
--
-- Kolom baru otomatis terkena policy yang sudah ada.
-- Query ini memastikan SELECT (public read) dan INSERT/UPDATE
-- (admin write) policies masih berlaku.
-- ============================================================
SELECT
    policyname,
    cmd AS policy_command,
    roles AS applied_to_roles,
    qual AS using_expression
FROM pg_policies
WHERE tablename = 'site_settings'
    AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================
-- ROLLBACK
--
-- ⚠ Menghapus kolom akan menghapus semua data module yang sudah ada.
--   Pastikan tidak ada dependensi frontend sebelum rollback.
-- ============================================================
-- ALTER TABLE site_settings
--     DROP COLUMN IF EXISTS hero_promo_modules;

-- ============================================================
-- CATATAN RUNNING:
--
-- 1. Jalankan Langkah 0a-0b untuk verifikasi RLS + policy
--    ⚠ JIKA Langkah 0a menunjukkan rls_enabled = false → STOP
--    ⚠ JIKA Langkah 0b tidak ada admin write policy → STOP
-- 2. Jalankan Langkah 1-2 untuk tambah kolom
-- 3. Jalankan Langkah 3 untuk backfill NULL rows
-- 4. Jalankan Langkah 4-6 untuk verifikasi
-- 5. Jika semua PASS → migrasi selesai
--
-- KEAMANAN:
--   - Kolom baru otomatis terkena RLS policy site_settings yang ada
--   - Admin bisa write, public bisa read (sesuai policy existing)
--   - Frontend harus handle null/empty array gracefully
--   - Jangan simpan data sensitif di kolom ini (public-read policy)
--
-- Pada Supabase, jalankan melalui SQL Editor di Dashboard.
-- Pastikan backup database sebelum menjalankan migrasi.
-- ============================================================
