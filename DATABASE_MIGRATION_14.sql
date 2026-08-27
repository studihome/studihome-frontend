-- ============================================================
-- STUDIHOME — MIGRATION 14: Social Proof Toggle via Orders
-- ============================================================
-- Generated:  27 Aug 2026
-- Purpose:    Link social_proof_items to real orders for checkbox toggle
-- Platform:   Supabase SQL Editor
-- Dependency: M13 (social_proof_items table must exist)
--
-- CHANGELOG vs M13:
--   - Adds order_id FK to orders(id)
--   - Drops fake seed data (24 fiktif items)
--   - Makes name/brand_name/package_name nullable (derived from order join)
--   - Adds UNIQUE constraint on order_id
-- ============================================================


-- M14 — Langkah 1: Add order_id column (nullable first)
ALTER TABLE social_proof_items
    ADD COLUMN IF NOT EXISTS order_id bigint;

-- M14 — Langkah 2: Add foreign key to orders
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'social_proof_items_order_id_fkey'
    ) THEN
        ALTER TABLE social_proof_items
            ADD CONSTRAINT social_proof_items_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
        RAISE NOTICE 'M14: FK to orders created';
    ELSE
        RAISE NOTICE 'M14: FK already exists — skip';
    END IF;
END $$;

-- M14 — Langkah 3: Add UNIQUE constraint on order_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'social_proof_items_order_id_unique'
    ) THEN
        ALTER TABLE social_proof_items
            ADD CONSTRAINT social_proof_items_order_id_unique
            UNIQUE (order_id);
        RAISE NOTICE 'M14: UNIQUE(order_id) created';
    ELSE
        RAISE NOTICE 'M14: UNIQUE(order_id) already exists — skip';
    END IF;
END $$;

-- M14 — Langkah 4: Make legacy columns nullable (data comes from order join now)
ALTER TABLE social_proof_items ALTER COLUMN name DROP NOT NULL;
ALTER TABLE social_proof_items ALTER COLUMN brand_name DROP NOT NULL;
ALTER TABLE social_proof_items ALTER COLUMN package_name DROP NOT NULL;

-- M14 — Langkah 5: Drop fake seed data + log
DO $$
BEGIN
    DELETE FROM social_proof_items WHERE order_id IS NULL;
    RAISE NOTICE 'M14: Dropped seed data (order_id IS NULL)';
END $$;

-- M14 — Langkah 6: Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_social_proof_items_order_id
    ON social_proof_items(order_id);

-- M14 — Langkah 7: Add index for active lookups (widget query)
CREATE INDEX IF NOT EXISTS idx_social_proof_items_active
    ON social_proof_items(is_active) WHERE is_active = true;

-- M14 — Langkah 8: Verification
SELECT 'M14_fk' AS check_name,
    c.conname, c.contype
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
WHERE cl.relname = 'social_proof_items'
    AND c.conname = 'social_proof_items_order_id_fkey';

SELECT 'M14_unique' AS check_name,
    c.conname
FROM pg_constraint c
JOIN pg_class cl ON c.conrelid = cl.oid
WHERE cl.relname = 'social_proof_items'
    AND c.conname = 'social_proof_items_order_id_unique';

SELECT 'M14_seed_dropped' AS check_name,
    COUNT(*) AS remaining_fake_rows
FROM social_proof_items
WHERE order_id IS NULL;

SELECT 'M14_total' AS check_name,
    COUNT(*) AS total_rows,
    COUNT(order_id) AS linked_rows
FROM social_proof_items;
