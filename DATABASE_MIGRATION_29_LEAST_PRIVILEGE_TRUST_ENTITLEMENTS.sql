-- Migration 29: least-privilege grants for trust evidence and entitlements.
-- RLS remains the row-level authority. service_role privileges are unchanged.

revoke all privileges
on table public.creator_external_ratings
from anon, authenticated;

grant select
on table public.creator_external_ratings
to anon, authenticated;

revoke all privileges
on table public.entitlements
from anon, authenticated;

grant select
on table public.entitlements
to authenticated;