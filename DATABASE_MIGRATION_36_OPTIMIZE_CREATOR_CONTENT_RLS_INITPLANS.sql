begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter policy creator_category_authenticated_read on public.creator_category_members
  using (
    exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and (
          cp.is_published = true
          or ((cp.user_id = (select auth.uid())) and (select has_creator_workspace_access()))
          or (select is_admin())
        )
    )
  );

alter policy creator_category_owner_manage on public.creator_category_members
  using (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  )
  with check (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  );

alter policy creator_portfolios_authenticated_read on public.creator_portfolios
  using (
    ((is_active = true) and exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id and cp.is_published = true
    ))
    or exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
        and (select has_creator_workspace_access())
    )
    or (select is_admin())
  );

alter policy creator_portfolios_owner_manage on public.creator_portfolios
  using (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  )
  with check (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  );

alter policy creator_services_authenticated_read on public.creator_services
  using (
    ((is_active = true) and exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_services.creator_id and cp.is_published = true
    ))
    or exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
        and (select has_creator_workspace_access())
    )
    or (select is_admin())
  );

alter policy creator_services_owner_manage on public.creator_services
  using (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  )
  with check (
    (exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )) and (select has_creator_workspace_access())
  );

commit;

