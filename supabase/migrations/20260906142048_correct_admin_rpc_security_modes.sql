-- Applied to Supabase production as:
-- 20260906142048_correct_admin_rpc_security_modes
-- Restores SECURITY DEFINER only where direct authenticated DML grants are
-- intentionally absent. Three RLS-compatible admin RPCs remain INVOKER.

alter function public.admin_set_creator_external_rating_visibility(uuid, boolean)
  security definer;
alter function public.admin_add_creator_external_rating(uuid, text, integer, text, text)
  security definer;
alter function public.admin_add_creator_like_adjustment(uuid, integer, text)
  security definer;
