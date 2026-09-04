-- ============================================================
-- STUDIHOME MIGRATION 43: ADD "staff" ROLE
-- ============================================================
-- Platform: Supabase SQL Editor
-- Depends on: existing profiles table + public.is_admin() function
--
-- PURPOSE:
--   Introduce a trusted operational role "staff" with full access to
--   the admin menus Transaksi (orders), Master Data (master), and
--   Dapur Creator (dapur-creator).
--
-- HOW IT WORKS (Constitution Art XI chain: table -> function/RPC -> policies):
--   1. public.is_admin() is the single authorization funnel used by ALL
--      canonical admin RLS policies (see Migrations 13, 39, 40, 41) and by
--      admin SECURITY DEFINER RPCs. Extending it to also return true for
--      role='staff' (status='active') automatically grants staff the same
--      DB-level write access on the tables those policies/RPCs cover:
--        orders, site_settings, testimonials, creator_profiles,
--        creator_likes, creator_like_adjustments, creator_ratings,
--        creator_external_ratings, creator_portfolios, creator_services...
--      The application layer (index.html) additionally restricts the UI/API
--      to the three menus above, so staff never sees Produk, Modul,
--      Pengguna, or Gudang.
--   2. Makes the profiles.role column accept 'staff'. Handles BOTH possible
--      schema shapes without prior knowledge:
--        - enum-typed role column  -> ALTER TYPE ... ADD VALUE IF NOT EXISTS
--        - CHECK-constrained role  -> constraint is preserved verbatim and
--          extended with "OR lower(role) = 'staff'" (strictly additive)
--      Idempotent: safe to re-run.
--
-- SECURITY PRESERVED:
--   - is_admin() keeps SECURITY DEFINER + search_path='' hardening.
--   - REVOKE from public/anon; EXECUTE only for authenticated (+service_role).
--   - Admin accounts remain fully protected in the app (role admin cannot be
--     changed/blocked from the panel).
--   - 'member' semantics unchanged; status='active' still required.
-- ============================================================

-- ============================================================
-- STEP 1: Extend public.is_admin() to accept staff
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

-- Preserve least-privilege: never executable by anon/public.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated, service_role;

-- ============================================================
-- STEP 2: Make profiles.role accept 'staff'
--   Covers enum-typed columns AND CHECK-constrained text columns.
--   Idempotent; safe to run repeatedly.
-- ============================================================
do $staff$
declare
  v_typ text;
  v_sch text;
  v_con record;
  v_def text;
  v_expr text;
begin
  -- 2a) If role is an enum type, add the value (guarded).
  select t.typname, n.nspname
    into v_typ, v_sch
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_type t on t.oid = a.atttypid
  join pg_namespace n on n.oid = t.typnamespace
  where c.relname = 'profiles'
    and c.relnamespace = 'public'::regnamespace
    and a.attname = 'role'
    and not a.attisdropped
    and t.typtype = 'e';

  if v_typ is not null then
    begin
      execute format('alter type %I.%I add value if not exists %L', v_sch, v_typ, 'staff');
      raise notice 'staff added to enum %.%', v_sch, v_typ;
    exception when duplicate_object then
      raise notice 'staff already present in enum %.%', v_sch, v_typ;
    end;
  end if;

  -- 2b) If role is constrained by a CHECK constraint, preserve the original
  --     expression verbatim and extend it with the new value (strictly
  --     additive, never narrows the existing allowed set).
  for v_con in
    select con.oid, con.conname
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'profiles'
      and n.nspname = 'public'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    v_def  := pg_get_constraintdef(v_con.oid);
    -- strip leading 'CHECK (' and one trailing ')' to recover the expression
    v_expr := substr(v_def, 8, greatest(length(v_def) - 8, 0));
    execute format('alter table public.profiles drop constraint %I', v_con.conname);
    execute format(
      'alter table public.profiles add constraint %I check ( (%s) or lower(role) = %L )',
      v_con.conname, v_expr, 'staff'
    );
    raise notice 'CHECK constraint % extended to accept staff (was: %)', v_con.conname, v_def;
  end loop;
end
$staff$;

-- ============================================================
-- STEP 3: Verification (all must return expected results)
-- ============================================================

-- V1: is_admin() now admits admin AND staff
select 'V1_is_admin_def' as check_name,
       prosrc as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'is_admin' and n.nspname = 'public';

-- V2: role column accepts 'staff' (enum case -> shows 'staff' in labels)
select 'V2_enum_labels' as check_name, enumlabel
from pg_enum e
join pg_type t on t.oid = e.enumtypid
where t.typname in (
  select t2.typname
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_type t2 on t2.oid = a.atttypid
  where c.relname = 'profiles' and a.attname = 'role' and t2.typtype = 'e'
)
order by enumlabel;

-- V3: role column CHECK constraints now include staff (check-constraint case)
select 'V3_check_constraints' as check_name,
       con.conname,
       pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where c.relname = 'profiles'
  and n.nspname = 'public'
  and con.contype = 'c'
  and pg_get_constraintdef(con.oid) ilike '%role%';

-- V4: least-privilege preserved (no PUBLIC/anon EXECUTE on is_admin)
select 'V4_is_admin_grants' as check_name, grantee, privilege_type
from information_schema.role_routine_grants
where routine_name = 'is_admin' and routine_schema = 'public'
order by grantee;

-- V5: admins still pass (returns true for an admin session)
-- (only meaningful when run while logged in as admin in the dashboard;
--  can be ignored if it errors on 'auth.uid() is null')
select 'V5_is_admin_functional' as check_name, public.is_admin() as result;

-- ============================================================
-- ROLLBACK (only if you must revert; run in order, top to bottom)
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
-- 2. remove 'staff' from enum (requires no rows using it):
--    alter type public.user_role drop value 'staff';  -- name may differ
-- 3. or remove the extended CHECK constraint and restore the original def
--    (see V3 output for the exact constraint name/definition).
-- ============================================================