-- Applied to Supabase production as:
-- 20260906143452_convert_creator_read_helpers_to_security_invoker
-- Converts read-only Creator authorization helpers to SECURITY INVOKER after
-- pre/post behavior comparison for admin, premium Creator, and non-premium user.

alter function public.has_premium_creator_access() security invoker;
alter function public.is_creator_eligible() security invoker;
alter function public.has_creator_workspace_access() security invoker;
alter function public.can_publish_creator(uuid) security invoker;
