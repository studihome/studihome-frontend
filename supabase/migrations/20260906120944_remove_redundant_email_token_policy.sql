-- Applied to Supabase production as:
-- 20260906120944_remove_redundant_email_token_policy
-- Purpose: remove a semantically redundant deny policy without opening
-- direct Data API access for anon/authenticated users.

drop policy if exists hanya_service_role
on public.email_verification_tokens;

do $verify$
declare
  v_rls boolean;
  v_guard_count integer;
begin
  select c.relrowsecurity
    into v_rls
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'email_verification_tokens';

  if v_rls is distinct from true then
    raise exception 'Verification failed: RLS must remain enabled on email_verification_tokens';
  end if;

  select count(*)::integer
    into v_guard_count
    from pg_catalog.pg_policies
   where schemaname = 'public'
     and tablename = 'email_verification_tokens'
     and policyname = 'email_verification_tokens_no_direct_access'
     and permissive = 'PERMISSIVE'
     and cmd = 'ALL'
     and qual = 'false'
     and with_check = 'false'
     and roles @> array['anon','authenticated']::name[];

  if v_guard_count <> 1 then
    raise exception 'Verification failed: explicit anon/auth deny policy is missing or changed';
  end if;

  if has_table_privilege('anon', 'public.email_verification_tokens', 'SELECT')
     or has_table_privilege('anon', 'public.email_verification_tokens', 'INSERT')
     or has_table_privilege('anon', 'public.email_verification_tokens', 'UPDATE')
     or has_table_privilege('anon', 'public.email_verification_tokens', 'DELETE') then
    raise exception 'Verification failed: anon unexpectedly has direct table privileges';
  end if;

  if has_table_privilege('authenticated', 'public.email_verification_tokens', 'SELECT')
     or has_table_privilege('authenticated', 'public.email_verification_tokens', 'INSERT')
     or has_table_privilege('authenticated', 'public.email_verification_tokens', 'UPDATE')
     or has_table_privilege('authenticated', 'public.email_verification_tokens', 'DELETE') then
    raise exception 'Verification failed: authenticated unexpectedly has direct table privileges';
  end if;
end
$verify$;
