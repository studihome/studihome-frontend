-- Applied to Supabase production as:
-- 20260906141254_consolidate_rls_policies_batch1
-- Consolidates logically equivalent permissive SELECT paths while preserving
-- admin write privileges and effective row visibility.

drop policy admin_read_orders on public.orders;

drop policy admin_select_profiles on public.profiles;
drop policy profile_select_own on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (
  (select auth.uid()) = id
  or (select public.is_admin())
);

drop policy admin_manage_entitlements on public.entitlements;
create policy admin_insert_entitlements
on public.entitlements for insert to authenticated
with check ((select public.is_admin()));
create policy admin_update_entitlements
on public.entitlements for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy admin_delete_entitlements
on public.entitlements for delete to authenticated
using ((select public.is_admin()));

drop policy admin_manage_modules on public.modules;
create policy admin_insert_modules
on public.modules for insert to authenticated
with check ((select public.is_admin()));
create policy admin_update_modules
on public.modules for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy admin_delete_modules
on public.modules for delete to authenticated
using ((select public.is_admin()));

drop policy admin_manage_site_settings on public.site_settings;
create policy admin_insert_site_settings
on public.site_settings for insert to authenticated
with check ((select public.is_admin()));
create policy admin_update_site_settings
on public.site_settings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy admin_delete_site_settings
on public.site_settings for delete to authenticated
using ((select public.is_admin()));

drop policy admin_manage_testimonials on public.testimonials;
create policy admin_insert_testimonials
on public.testimonials for insert to authenticated
with check ((select public.is_admin()));
create policy admin_update_testimonials
on public.testimonials for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy admin_delete_testimonials
on public.testimonials for delete to authenticated
using ((select public.is_admin()));
