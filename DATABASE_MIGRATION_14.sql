-- ============================================================
-- STUDIHOME MIGRATION 14: Social Proof Toggle via Orders
-- ============================================================
-- Platform: Supabase SQL Editor
-- Depends on: M13 (social_proof_items table)
--
-- orders.id is UUID, so order_id must be UUID (not bigint).
-- Idempotent: safe to re-run even if partially executed.
--
-- Changes:
--   1. Add order_id column as UUID (FK to orders.id)
--   2. Add UNIQUE constraint on order_id
--   3. Drop seed data (order_id IS NULL)
--   4. Add indexes for fast lookups
-- ============================================================

-- Step 1: Ensure order_id column exists as UUID
--   If M14 partially ran before (bigint), drop and recreate.
DO $block$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'social_proof_items'
          AND column_name = 'order_id'
    ) THEN
        -- Column exists. Check if type is already uuid.
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'social_proof_items'
              AND column_name = 'order_id'
              AND data_type = 'uuid'
        ) THEN
            -- Wrong type (likely bigint from partial M14 run). Drop and recreate.
            ALTER TABLE social_proof_items DROP COLUMN IF EXISTS order_id;
            ALTER TABLE social_proof_items ADD COLUMN order_id uuid;
        END IF;
    ELSE
        -- Column does not exist. Create it.
        ALTER TABLE social_proof_items ADD COLUMN order_id uuid;
    END IF;
END $block$;

-- Step 2: Add foreign key (idempotent)
DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'social_proof_items_order_id_fkey'
    ) THEN
        ALTER TABLE social_proof_items
            ADD CONSTRAINT social_proof_items_order_id_fkey
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
END $block$;

-- Step 3: Add UNIQUE constraint on order_id (idempotent)
DO $block$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'social_proof_items_order_id_unique'
    ) THEN
        ALTER TABLE social_proof_items
            ADD CONSTRAINT social_proof_items_order_id_unique
            UNIQUE (order_id);
    END IF;
END $block$;

-- Step 4: Make legacy columns nullable
ALTER TABLE social_proof_items ALTER COLUMN name DROP NOT NULL;
ALTER TABLE social_proof_items ALTER COLUMN brand_name DROP NOT NULL;
ALTER TABLE social_proof_items ALTER COLUMN package_name DROP NOT NULL;

-- Step 5: Drop fake seed data
DO $block$
BEGIN
    DELETE FROM social_proof_items WHERE order_id IS NULL;
END $block$;

-- Step 6: Index for fast lookups (drop and recreate to handle type change)
DROP INDEX IF EXISTS idx_social_proof_items_order_id;
CREATE INDEX idx_social_proof_items_order_id
    ON social_proof_items(order_id);

-- Step 7: Index for active widget lookups
CREATE INDEX IF NOT EXISTS idx_social_proof_items_active
    ON social_proof_items(is_active) WHERE is_active = true;

-- Step 8: Verification
SELECT 'M14_column_type' AS check_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'social_proof_items'
  AND column_name = 'order_id';

SELECT 'M14_fk' AS check_name, conname
FROM pg_constraint
WHERE conname = 'social_proof_items_order_id_fkey';

SELECT 'M14_unique' AS check_name, conname
FROM pg_constraint
WHERE conname = 'social_proof_items_order_id_unique';

SELECT 'M14_seed_dropped' AS check_name,
    COUNT(*) AS remaining_fake_rows
FROM social_proof_items
WHERE order_id IS NULL;

SELECT 'M14_total' AS check_name,
    COUNT(*) AS total_rows,
    COUNT(order_id) AS linked_rows
FROM social_proof_items;
