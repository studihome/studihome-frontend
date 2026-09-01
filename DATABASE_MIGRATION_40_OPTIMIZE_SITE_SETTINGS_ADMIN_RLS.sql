-- Migration 40: preserve site_settings access semantics while evaluating
-- the stable admin check once per statement.

drop policy if exists "admin_manage_site_settings" on public.site_settings;

create policy "admin_manage_site_settings"
  on public.site_settings
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
