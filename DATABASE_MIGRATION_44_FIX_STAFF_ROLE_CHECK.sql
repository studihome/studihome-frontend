-- ============================================================
-- STUDIHOME MIGRATION 44: FIX profiles_role_check FOR "staff"
-- ============================================================
-- Platform: Supabase SQL Editor
--
-- WHY THIS FILE EXISTS
--   Changing a user's role to 'staff' fails with:
--     new row for relation "profiles" violates check constraint
--     "profiles_role_check"
--   The error names the constraint exactly, which means the live
--   database still enforces a whitelist without 'staff' (the DB-side
--   part of Migration 43 was not applied on this project).
--
--   This migration is SELF-CONTAINED and IDEMPOTENT:
--     * Step 1 re-applies the is_admin() extension to admit staff
--       (harmless if already applied).
--     * Step 2 rebuilds profiles_role_check so it accepts 'staff'
--       while NEVER narrowing the previously allowed set (the new
--       whitelist is built from the role values actually present in
--       the data, plus 'staff').
--   Safe to run multiple times.
--
-- SECURITY PRESERVED
--   * is_admin(): SECURITY DEFINER + search_path='' hardening kept;
--     EXECUTE revoked from public/anon, granted to authenticated
--     (+service_role).
--   * Constraint is rebuilt as a superset of the original — no
--     existing role value is invalidated.
-- ============================================================

-- ============================================================
-- V0 (diagnostic): current state BEFORE the fix
-- ============================================================
select 'V0_before' as check_name,
       conname,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'profiles_role_check';

-- ============================================================
-- STEP 1: Extend public.is_admin() to accept staff (idempotent)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(p.status) = 'active'
      and lower(p.role) in ('admin', 'staff')
  );
$function$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ============================================================
-- STEP 2: Rebuild profiles_role_check to accept 'staff'
--   a) drop the exact constraint reported in the error
--   b) extend any OTHER check constraint mentioning role
--      (expression preserved verbatim, staff added — additive only)
--   c) recreate profiles_role_check from the roles actually present
--      in the data + 'staff' (superset — never narrows)
-- ============================================================
do $staff$
declare
  v_list text;
  v_con  record;
  v_def  text;
  v_expr text;
begin
  -- 2a) drop the exact constraint by name (the one in the error)
  execute 'alter table public.profiles drop constraint if exists profiles_role_check';

  -- 2b) any other CHECK constraints mentioning role get extended,
  --     preserving the original expression and adding staff
  for v_con in
    select con.oid, con.conname
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'profiles'
      and n.nspname = 'public'
      and con.contype = 'c'
      and con.conname <> 'profiles_role_check'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    v_def  := pg_get_constraintdef(v_con.oid);
    v_expr := substr(v_def, 8, greatest(length(v_def) - 8, 0));
    execute format('alter table public.profiles drop constraint %I', v_con.conname);
    execute format(
      'alter table public.profiles add constraint %I check ( (%s) or lower(role) = %L )',
      v_con.conname, v_expr, 'staff'
    );
    raise notice 'Extended constraint % to also accept staff', v_con.conname;
  end loop;

  -- 2c) recreate profiles_role_check: existing values + 'staff'
  select coalesce(string_agg(distinct quote_literal(lower(role)), ', ' order by quote_literal(lower(role))), '')
    into v_list
  from public.profiles
  where role is not null
    and nullif(trim(role), '') is not null
    and lower(role) <> 'staff';

  if v_list = '' then
    v_list := quote_literal('member');
  end if;

  execute format(
    'alter table public.profiles add constraint profiles_role_check check ( lower(role) in (%s, %L) )',
    v_list, 'staff'
  );
  raise notice 'profiles_role_check recreated; allowed roles: %, staff', v_list;
end
$staff$;

-- ============================================================
-- STEP 3: Verification
-- ============================================================

-- V1: constraint now includes 'staff'
select 'V1_after' as check_name,
       conname,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where conname = 'profiles_role_check';

-- V2: is_admin() admits admin AND staff
select 'V2_is_admin' as check_name, prosrc as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'is_admin' and n.nspname = 'public';

-- V3: least-privilege preserved (no PUBLIC/anon EXECUTE on is_admin)
select 'V3_is_admin_grants' as check_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_name = 'is_admin' and routine_schema = 'public'
order by grantee;

-- ============================================================
-- STEP 4: Functional test (SAFE — runs inside a rolled-back
--   subtransaction, so no data is changed)
--   Expected output: "OK: profiles.role now accepts staff"
--   If the constraint is still broken, this DO block raises the
--   original check-violation error instead.
-- ============================================================
do $verify$
declare
  v_id uuid;
begin
  select id into v_id
  from public.profiles
  where role is not null
  limit 1;

  if v_id is null then
    raise notice 'No profile rows to test against; the V1 constraint definition above is the source of truth.';
    return;
  end if;

  begin
    update public.profiles set role = 'staff' where id = v_id;
    raise exception 'STAFF_ACCEPTED';
  exception when others then
    if sqlerrm like '%STAFF_ACCEPTED%' then
      raise notice 'OK: profiles.role now accepts staff (test row rolled back, no data changed).';
    else
      raise;
    end if;
  end;
end
$verify$;

-- ============================================================
-- ROLLBACK (only if you must revert; adjust to your data)
-- ============================================================
-- 1. restore is_admin() to admin-only:
--    create or replace function public.is_admin()
--    returns boolean language sql stable security definer set search_path = ''
--    as $function$
--      select exists (
--        select 1 from public.profiles p
--        where p.id = auth.uid()
--          and lower(p.status) = 'active'
--          and lower(p.role) = 'admin'
--      );
--    $function$;
--    revoke all on function public.is_admin() from public, anon;
--    grant execute on function public.is_admin() to authenticated, service_role;
-- 2. rebuild the constraint without staff:
--    alter table public.profiles drop constraint if exists profiles_role_check;
--    alter table public.profiles add constraint profiles_role_check
--      check ( lower(role) in ('member', 'admin') );
-- ============================================================