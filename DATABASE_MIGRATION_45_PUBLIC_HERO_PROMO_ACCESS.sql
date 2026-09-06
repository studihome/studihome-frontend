-- ============================================================
-- STUDIHOME — MIGRATION 45: Public Hero-Promo (PENAWARAN TERBATAS)
-- ============================================================
-- Generated: 2026-09-06
-- Platform: Supabase SQL Editor
-- Purpose:
--   The homepage hero-promo module ("PENAWARAN TERBATAS!!") must be
--   publicly viewable — including logged-out visitors AND logged-in
--   non-admin members — without login or a paid entitlement.
--
--   Root cause (audited):
--     site_settings carries the hero-promo content (dedicated column
--     hero_promo_modules and under_construction.heroPromoModules), but
--     its only SELECT policy is `admin_manage_site_settings`
--     (FOR ALL TO authenticated USING is_admin()). Members and any
--     future non-admin role therefore cannot read the row, so the
--     module player fell back to the empty state ("Materi Belum
--     Tersedia") even though content existed.
--
--   Fix (best practice, additive, no regressions):
--     1. Narrow public SELECT policy on site_settings for anon +
--        authenticated (row 1 is marketing config — the SAME data anon
--        already reads today; write access stays admin/staff-gated via
--        is_admin()). Policy is idempotent.
--     2. Backfill the dedicated hero_promo_modules column from
--        under_construction.heroPromoModules when the column is empty,
--        so both storage locations agree (heals the split-brain state).
--     3. Hardened SECURITY DEFINER RPC get_public_hero_promo_modules()
--        — the auditable public contract for hero-promo content. It is
--        read-only (STABLE, SELECT only), search_path='', EXECUTE is
--        revoked from PUBLIC and granted ONLY to anon/authenticated/
--        service_role. Returns the module array (column first, then
--        under_construction fallback, then '[]').
-- ============================================================


-- ============================================================
-- STEP 1: Public SELECT policy on site_settings (idempotent)
--   Row id=1 is public marketing content (hero copy, CTAs, QR slots,
--   under-construction banner, hero-promo modules) already served to
--   anonymous visitors. Granting the same read to authenticated
--   members exposes nothing new while letting signed-in members see
--   the promo section exactly like logged-out visitors.
--   Writes remain gated by `admin_manage_site_settings` (is_admin(),
--   which includes 'staff' since M44).
-- ============================================================
DO $public_read$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'public_read_site_settings'
  ) THEN
    CREATE POLICY public_read_site_settings
      ON public.site_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
    RAISE NOTICE 'M45: public_read_site_settings policy created.';
  ELSE
    RAISE NOTICE 'M45: public_read_site_settings policy already exists — skip.';
  END IF;
END $public_read$;


-- ============================================================
-- STEP 2: Heal split-brain hero-promo storage (safe backfill)
--   Only fills the dedicated column when it is empty/null AND
--   under_construction carries a non-empty array. Never overwrites
--   existing column data.
-- ============================================================
UPDATE public.site_settings
SET hero_promo_modules = (under_construction -> 'heroPromoModules')
WHERE id = 1
  AND under_construction IS NOT NULL
  AND under_construction ? 'heroPromoModules'
  AND jsonb_typeof(under_construction -> 'heroPromoModules') = 'array'
  AND jsonb_array_length(under_construction -> 'heroPromoModules') > 0
  AND (
    hero_promo_modules IS NULL
    OR jsonb_typeof(hero_promo_modules) <> 'array'
    OR jsonb_array_length(hero_promo_modules) = 0
  );


-- ============================================================
-- STEP 3: Hardened public RPC get_public_hero_promo_modules()
--   Returns JSONB array of hero-promo modules for EVERY role.
--   SECURITY DEFINER: runs as postgres (owner) so it is independent of
--   future site_settings RLS tightening, yet returns ONLY the public
--   module array — no credentials, no settings row, nothing else.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_public_hero_promo_modules()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT CASE
    WHEN jsonb_typeof(s.hero_promo_modules) = 'array'
      AND jsonb_array_length(s.hero_promo_modules) > 0
      THEN s.hero_promo_modules
    WHEN jsonb_typeof(s.under_construction -> 'heroPromoModules') = 'array'
      AND jsonb_array_length(s.under_construction -> 'heroPromoModules') > 0
      THEN s.under_construction -> 'heroPromoModules'
    ELSE '[]'::jsonb
  END
  FROM public.site_settings s
  WHERE s.id = 1
$function$;

REVOKE ALL ON FUNCTION public.get_public_hero_promo_modules() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_hero_promo_modules() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_hero_promo_modules() TO anon, authenticated, service_role;


-- ============================================================
-- VERIFICATION (safe to re-run)
-- ============================================================
SELECT 'M45_policy' AS check_name,
       policyname,
       cmd AS command,
       roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'site_settings'
ORDER BY policyname;

SELECT 'M45_column_backfill' AS check_name,
       jsonb_typeof(hero_promo_modules) AS column_type,
       jsonb_array_length(hero_promo_modules) AS module_count
FROM public.site_settings
WHERE id = 1;

SELECT 'M45_rpc' AS check_name,
       p.proname AS function_name,
       p.prosecdef AS is_security_definer,
       p.provolatile AS volatility,
       p.proconfig AS config_settings
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_public_hero_promo_modules'
  AND n.nspname = 'public';

SELECT 'M45_rpc_grants' AS check_name,
       grantee,
       privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'get_public_hero_promo_modules'
  AND routine_schema = 'public'
ORDER BY grantee;

-- Live public check: returns the module array as anonymous users see it.
SELECT 'M45_rpc_anon_value' AS check_name,
       public.get_public_hero_promo_modules() AS modules;


-- ============================================================
-- ROLLBACK (uncomment only if reverting this migration)
-- ============================================================
-- DROP POLICY IF EXISTS public_read_site_settings ON public.site_settings;
-- REVOKE ALL ON FUNCTION public.get_public_hero_promo_modules() FROM anon, authenticated, service_role;
-- DROP FUNCTION IF EXISTS public.get_public_hero_promo_modules();
