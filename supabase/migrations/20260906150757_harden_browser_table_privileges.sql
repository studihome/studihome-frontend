-- Applied to Supabase production as:
-- 20260906150757_harden_browser_table_privileges
-- Browser-facing roles only need Data API privileges appropriate to the app.
-- TRUNCATE/TRIGGER/REFERENCES are revoked globally from anon/authenticated.
-- Three anonymous public-read tables are reduced to SELECT-only.

revoke truncate, trigger, references
on all tables in schema public
from anon, authenticated;

revoke insert, update, delete
on table
  public.modules,
  public.site_settings,
  public.testimonials
from anon;

do $verify$
declare
  v_dangerous integer;
begin
  select count(*)::integer
    into v_dangerous
  from information_schema.role_table_grants
  where table_schema='public'
    and grantee in ('anon','authenticated')
    and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES');

  if v_dangerous <> 0 then
    raise exception 'ACL hardening verification failed: dangerous table privileges remain';
  end if;

  if has_table_privilege('anon','public.modules','INSERT')
     or has_table_privilege('anon','public.modules','UPDATE')
     or has_table_privilege('anon','public.modules','DELETE')
     or has_table_privilege('anon','public.site_settings','INSERT')
     or has_table_privilege('anon','public.site_settings','UPDATE')
     or has_table_privilege('anon','public.site_settings','DELETE')
     or has_table_privilege('anon','public.testimonials','INSERT')
     or has_table_privilege('anon','public.testimonials','UPDATE')
     or has_table_privilege('anon','public.testimonials','DELETE') then
    raise exception 'ACL hardening verification failed: anon DML remains on read-only tables';
  end if;

  if not has_table_privilege('anon','public.modules','SELECT')
     or not has_table_privilege('anon','public.site_settings','SELECT')
     or not has_table_privilege('anon','public.testimonials','SELECT') then
    raise exception 'ACL hardening verification failed: required anon SELECT was removed';
  end if;
end
$verify$;
