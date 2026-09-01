-- Migration 39: remove permissive legacy admin policies.
-- Canonical admin_manage_* policies remain in place and authorize through
-- public.is_admin(), which requires role=admin and status=active.

drop policy if exists "hanya_admin_bisa_ubah_site_settings"
  on public.site_settings;

drop policy if exists "hanya_admin_bisa_ubah_testimonials"
  on public.testimonials;

drop policy if exists "hanya_admin_bisa_ubah_modules"
  on public.modules;

