-- ============================================================
-- MIGRASI 10: Fix creator_profiles trigger
-- ============================================================
-- MASALAH: Trigger validation berjalan di SETIAP UPDATE,
-- termasuk saat user hanya edit display_name/bio.
-- Jika is_published=true tapi tidak ada active service → 400 error.
--
-- SOLUSI: Buat trigger baru yang HANYA validate saat
-- is_published BERUBAH (bukan di setiap update).
-- ============================================================

-- Langkah 1: Lihat trigger yang ada
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

-- Langkah 2: Hapus trigger lama yang terlalu agresif
-- Ganti 'nama_trigger_lama' dengan nama dari hasil Langkah 1
-- DROP TRIGGER IF EXISTS nama_trigger_lama ON creator_profiles;

-- Langkah 3: Buat trigger baru yang lebih cerdas
-- Hanya validate saat is_published BERUBAH
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Langkah 4: Buat trigger baru
DROP TRIGGER IF EXISTS validate_publish_on_profile_update ON creator_profiles;
CREATE TRIGGER validate_publish_on_profile_update
    BEFORE UPDATE ON creator_profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_creator_publish();

-- Langkah 5: Verifikasi
SELECT
    t.tgname AS trigger_name,
    pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'creator_profiles'
    AND t.tgisinternal = false;
