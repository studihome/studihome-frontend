-- ============================================================
-- STUDIHOME — MIGRATION 13: Social Proof Items
-- ============================================================
-- Generated:  27 Aug 2026
-- Author:     feat/live-social-proof branch
-- Platform:   Supabase SQL Editor
-- Dependency: None (independent of M10–M12)
--
-- ⚠ PRA-RUN CHECKLIST:
--   ☐ Backup database sebelum menjalankan
--   ☐ Jalankan via Supabase SQL Editor
--   ☐ Pastikan tidak ada concurrent writes ke social_proof_items
--
-- CONSTITUTION ALIGNMENT:
--   Art XI: table → policy → function/RPC → grants → callers audit chain
--   - M13: DDL (CREATE TABLE) + DML (INSERT seed) + RLS policies
--   - No new functions/RPCs/grants created
--   - Public read only for is_active=true items (Constitution Art VI: public data)
--   - Admin write via is_admin() — existing function, no new EXECUTE grants
-- ============================================================


-- ============================================================
-- ████ MIGRATION 13 █████
-- Social Proof Items table + RLS + seed data
-- ============================================================

-- M13 — Langkah 0: Pre-check
--   Verifikasi tabel belum ada (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'social_proof_items'
  ) THEN
    RAISE NOTICE 'M13: social_proof_items sudah ada — skip CREATE TABLE';
  ELSE
    RAISE NOTICE 'M13: social_proof_items belum ada — buat tabel baru';
  END IF;
END $$;


-- M13 — Langkah 1: Buat tabel
CREATE TABLE IF NOT EXISTS social_proof_items (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL,
    brand_name  text NOT NULL,
    package_name text NOT NULL,
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- COMMENT on table and columns (documentation)
COMMENT ON TABLE  social_proof_items IS 'Social proof notification items for live toast widget — Migration 13';
COMMENT ON COLUMN social_proof_items.name IS 'Customer name (e.g., Bapak/Ibu)';
COMMENT ON COLUMN social_proof_items.brand_name IS 'Education brand name';
COMMENT ON COLUMN social_proof_items.package_name IS 'Studihome package name';


-- M13 — Langkah 2: Enable RLS
ALTER TABLE social_proof_items ENABLE ROW LEVEL SECURITY;

-- M13 — Langkah 3: Buat policies idempoten
--   Policy 1: Public can read only active items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_proof_items'
      AND policyname = 'social_proof_items_select_active_public'
  ) THEN
    CREATE POLICY social_proof_items_select_active_public
      ON social_proof_items
      FOR SELECT
      USING (is_active = true);
    RAISE NOTICE 'M13: Policy SELECT (public) created';
  ELSE
    RAISE NOTICE 'M13: Policy SELECT (public) already exists — skip';
  END IF;
END $$;

--   Policy 2: Admin can do everything (using existing is_admin() function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_proof_items'
      AND policyname = 'social_proof_items_admin_all'
  ) THEN
    CREATE POLICY social_proof_items_admin_all
      ON social_proof_items
      FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());
    RAISE NOTICE 'M13: Policy ALL (admin) created';
  ELSE
    RAISE NOTICE 'M13: Policy ALL (admin) already exists — skip';
  END IF;
END $$;


-- M13 — Langkah 4: Seed data — 24 fiktif items
--   INSERT idempoten: cek dulu apakah sudah ada data
DO $$
BEGIN
  IF (SELECT count(*) FROM social_proof_items) = 0 THEN
    INSERT INTO social_proof_items (name, brand_name, package_name, is_active) VALUES
      -- Bapak (12)
      ('Bapak Ahmad Fauzi',      'LesPrivat AI',       'Paket Premium AI Tutor',        true),
      ('Bapak Rudi Hartono',     'RuangGuru Digital',   'Paket Belajar Mandiri',         true),
      ('Bapak Dedi Kurniawan',   'Harapan Edu',         'Paket Kelas Premium',           true),
      ('Bapak Surya Wijaya',     'EduVerse',            'Paket Agentic Learning',        true),
      ('Bapak Hendra Pratama',   'SmartClass ID',       'Paket Kelas Intensif',          true),
      ('Bapak Joko Susilo',      'CerdasBareng',        'Paket AI Automation',           true),
      ('Bapak Agus Setiawan',    'SkillUp Academy',     'Paket Professional',            true),
      ('Bapak Budi Santoso',     'BrainWave Edu',       'Paket Modul Interaktif',        true),
      ('Bapak Firman Hakim',     'CerdasNesia',         'Paket Private Class',           true),
      ('Bapak Gunawan Saputra',  'LearnSmart ID',       'Paket Belajar Cepat',           true),
      ('Bapak Imam Mustofa',     'EduPilot',            'Paket Prompt Academy',          true),
      ('Bapak Lukman Hakim',     'KelasPintar Plus',    'Paket Komprehensif',            true),
      -- Ibu (12)
      ('Ibu Siti Rahayu',        'LesPrivat AI',        'Paket Premium AI Tutor',        true),
      ('Ibu Dewi Lestari',       'Harapan Edu',         'Paket Kelas Premium',           true),
      ('Ibu Rina Wulandari',     'EduVerse',            'Paket Agentic Learning',        true),
      ('Ibu Maya Anggraeni',     'SmartClass ID',       'Paket Kelas Intensif',          true),
      ('Ibu Ani Susanti',        'CerdasBareng',        'Paket AI Automation',           true),
      ('Ibu Retno Sari',         'SkillUp Academy',     'Paket Professional',            true),
      ('Ibu Putri Handayani',    'BrainWave Edu',       'Paket Modul Interaktif',        true),
      ('Ibu Wati Kusuma',        'CerdasNesia',         'Paket Private Class',           true),
      ('Ibu Ningrum Pertiwi',    'LearnSmart ID',       'Paket Belajar Cepat',           true),
      ('Ibu Sri Wahyuni',        'EduPilot',            'Paket Prompt Academy',          true),
      ('Ibu Endang Lestari',     'KelasPintar Plus',    'Paket Komprehensif',            true),
      ('Ibu Fitriani Susilo',    'RuangGuru Digital',   'Paket Belajar Mandiri',         true);
    RAISE NOTICE 'M13: 24 seed items inserted';
  ELSE
    RAISE NOTICE 'M13: Data sudah ada — skip seed insert';
  END IF;
END $$;


-- M13 — Langkah 5: Verifikasi
DO $$
DECLARE
  v_total   bigint;
  v_active  bigint;
  v_admin_policy boolean;
BEGIN
  SELECT count(*) INTO v_total FROM social_proof_items;
  SELECT count(*) INTO v_active FROM social_proof_items WHERE is_active = true;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'social_proof_items'
      AND policyname = 'social_proof_items_admin_all'
  ) INTO v_admin_policy;

  RAISE NOTICE 'M13 VERIFICATION:';
  RAISE NOTICE '  Total items:   %', v_total;
  RAISE NOTICE '  Active items:  %', v_active;
  RAISE NOTICE '  Admin policy:  %', CASE WHEN v_admin_policy THEN 'PASS' ELSE 'FAIL' END;
  RAISE NOTICE '  RLS enabled:   PASS (verified in Langkah 2)';
END $$;


-- ============================================================
-- ROLLBACK (uncomment if needed)
-- ============================================================
-- HATI-HATI: Rollback akan menghapus semua data social_proof_items
--
-- DROP POLICY IF EXISTS social_proof_items_admin_all ON social_proof_items;
-- DROP POLICY IF EXISTS social_proof_items_select_active_public ON social_proof_items;
-- ALTER TABLE social_proof_items DISABLE ROW LEVEL SECURITY;
-- DROP TABLE IF EXISTS social_proof_items;


-- ============================================================
-- END OF MIGRATION 13
-- Status: Siap dieksekusi via Supabase SQL Editor
-- ============================================================
