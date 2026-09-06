-- Applied to Supabase production as:
-- 20260906141936_convert_safe_admin_rpcs_to_security_invoker
-- Initial candidate conversion. A subsequent production regression test found
-- three functions depended on intentionally absent direct DML table grants.
-- The next migration restores those three to SECURITY DEFINER.

alter function public.admin_set_creator_verified(uuid, boolean) security invoker;
alter function public.admin_set_creator_portfolio_active(uuid, boolean) security invoker;
alter function public.admin_set_creator_rating_visibility(uuid, boolean) security invoker;
alter function public.admin_set_creator_external_rating_visibility(uuid, boolean) security invoker;
alter function public.admin_add_creator_external_rating(uuid, text, integer, text, text) security invoker;
alter function public.admin_add_creator_like_adjustment(uuid, integer, text) security invoker;
