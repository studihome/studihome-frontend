-- Applied to Supabase production as:
-- 20260906142509_convert_more_admin_rpcs_to_security_invoker
-- Adds admin to creator_likes DELETE RLS and converts two RPCs to
-- SECURITY INVOKER so RLS remains an independent enforcement layer.

drop policy creator_likes_own_delete on public.creator_likes;

create policy creator_likes_delete_own_or_admin
on public.creator_likes
for delete
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin())
);

alter function public.admin_delete_creator_like(uuid) security invoker;
alter function public.admin_review_creator(uuid, text, text) security invoker;
