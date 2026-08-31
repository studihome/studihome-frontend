-- Migration 20: remove unnecessary anonymous execution access from the
-- authenticated owner-only Creator username mutation.

revoke execute
on function public.change_creator_username_for_profile(uuid, text)
from public, anon;

grant execute
on function public.change_creator_username_for_profile(uuid, text)
to authenticated, service_role;
