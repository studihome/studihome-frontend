-- Applied to Supabase production as:
-- 20260906141506_consolidate_creator_rls_policies_batch2
-- Combines admin/owner permissive write policies using equivalent OR semantics.

drop policy creator_category_admin_manage on public.creator_category_members;
drop policy creator_category_owner_manage on public.creator_category_members;
create policy creator_category_insert_owner_or_admin
on public.creator_category_members for insert to authenticated
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_category_update_owner_or_admin
on public.creator_category_members for update to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
)
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_category_delete_owner_or_admin
on public.creator_category_members for delete to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_category_members.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);

drop policy creator_portfolios_admin_manage on public.creator_portfolios;
drop policy creator_portfolios_owner_manage on public.creator_portfolios;
create policy creator_portfolios_insert_owner_or_admin
on public.creator_portfolios for insert to authenticated
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_portfolios_update_owner_or_admin
on public.creator_portfolios for update to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
)
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_portfolios_delete_owner_or_admin
on public.creator_portfolios for delete to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_portfolios.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);

drop policy creator_services_admin_manage on public.creator_services;
drop policy creator_services_owner_manage on public.creator_services;
create policy creator_services_insert_owner_or_admin
on public.creator_services for insert to authenticated
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_services_update_owner_or_admin
on public.creator_services for update to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
)
with check (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);
create policy creator_services_delete_owner_or_admin
on public.creator_services for delete to authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_services.creator_id
        and cp.user_id = (select auth.uid())
    )
    and (select public.has_creator_workspace_access())
  )
);

drop policy creator_ratings_admin_manage on public.creator_ratings;
drop policy creator_ratings_own_insert on public.creator_ratings;
drop policy creator_ratings_own_update on public.creator_ratings;
drop policy creator_ratings_own_delete on public.creator_ratings;
create policy creator_ratings_insert_own_or_admin
on public.creator_ratings for insert to authenticated
with check (
  (select public.is_admin())
  or (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_ratings.creator_id
        and cp.is_published = true
    )
  )
);
create policy creator_ratings_update_own_or_admin
on public.creator_ratings for update to authenticated
using (
  (select public.is_admin())
  or user_id = (select auth.uid())
)
with check (
  (select public.is_admin())
  or user_id = (select auth.uid())
);
create policy creator_ratings_delete_own_or_admin
on public.creator_ratings for delete to authenticated
using (
  (select public.is_admin())
  or user_id = (select auth.uid())
);

drop policy creator_profiles_admin_manage on public.creator_profiles;
drop policy creator_profiles_own_select on public.creator_profiles;
drop policy creator_profiles_own_insert on public.creator_profiles;
drop policy creator_profiles_own_update on public.creator_profiles;
create policy creator_profiles_insert_own_or_admin
on public.creator_profiles for insert to authenticated
with check (
  (select public.is_admin())
  or (
    user_id = (select auth.uid())
    and public.has_premium_creator_access()
    and is_verified = false
  )
);
create policy creator_profiles_update_own_or_admin
on public.creator_profiles for update to authenticated
using (
  (select public.is_admin())
  or (
    user_id = (select auth.uid())
    and public.has_creator_workspace_access()
  )
)
with check (
  (select public.is_admin())
  or (
    user_id = (select auth.uid())
    and public.has_creator_workspace_access()
  )
);
create policy creator_profiles_delete_admin
on public.creator_profiles for delete to authenticated
using ((select public.is_admin()));
