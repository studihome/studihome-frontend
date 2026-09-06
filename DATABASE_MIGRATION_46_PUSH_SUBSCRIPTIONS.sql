-- ============================================================
-- STUDIHOME MIGRATION 46: Push subscriptions + audit log
-- ============================================================
-- STATUS: SOURCE-HARDENED, DO NOT APPLY UNTIL STAGING/INTEROP TESTS PASS
-- Purpose:
--   1. Persist authenticated users' own Web Push subscriptions.
--   2. Provide a service-side audit log for notification delivery.
--
-- Security model:
--   - anon: no table access.
--   - authenticated: least-privilege CRUD on OWN push_subscriptions only.
--   - service_role/secret backend: bypasses RLS for delivery worker use.
--   - push_notification_log: authenticated admins may READ via RLS;
--     writes remain backend/service-only.
--   - No SECURITY DEFINER delivery RPC is created here. Delivery belongs
--     in the authenticated/authorized Edge Function, reducing DB API surface.
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- 1. Push subscriptions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint    text NOT NULL,
    p256dh      text NOT NULL,
    auth_key    text NOT NULL,
    user_agent  text NOT NULL DEFAULT '',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint),
    CONSTRAINT push_subscriptions_endpoint_length
        CHECK (char_length(endpoint) BETWEEN 16 AND 4096),
    CONSTRAINT push_subscriptions_endpoint_https
        CHECK (endpoint ~ '^https://'),
    CONSTRAINT push_subscriptions_p256dh_length
        CHECK (char_length(p256dh) BETWEEN 16 AND 512),
    CONSTRAINT push_subscriptions_auth_key_length
        CHECK (char_length(auth_key) BETWEEN 8 AND 256),
    CONSTRAINT push_subscriptions_user_agent_length
        CHECK (char_length(user_agent) <= 1024)
);

COMMENT ON TABLE public.push_subscriptions IS
    'Web Push subscriptions owned by authenticated users. Delivery reads are backend/service-only.';
COMMENT ON COLUMN public.push_subscriptions.endpoint IS
    'Push-service HTTPS endpoint. Treat as sensitive capability metadata.';
COMMENT ON COLUMN public.push_subscriptions.p256dh IS
    'Web Push subscription p256dh public key (URL-safe base64).';
COMMENT ON COLUMN public.push_subscriptions.auth_key IS
    'Web Push subscription auth secret (URL-safe base64).';

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Explicit Data API ACLs. RLS still decides which rows are accessible.
REVOKE ALL ON TABLE public.push_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.push_subscriptions TO authenticated;

-- Identity sequence privilege is needed for INSERT through PostgREST.
GRANT USAGE, SELECT
    ON SEQUENCE public.push_subscriptions_id_seq TO authenticated;

DROP POLICY IF EXISTS push_subscriptions_user_manage
    ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_service_read
    ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_select_own
    ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_insert_own
    ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_update_own
    ON public.push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_delete_own
    ON public.push_subscriptions;

CREATE POLICY push_subscriptions_select_own
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY push_subscriptions_insert_own
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY push_subscriptions_update_own
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY push_subscriptions_delete_own
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
    ON public.push_subscriptions (user_id)
    WHERE is_active = true;

-- ----------------------------------------------------------------
-- 2. Push notification audit log
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_notification_log (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title           text NOT NULL,
    body            text NOT NULL,
    url             text NOT NULL DEFAULT '/',
    sent_by         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    recipient_count integer NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT push_notification_log_title_length
        CHECK (char_length(title) BETWEEN 1 AND 160),
    CONSTRAINT push_notification_log_body_length
        CHECK (char_length(body) BETWEEN 1 AND 2000),
    CONSTRAINT push_notification_log_url_length
        CHECK (char_length(url) BETWEEN 1 AND 2048),
    CONSTRAINT push_notification_log_recipient_count_nonnegative
        CHECK (recipient_count >= 0)
);

COMMENT ON TABLE public.push_notification_log IS
    'Backend-written Web Push delivery audit log; authenticated admins may read.';

ALTER TABLE public.push_notification_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.push_notification_log FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.push_notification_log TO authenticated;

DROP POLICY IF EXISTS push_notification_log_admin
    ON public.push_notification_log;
DROP POLICY IF EXISTS push_notification_log_admin_read
    ON public.push_notification_log;

CREATE POLICY push_notification_log_admin_read
ON public.push_notification_log
FOR SELECT
TO authenticated
USING ((SELECT public.is_admin()));

-- ----------------------------------------------------------------
-- 3. Retire the unsafe/unused DB delivery helper if present
-- ----------------------------------------------------------------
-- Delivery is performed by the Edge Function. Keeping a SECURITY DEFINER
-- notification RPC in the exposed public schema increases privilege surface.
DROP FUNCTION IF EXISTS public.trigger_push_notification(text, text, text, uuid[]);

-- ----------------------------------------------------------------
-- 4. Verification: fail the migration transaction if invariants are wrong
-- ----------------------------------------------------------------
DO $verify$
DECLARE
    v_sub_rls boolean;
    v_log_rls boolean;
    v_anon_sub_acl boolean;
    v_auth_sub_insert boolean;
    v_auth_log_select boolean;
BEGIN
    SELECT c.relrowsecurity
      INTO v_sub_rls
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'push_subscriptions';

    SELECT c.relrowsecurity
      INTO v_log_rls
      FROM pg_catalog.pg_class c
      JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname = 'push_notification_log';

    SELECT has_table_privilege('anon', 'public.push_subscriptions', 'SELECT')
        OR has_table_privilege('anon', 'public.push_subscriptions', 'INSERT')
        OR has_table_privilege('anon', 'public.push_subscriptions', 'UPDATE')
        OR has_table_privilege('anon', 'public.push_subscriptions', 'DELETE')
      INTO v_anon_sub_acl;

    SELECT has_table_privilege(
        'authenticated', 'public.push_subscriptions', 'INSERT'
    ) INTO v_auth_sub_insert;

    SELECT has_table_privilege(
        'authenticated', 'public.push_notification_log', 'SELECT'
    ) INTO v_auth_log_select;

    IF v_sub_rls IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'M46 verification failed: push_subscriptions RLS is not enabled';
    END IF;

    IF v_log_rls IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'M46 verification failed: push_notification_log RLS is not enabled';
    END IF;

    IF v_anon_sub_acl IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'M46 verification failed: anon has push_subscriptions table privileges';
    END IF;

    IF v_auth_sub_insert IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'M46 verification failed: authenticated INSERT grant missing';
    END IF;

    IF v_auth_log_select IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'M46 verification failed: authenticated log SELECT grant missing';
    END IF;

    IF to_regprocedure(
        'public.trigger_push_notification(text,text,text,uuid[])'
    ) IS NOT NULL THEN
        RAISE EXCEPTION 'M46 verification failed: unsafe DB delivery helper still exists';
    END IF;
END;
$verify$;

COMMIT;

-- Manual post-apply verification must also include:
--   1. negative anon access test;
--   2. authenticated cross-user SELECT/UPDATE/DELETE denial tests;
--   3. authenticated own-row CRUD test;
--   4. admin/non-admin audit-log read tests;
--   5. Supabase Security Advisor rerun;
--   6. real standards-compliant Edge Function Web Push interoperability.
