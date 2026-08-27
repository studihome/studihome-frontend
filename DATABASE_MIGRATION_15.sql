-- ============================================================
-- STUDIHOME MIGRATION 15: Restore Social Proof Seed Data
-- ============================================================
-- Platform: Supabase SQL Editor
-- Depends on: M13 (social_proof_items table) + M14 (order_id column)
--
-- Problem: M14 Step 5 ran DELETE FROM social_proof_items WHERE order_id IS NULL,
-- which removed all 24 seed rows. This migration re-inserts them.
-- ============================================================

-- Step 1: Re-insert 24 seed items (idempotent — only if table is empty)
DO $block$
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
        RAISE NOTICE 'M15: 24 seed items restored';
    ELSE
        RAISE NOTICE 'M15: Table already has data (% rows) — skipping insert', (SELECT count(*) FROM social_proof_items);
    END IF;
END $block$;

-- Step 2: Verify
DO $block$
DECLARE
    v_total  bigint;
    v_active bigint;
BEGIN
    SELECT count(*) INTO v_total FROM social_proof_items;
    SELECT count(*) INTO v_active FROM social_proof_items WHERE is_active = true;
    RAISE NOTICE 'M15 VERIFICATION:';
    RAISE NOTICE '  Total items:  %', v_total;
    RAISE NOTICE '  Active items: %', v_active;
END $block$;
