begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter policy creator_profiles_authenticated_read on public.creator_profiles
  using (
    (is_published = true)
    or ((user_id = (select auth.uid())) and has_creator_workspace_access())
    or is_admin()
  );

alter policy creator_profiles_own_insert on public.creator_profiles
  with check (
    (user_id = (select auth.uid()))
    and has_premium_creator_access()
    and (is_verified = false)
  );

alter policy creator_profiles_own_select on public.creator_profiles
  using ((user_id = (select auth.uid())) and has_creator_workspace_access());

alter policy creator_profiles_own_update on public.creator_profiles
  using ((user_id = (select auth.uid())) and has_creator_workspace_access())
  with check ((user_id = (select auth.uid())) and has_creator_workspace_access());

commit;

