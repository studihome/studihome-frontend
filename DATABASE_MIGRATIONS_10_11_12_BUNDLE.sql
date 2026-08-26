-- ============================================================
-- STUDIHOME — MIGRATION BUNDLE: Migrations 10, 11, 12
-- ============================================================
-- Generated:  26 Aug 2026
-- Order:       M10 → M11 → M12
-- Platform:    Supabase SQL Editor
-- Source:      DATABASE_MIGRATION_{10,11,12}.sql (individual files)
--
-- ⚠ PRA-RUN CHECKLIST:
--   ☐ Backup database sebelum menjalankan
--   ☐ Jalankan via Supabase SQL Editor
--   ☐ Pastikan tidak ada concurrent writes ke creator_profiles / site_settings
--
-- IDENTITAS MIGRASI:
--   M10: validate_creator_publish() trigger fix + security hardening
--   M11: contact_email DROP NOT NULL
--   M12: hero_promo_modules JSONB column
--
-- CONSTITUTION ALIGNMENT:
--   Art XI: table → policy → function/RPC → grants → callers audit chain
--   - M10: SECURITY DEFINER function + search_path="" + REVOKE EXECUTE
--   - M11: DDL only, no policy/function/grant changes
--   - M12: DDL only, RLS policies auto-inherited, no new functions
-- ============================================================


-- ============================================================
-- ████ MIGRATION 10 █████
-- validate_creator_publish() trigger fix + security hardening
-- ============================================================

-- M10 — Drop semua trigger validation lama (idempotent)
DROP TRIGGER IF EXISTS validate_creator_publish ON creator_profiles;
DROP TRIGGER IF EXISTS trg_validate_publish ON creator_profiles;
DROP TRIGGER IF EXISTS validate_publish_on_profile_update ON creator_profiles;

-- M10 — Buat/buat ulang fungsi trigger dengan security hardening
--   search_path=""  : prevents search_path injection (Constitution Art XI)
--   SECURITY DEFINER: trigger needs to read creator_services across users
CREATE OR REPLACE FUNCTION validate_creator_publish()
RETURNS trigger AS $$
BEGIN
    IF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
        IF NEW.is_published = true THEN
            IF NOT EXISTS (
                SELECT 1 FROM creator_services
                WHERE creator_id = NEW.id AND is_active = true
            ) THEN
                RAISE EXCEPTION 'Tambahkan minimal 1 jasa aktif sebelum mempublikasikan halaman Creator.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = '';

-- M10 — Permission hardening: REVOKE EXECUTE dari PUBLIC/anon
--   Trigger internal tidak membutuhkan EXECUTE grant.
--   Function hanya dipanggil oleh trigger, bukan oleh application code.
REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM anon;

-- M10 — Buat trigger baru (idempotent)
CREATE TRIGGER validate_publish_on_profile_update
    BEFORE UPDATE ON creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_creator_publish();


-- ============================================================
-- ████ MIGRATION 11 █████
-- contact_email DROP NOT NULL
-- ============================================================

-- M11 — Drop NOT NULL constraint (idempotent, aman dijalankan berulang kali)
ALTER TABLE creator_profiles
    ALTER COLUMN contact_email DROP NOT NULL;


-- ============================================================
-- ████ MIGRATION 12 █████
-- hero_promo_modules JSONB ke site_settings
-- ============================================================

-- M12 — Tambah kolom JSONB dengan default array kosong (idempotent)
ALTER TABLE site_settings
    ADD COLUMN IF NOT EXISTS hero_promo_modules JSONB DEFAULT '[]'::jsonb;

-- M12 — Set default value untuk baris yang sudah ada (hanya NULL rows)
UPDATE site_settings
SET hero_promo_modules = '[]'::jsonb
WHERE hero_promo_modules IS NULL;


-- ============================================================
-- ████ FINAL VERIFICATION █████
-- Jalankan query di bawah ini untuk memverifikasi semua migrasi.
-- Semua harus PASS sebelum melanjutkan ke production.
-- ============================================================

-- V1: M10 — Trigger ada dan aktif
-- Expected: 1 row, trigger_name = validate_publish_on_profile_update
SELECT 'M10_trigger' AS check_name,
    t.tgname AS trigger_name,
    t.tgenabled AS is_enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'creator_profiles'
    AND t.tgisinternal = false;

-- V2: M10 — Function ada, SECURITY DEFINER, search_path=""
-- Expected: prosecdef=true, proconfig contains search_path=""
SELECT 'M10_function' AS check_name,
    p.proname AS function_name,
    p.prosecdef AS is_security_definer,
    p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'validate_creator_publish'
    AND n.nspname = 'public';

-- V3: M10 — EXECUTE grant hanya untuk postgres (tidak ada PUBLIC/anon)
-- Expected: 0 rows (karena function hanya dipanggil trigger, bukan RPC)
SELECT 'M10_grants' AS check_name,
    grantee,
    privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'validate_creator_publish'
    AND routine_schema = 'public'
ORDER BY grantee;

-- V4: M11 — contact_email nullable
-- Expected: is_nullable = 'YES'
SELECT 'M11_nullable' AS check_name,
    c.column_name,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.table_name = 'creator_profiles'
    AND c.column_name = 'contact_email';

-- V5: M11 — CHECK constraint masih aktif
-- Expected: minimal 1 row
SELECT 'M11_check' AS check_name,
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class cl ON con.conrelid = cl.oid
JOIN pg_namespace n ON cl.relnamespace = n.oid
WHERE cl.relname = 'creator_profiles'
    AND n.nspname = 'public'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%contact_email%';

-- V6: M12 — Kolom hero_promo_modules ada
-- Expected: data_type='jsonb', is_nullable='YES'
SELECT 'M12_column' AS check_name,
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'site_settings'
    AND column_name = 'hero_promo_modules';

-- V7: M12 — RLS masih aktif pada site_settings
-- Expected: rls_enabled = true
SELECT 'M12_rls' AS check_name,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'site_settings'
    AND schemaname = 'public';

-- V8: M12 — Semua baris punya value (tidak ada NULL)
-- Expected: 0 null values
SELECT 'M12_null_audit' AS check_name,
    COUNT(*) AS total_rows,
    COUNT(hero_promo_modules) AS non_null,
    COUNT(*) - COUNT(hero_promo_modules) AS null_count
FROM site_settings;

-- V9: M12 — RLS policies masih berlaku
-- Expected: admin write policy ada
SELECT 'M12_policies' AS check_name,
    policyname,
    cmd AS policy_command
FROM pg_policies
WHERE tablename = 'site_settings'
    AND schemaname = 'public'
ORDER BY policyname;


-- ============================================================
-- ████ ROLLBACK (jika perlu) █████
-- Uncomment langkah yang sesuai JIKA perlu mengembalikan migrasi.
-- ⚠ Rollback M12 akan menghapus semua data hero_promo_modules.
-- ⚠ Rollback M11 hanya bisa dilakukan jika tidak ada NULL values.
-- ⚠ Rollback M10 akan menghapus trigger — creator_profiles
--    tidak akan lagi validate publish status.
-- ============================================================

-- ROLLBACK M12:
-- ALTER TABLE site_settings DROP COLUMN IF EXISTS hero_promo_modules;

-- ROLLBACK M11:
-- ALTER TABLE creator_profiles ALTER COLUMN contact_email SET NOT NULL;

-- ROLLBACK M10:
-- DROP TRIGGER IF EXISTS validate_publish_on_profile_update ON creator_profiles;
-- DROP FUNCTION IF EXISTS validate_creator_publish();


-- ============================================================
-- END OF MIGRATION BUNDLE
-- Status: Siap dieksekusi via Supabase SQL Editor
-- ============================================================
