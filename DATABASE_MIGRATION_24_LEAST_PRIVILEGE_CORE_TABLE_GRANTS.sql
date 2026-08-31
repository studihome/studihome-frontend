-- Migration 24: least-privilege grants for core commerce and identity tables.
-- RLS policies remain the row-level authority. service_role privileges are unchanged.

revoke all privileges on table public.orders from anon, authenticated;
grant select on table public.orders to authenticated;

revoke all privileges on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

revoke all privileges on table public.products from anon, authenticated;
grant select on table public.products to anon;
grant select, insert, update, delete on table public.products to authenticated;