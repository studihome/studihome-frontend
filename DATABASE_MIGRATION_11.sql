-- ============================================================
-- MIGRASI 11: Make contact_email nullable
-- ============================================================
-- MASALAH: contact_email column has NOT NULL constraint.
-- Editor sends NULL when email is empty → error 23502.
-- CHECK constraint blocks empty string → error 23514.
-- Double trap: empty → CHECK fails, null → NOT NULL fails.
--
-- SOLUSI: Drop NOT NULL constraint. NULL is valid for
-- optional email field. CHECK constraint still enforces
-- valid email format when a value is provided.
-- ============================================================

-- Langkah 1: Cek constraint saat ini
SELECT
    c.column_name,
    c.is_nullable,
    c.column_default,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM information_schema.columns c
LEFT JOIN pg_constraint con ON con.conrelid = (
    SELECT oid FROM pg_class WHERE relname = 'creator_profiles'
) AND con.conname LIKE '%' || c.column_name || '%'
WHERE c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email';

-- Langkah 2: Drop NOT NULL constraint
ALTER TABLE creator_profiles
    ALTER COLUMN contact_email DROP NOT NULL;

-- Langkah 3: Verifikasi
SELECT
    c.column_name,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email';

-- Expected: is_nullable = 'YES'
