-- ============================================================
-- MIGRASI 10: Fix creator_profiles trigger + security hardening
-- ============================================================
-- Created:  26 Aug 2026 (initial)
-- Revised:  26 Aug 2026 (best-practice hardening)
--
-- MASALAH:
--   1. Trigger validation berjalan di SETIAP UPDATE, termasuk
--      saat user hanya edit display_name/bio. Jika is_published=true
--      tapi tidak ada active service → 400 error.
--   2. SECURITY DEFINER function tidak punya search_path=""
--      (Constitution Art XI — P0 finding).
--   3. SECURITY DEFINER function tidak punya permission hardening
--      (REVOKE from PUBLIC/anon — Constitution Art XI).
--
-- SOLUSI:
--   1. Trigger baru yang HANYA validate saat is_published BERUBAH
--   2. search_path="" ditambahkan ke function
--   3. REVOKE EXECUTE dari PUBLIC/anon; batasi ke authenticated
--
-- CATATAN KEAMANAN:
--   Supabase menggunakan role `postgres` sebagai owner function.
--   SECURITY DEFINER menjalankan function dengan hak postgres.
--   PUBLIC dan anon TIDAK BOLEH punya EXECUTE pada function ini.
--
-- Rollback di bagian bawah file.
-- ============================================================

-- ============================================================
-- Langkah 1: Deteksi nama trigger yang ada (idempotent)
--
-- Menjalankan SELECT ini akan menampilkan trigger yang aktif
-- pada creator_profiles. Catat namanya untuk referensi.
-- ============================================================
SELECT
    t.tgname AS trigger_name,
    t.tgenabled AS is_enabled,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'creator_profiles'
    AND t.tgisinternal = false
ORDER BY t.tgname;

-- ============================================================
-- Langkah 2: Drop semua trigger validation lama (idempotent)
--
-- Idempotent: DROP TRIGGER IF EXISTS tidak gagal jika trigger
-- tidak ada. Kita drop semua kemungkinan nama yang umum.
-- ============================================================
DROP TRIGGER IF EXISTS validate_creator_publish ON creator_profiles;
DROP TRIGGER IF EXISTS trg_validate_publish ON creator_profiles;
DROP TRIGGER IF EXISTS validate_publish_on_profile_update ON creator_profiles;

-- ============================================================
-- Langkah 3: Buat/buat ulang fungsi trigger dengan hardening
--
-- PERUBAHAN KEAMANAN (P0 — Constitution Art XI):
--   1. search_path="" ditambahkan agar search path kosong
--      saat fungsi dieksekusi. Mencegah search_path injection.
--   2. SECURITY DEFINER dipertahankan (trigger harus bisa
--      membaca creator_services milik user lain).
--   3. Fungsi ini HANYA dipanggil oleh trigger, bukan oleh
--      application code secara langsung.
-- ============================================================
CREATE OR REPLACE FUNCTION validate_creator_publish()
RETURNS trigger AS $$
BEGIN
    -- Hanya validate jika is_published BERUBAH
    IF NEW.is_published IS DISTINCT FROM OLD.is_published THEN
        -- Jika baru di-publish, cek ada minimal 1 active service
        IF NEW.is_published = true THEN
            IF NOT EXISTS (
                SELECT 1 FROM creator_services
                WHERE creator_id = NEW.id AND is_active = true
            ) THEN
                RAISE EXCEPTION 'Tambahkan minimal 1 jasa aktif sebelum mempublikasikan halaman Creator.';
            END IF;
        END IF;
    END IF;
    -- Jika is_published tidak berubah, skip validasi
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = '';

-- ============================================================
-- Langkah 4: Permission hardening (Constitution Art XI)
--
-- SECURITY DEFINER functions yang hanya dipanggil oleh trigger
-- TIDAK BOLEH punya EXECUTE grant untuk PUBLIC atau anon.
--
-- REVOKE: menghapus akses PUBLIC (jika sebelumnya ada grant).
-- GRANT EXECUTE: tidak dilakukan — function ini hanya dipanggil
--   oleh trigger internal, bukan oleh application code atau RPC.
--   Trigger tidak membutuhkan GRANT terpisah karena trigger
--   berjalan dalam konteks tabel, bukan sebagai function call.
-- ============================================================
REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM anon;

-- ============================================================
-- Langkah 5: Buat trigger baru (idempotent)
-- ============================================================
CREATE TRIGGER validate_publish_on_profile_update
    BEFORE UPDATE ON creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_creator_publish();

-- ============================================================
-- Langkah 6: Verifikasi trigger
--
-- Expected: 1 row, trigger_name = validate_publish_on_profile_update
-- ============================================================
SELECT
    t.tgname AS trigger_name,
    t.tgenabled AS is_enabled,
    pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'creator_profiles'
    AND t.tgisinternal = false;

-- ============================================================
-- Langkah 7: Verifikasi search_path pada SECURITY DEFINER function
--
-- HASIL YANG DIHARAPKAN:
--   prosecdef: true
--   proconfig: {search_path=""}
--
-- JIKA proconfig KOSONG atau tidak berisi search_path=""
-- → jalankan Migration 10 ulang atau set manual:
--   ALTER FUNCTION validate_creator_publish()
--     SET search_path = '';
-- ============================================================
SELECT
    p.proname AS function_name,
    p.prosecdef AS is_security_definer,
    p.proconfig AS config_settings,
    pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'validate_creator_publish'
    AND n.nspname = 'public';

-- ============================================================
-- Langkah 8: Verifikasi hak akses (Constitution Art XI)
--
-- SECURITY DEFINER functions seharusnya:
--   - EXECUTE: HANYA postgres (owner role)
--   - TIDAK ADA EXECUTE untuk PUBLIC atau anon
--
-- Jika ada baris dengan grantee = 'PUBLIC' atau 'anon' →
-- jalankan REVOKE berikut:
--   REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM PUBLIC;
--   REVOKE EXECUTE ON FUNCTION validate_creator_publish() FROM anon;
-- ============================================================
SELECT
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_routine_grants
WHERE routine_name = 'validate_creator_publish'
    AND routine_schema = 'public'
ORDER BY grantee;

-- ============================================================
-- Langkah 9: Verifikasi integritas relasi trigger-function
--
-- Memastikan trigger pada creator_profiles menggunakan function
-- yang benar dan dalam status aktif.
-- ============================================================
SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    t.tgenabled AS is_enabled,
    p.prosecdef AS is_security_definer,
    p.proconfig AS function_config
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'creator_profiles'
    AND t.tgisinternal = false;

-- ============================================================
-- ROLLBACK (jika perlu mengembalikan ke keadaan sebelumnya)
--
-- ⚠ PENTING: Rollback hanya menghapus trigger dan function baru.
--    Trigger lama TIDAK bisa di-restore otomatis — harus dibuat
--    ulang berdasarkan hasil Langkah 1 yang dijalankan sebelum
--    migrasi ini.
-- ============================================================
-- DROP TRIGGER IF EXISTS validate_publish_on_profile_update ON creator_profiles;
-- DROP FUNCTION IF EXISTS validate_creator_publish();

-- ============================================================
-- CATATAN PENTING UNTUK RUNNING:
--
-- 1. Jalankan Langkah 1 dulu untuk lihat trigger yang ada.
--    Catat nama trigger lama (jika ada) untuk rollback.
-- 2. Jalankan Langkah 2-5 untuk drop trigger lama + buat baru.
--    Langkah 2 bersifat idempotent (drop semua nama umum).
-- 3. Jalankan Langkah 6-9 untuk verifikasi.
-- 4. Jika Langkah 7 menunjukkan proconfig KOSONG →
--    jalankan: ALTER FUNCTION validate_creator_publish()
--      SET search_path = '';
-- 5. Jika Langkah 8 menunjukkan anon/ PUBLIC punya EXECUTE →
--    jalankan REVOKE di Langkah 4.
-- 6. Jika semua verifikasi PASS → migrasi selesai.
--
-- Pada Supabase, jalankan melalui SQL Editor di Dashboard.
-- Pastikan ada backup database sebelum menjalankan migrasi.
-- ============================================================
