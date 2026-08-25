-- ============================================================
-- MIGRASI 12: Add hero_promo_modules JSONB to site_settings
-- ============================================================
-- MASALAH: Hero promo modules disimpan di localStorage (per-device).
--          Mobile dan device lain tidak punya data yang sama.
--
-- SOLUSI:  Tambah kolom JSONB hero_promo_modules ke site_settings
--          agar semua device bisa akses module yang sama.
-- ============================================================

-- Langkah 1: Cek apakah kolom sudah ada
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name = 'hero_promo_modules';

-- Langkah 2: Tambah kolom JSONB dengan default array kosong
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS hero_promo_modules JSONB DEFAULT '[]'::jsonb;

-- Langkah 3: Set default value untuk baris yang sudah ada
UPDATE site_settings
SET hero_promo_modules = '[]'::jsonb
WHERE hero_promo_modules IS NULL;

-- Langkah 4: Verifikasi
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'site_settings'
  AND column_name = 'hero_promo_modules';
-- Expected: data_type = 'jsonb', column_default = '[]'::jsonb, is_nullable = 'YES'
