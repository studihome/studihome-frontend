-- Applied to Supabase production as:
-- 20260906144934_convert_creator_self_service_rpcs_to_security_invoker
-- Converts Creator self-service RPCs to caller privileges after baseline and
-- post-change rollback tests verified identical behavior.

alter function public.change_creator_username_once(text) security invoker;
alter function public.change_creator_username_for_profile(uuid, text) security invoker;
alter function public.submit_creator_for_review() security invoker;
