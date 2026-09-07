-- Pre-apply guard for:
-- 20260907063648_constrain_creator_trust_metrics_visibility.sql
--
-- READ-ONLY against application data and catalog state.
-- Run immediately before applying the hardening migration.
-- It fails closed if the audited live RPC contract has drifted.

do $preflight$
declare
  v_oid oid;
  v_security_definer boolean;
  v_proconfig text[];
  v_anon_exec boolean;
  v_auth_exec boolean;
  v_definition text;
begin
  select p.oid, p.prosecdef, p.proconfig, pg_get_functiondef(p.oid)
    into v_oid, v_security_definer, v_proconfig, v_definition
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'get_creator_trust_metrics'
    and pg_get_function_identity_arguments(p.oid) = 'p_creator_id uuid';

  if v_oid is null then
    raise exception 'Preflight failed: get_creator_trust_metrics(uuid) not found.';
  end if;

  if v_security_definer is distinct from true then
    raise exception 'Preflight failed: RPC is no longer SECURITY DEFINER.';
  end if;

  if not exists (
    select 1
    from unnest(coalesce(v_proconfig, '{}'::text[])) cfg
    where cfg in ('search_path=""', 'search_path=')
  ) then
    raise exception 'Preflight failed: expected empty search_path contract missing.';
  end if;

  v_anon_exec := has_function_privilege(
    'anon',
    'public.get_creator_trust_metrics(uuid)',
    'EXECUTE'
  );
  v_auth_exec := has_function_privilege(
    'authenticated',
    'public.get_creator_trust_metrics(uuid)',
    'EXECUTE'
  );

  if not v_anon_exec or not v_auth_exec then
    raise exception
      'Preflight failed: audited EXECUTE ACL drifted (anon=%, authenticated=%).',
      v_anon_exec,
      v_auth_exec;
  end if;

  if position('public.creator_likes' in v_definition) = 0
     or position('public.creator_like_adjustments' in v_definition) = 0
     or position('public.creator_ratings' in v_definition) = 0
     or position('public.creator_external_ratings' in v_definition) = 0 then
    raise exception 'Preflight failed: audited metric dependencies drifted.';
  end if;

  if position('cp.is_published' in v_definition) > 0
     or position('has_creator_workspace_access' in v_definition) > 0 then
    raise exception 'Preflight failed: live RPC appears already hardened or changed.';
  end if;
end
$preflight$;

select
  'creator_trust_metrics_preflight'::text as check_name,
  true as passed;
