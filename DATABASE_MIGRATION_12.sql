-- ============================================================
-- MIGRASI 12: Fix contact_email — complete fix
-- ============================================================
-- MASALAH: 
-- 1. contact_email column has NOT NULL constraint
--    → null values rejected (error 23502)
-- 2. contact_email column has CHECK constraint (email format)
--    → empty strings rejected (error 23514)
-- 3. Double trap: empty → CHECK fails, null → NOT NULL fails
--
-- Existing data may have empty strings that violate CHECK.
-- 
-- SOLUSI:
-- 1. Clean up existing empty strings → NULL
-- 2. Make column nullable (allow NULL)
-- 3. Keep CHECK constraint (validates format when value exists)
-- ============================================================

-- Langkah 1: Cek data saat ini
SELECT id, contact_email, LENGTH(contact_email) as len
FROM creator_profiles
WHERE contact_email IS NULL OR contact_email = '' OR contact_email !~ '^[^@]+@[^@]+\.[^@]+$'
LIMIT 10;

-- Langkah 2: Bersihkan empty strings → NULL
UPDATE creator_profiles
SET contact_email = NULL
WHERE contact_email = '';

-- Langkah 3: Drop NOT NULL constraint
ALTER TABLE creator_profiles
    ALTER COLUMN contact_email DROP NOT NULL;

-- Langkah 4: Verifikasi
SELECT
    c.column_name,
    c.is_nullable,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM information_schema.columns c
LEFT JOIN pg_constraint con ON con.conrelid = (
    SELECT oid FROM pg_class WHERE relname = 'creator_profiles'
) AND con.conname LIKE '%contact_email%'
WHERE c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email';

-- Expected: is_nullable = 'YES'
-- CHECK constraint still exists: validates email format when value is provided
-- NULL is now allowed: optional field
