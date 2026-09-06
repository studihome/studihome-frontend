-- ============================================================
-- STUDIHOME MIGRATION 46: Push Subscriptions for PWA Notifications
-- ============================================================
-- Platform: Supabase SQL Editor
-- Purpose: Store web push subscriptions and notification triggers
-- ============================================================

-- Step 1: Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint    text NOT NULL,
    p256dh      text NOT NULL,
    auth_key    text NOT NULL,
    user_agent  text DEFAULT '',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(endpoint)
);

COMMENT ON TABLE push_subscriptions IS 'PWA push notification subscriptions — Migration 46';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.p256dh IS 'Push subscription p256dh key (URL-safe base64)';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Push subscription auth key (URL-safe base64)';

-- Step 2: Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Step 3: Policies
-- Users can manage their own subscriptions
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_user_manage') THEN
        CREATE POLICY push_subscriptions_user_manage ON push_subscriptions
            FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Service role can read all active subscriptions (for Edge Function)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_subscriptions' AND policyname='push_subscriptions_service_read') THEN
        CREATE POLICY push_subscriptions_service_read ON push_subscriptions
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

-- Step 4: Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Step 5: Create notification log table
CREATE TABLE IF NOT EXISTS push_notification_log (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       text NOT NULL,
    body        text NOT NULL,
    url         text DEFAULT '/',
    sent_by     uuid REFERENCES auth.users(id),
    recipient_count integer DEFAULT 0,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE push_notification_log IS 'Push notification audit log — Migration 46';

ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;

-- Only admin/staff can read notification log
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='push_notification_log' AND policyname='push_notification_log_admin') THEN
        CREATE POLICY push_notification_log_admin ON push_notification_log
            FOR ALL USING (public.is_admin());
    END IF;
END $$;

-- Step 6: Create helper function to send push notifications
CREATE OR REPLACE FUNCTION public.trigger_push_notification(
    p_title text,
    p_body text,
    p_url text DEFAULT '/',
    p_user_ids uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_count integer := 0;
    v_sender uuid;
BEGIN
    -- Only authenticated users (admin/staff) can trigger
    v_sender := (SELECT auth.uid());
    IF v_sender IS NULL THEN
        RAISE EXCEPTION 'Akses ditolak.' USING errcode = '42501';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses Admin diperlukan.' USING errcode = '42501';
    END IF;

    -- Count active subscriptions
    IF p_user_ids IS NULL THEN
        SELECT count(*) INTO v_count FROM push_subscriptions WHERE is_active = true;
    ELSE
        SELECT count(*) INTO v_count FROM push_subscriptions
        WHERE is_active = true AND user_id = ANY(p_user_ids);
    END IF;

    -- Log the notification
    INSERT INTO push_notification_log (title, body, url, sent_by, recipient_count)
    VALUES (p_title, p_body, p_url, v_sender, v_count);

    RETURN jsonb_build_object(
        'success', true,
        'recipient_count', v_count,
        'notification_id', (SELECT id FROM push_notification_log ORDER BY id DESC LIMIT 1)
    );
END;
$function$;

-- Step 7: Verification
SELECT 'M46_push_subscriptions' AS check_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='push_subscriptions') AS exists;

SELECT 'M46_push_notification_log' AS check_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='push_notification_log') AS exists;

SELECT 'M46_rls_push_subscriptions' AS check_name,
    relrowsecurity AS rls_enabled
FROM pg_class WHERE relname = 'push_subscriptions';
