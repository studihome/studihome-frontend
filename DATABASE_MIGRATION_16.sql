-- ============================================================
-- STUDIHOME MIGRATION 16: Social Proof Public VIEW
-- ============================================================
-- Platform: Supabase SQL Editor
-- Depends on: orders, products, profiles tables
--
-- PURPOSE:
--   The social-proof-widget.js runs as anonymous on the homepage.
--   The orders table has RLS that blocks anonymous reads.
--   This VIEW runs as postgres (owner) and bypasses RLS,
--   exposing only: member_name, product_title, created_at.
--   The widget queries this VIEW instead of orders directly.
--
-- SECURITY:
--   - View is read-only (SELECT only)
--   - Only exposes: name, product title, created_at
--   - Does NOT expose: user_id, email, phone, amount, payment_status
--   - Anonymous gets SELECT only; no INSERT/UPDATE/DELETE
-- ============================================================


-- Step 1: Create the VIEW (idempotent — drop and recreate)
DROP VIEW IF EXISTS v_social_proof_recent;

CREATE VIEW v_social_proof_recent AS
SELECT
    p.name AS member_name,
    pr.title AS product_title,
    o.created_at
FROM orders o
JOIN products pr ON pr.id = o.product_id
JOIN profiles p ON p.id = o.user_id
WHERE o.payment_status IN ('PAID', 'CONFIRMED')
ORDER BY o.created_at DESC
LIMIT 10;

COMMENT ON VIEW v_social_proof_recent IS
    'Public view for social-proof-widget: 10 most recent paid orders with member name + product title (Migration 16)';


-- Step 2: Grant SELECT to anonymous (public read)
GRANT SELECT ON v_social_proof_recent TO anon;
GRANT SELECT ON v_social_proof_recent TO authenticated;


-- Step 3: Verify
SELECT 'M16_view_created' AS check_name,
    viewname, definition
FROM pg_views
WHERE viewname = 'v_social_proof_recent';

SELECT 'M16_grants' AS check_name,
    grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'v_social_proof_recent'
  AND table_schema = 'public'
ORDER BY grantee;

SELECT 'M16_sample_data' AS check_name,
    member_name, product_title, created_at
FROM v_social_proof_recent
LIMIT 3;
