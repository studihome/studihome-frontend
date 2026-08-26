-- ============================================================
-- MIGRASI 11: Make contact_email nullable
-- ============================================================
-- Created:  26 Aug 2026 (initial)
-- Revised:  26 Aug 2026 (best-practice hardening)
--
-- MASALAH:
--   contact_email column has NOT NULL constraint.
--   Editor sends NULL when email is empty → error 23502.
--   CHECK constraint blocks empty string → error 23514.
--   Double trap: empty → CHECK fails, null → NOT NULL fails.
--
-- SOLUSI:
--   Drop NOT NULL constraint. NULL is valid untuk optional email.
--   CHECK constraint tetap enforce valid email format jika value provided.
--
-- IDEMPOTENCY:
--   DROP NOT NULL aman dijalankan berulang kali (no-op jika sudah nullable).
--
-- CONSTITUTION ALIGNMENT:
--   Art XI: Audit chain = table → policy → function/RPC → grants → callers.
--   Migration ini hanya DDL (ALTER COLUMN), tidak mengubah policies,
--   functions, grants, atau frontend callers. CHECK constraint tetap aktif.
--   Tidak ada SECURITY DEFINER involvement.
--
-- EXECUTION ORDER:
--   Tidak ada dependency ke Migration 10 atau 12. Bisa dijalankan sendiri.
--
-- PRA-RUN CHECKLIST:
--   ☐ Backup database sebelum menjalankan
--   ☐ Jalankan via Supabase SQL Editor
-- ============================================================

-- ============================================================
-- Langkah 1: Cek constraint saat ini
--
-- Expected sebelum migration:
--   is_nullable = 'NO'
--   CHECK constraint ada (format email validation)
-- ============================================================
SELECT
    c.column_name,
    c.is_nullable,
    c.column_default,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM information_schema.columns c
LEFT JOIN pg_constraint con ON con.conrelid = (
    SELECT oid FROM pg_class WHERE relname = 'creator_profiles'
    AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
) AND con.conname LIKE '%' || c.column_name || '%'
WHERE c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email'
    AND c.table_schema = 'public';

-- ============================================================
-- Langkah 2: Drop NOT NULL constraint
--
-- Idempotent: aman dijalankan berulang kali.
-- Tidak menghapus CHECK constraint (format validation tetap aktif).
-- ============================================================
ALTER TABLE creator_profiles
    ALTER COLUMN contact_email DROP NOT NULL;

-- ============================================================
-- Langkah 3: Verifikasi is_nullable berubah ke YES
--
-- Expected: is_nullable = 'YES'
-- ============================================================
SELECT
    c.column_name,
    c.is_nullable,
    c.data_type,
    c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email';

-- ============================================================
-- Langkah 4: Verifikasi CHECK constraint masih aktif
--
-- CHECK constraint harus masih ada untuk mencegah format email
-- yang invalid. NULL diizinkan, tapi jika ada value harus valid.
--
-- Expected: minimal 1 row dengan constraint_definition
--   yang mengandung 'contact_email'
-- ============================================================
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class cl ON con.conrelid = cl.oid
JOIN pg_namespace n ON cl.relnamespace = n.oid
WHERE cl.relname = 'creator_profiles'
    AND n.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%contact_email%';

-- ============================================================
-- Langkah 5: Verifikasi tidak ada existing NULL values yang
-- sebelumnya tersembunyi oleh NOT NULL
--
-- DROP NOT NULL tidak mengisi NULL values — mereka sudah NULL
-- di database jika editor pernah gagal. Ini normal.
-- ============================================================
SELECT
    COUNT(*) AS total_rows,
    COUNT(contact_email) AS non_null_emails,
    COUNT(*) - COUNT(contact_email) AS null_emails
FROM creator_profiles;

-- ============================================================
-- ROLLBACK
--
-- ⚠ Hanya jalankan rollback jika TIDAK ada NULL values di kolom.
--   Cek Langkah 5 dulu: jika null_emails > 0, SET NOT NULL akan gagal
--   karena PostgreSQL tidak bisa menambahkan NOT NULL pada kolom
--   yang sudah punya NULL values.
-- ============================================================
-- ALTER TABLE creator_profiles
--     ALTER COLUMN contact_email SET NOT NULL;

-- ============================================================
-- CATATAN RUNNING:
--
-- 1. Jalankan Langkah 1 untuk cek status current
-- 2. Jalankan Langkah 2 untuk drop NOT NULL
-- 3. Jalankan Langkah 3-5 untuk verifikasi
-- 4. Jika Langkah 4 tidak ada hasil → CHECK constraint hilang
--    (sesuatu salah — jangan lanjut ke production)
-- 5. Pada Supabase, jalankan melalui SQL Editor di Dashboard
-- 6. Pastikan backup database sebelum menjalankan
-- ============================================================
