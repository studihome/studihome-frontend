-- Post-apply verification for get_creator_trust_metrics visibility.
-- READ-ONLY against application data.
-- JWT settings are transaction-local and the transaction is rolled back.
--
-- Run only after applying:
--   20260907004000_constrain_creator_trust_metrics_visibility.sql

begin;

do $verify$
declare
  v_published uuid;
  v_unpublished uuid;
  v_admin uuid;
  v_owner record;
  v_result jsonb;
  v_owner_tested boolean := false;
begin
  -- Anonymous-like context: auth.uid() must be NULL.
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);

  select cp.id
    into v_published
  from public.creator_profiles cp
  where cp.is_published = true
  order by cp.created_at
  limit 1;

  if v_published is not null then
    v_result := public.get_creator_trust_metrics(v_published);
    if v_result is null then
      raise exception 'Published Creator metrics unexpectedly denied.';
    end if;
  else
    raise notice 'Published Creator fixture unavailable; published-success assertion skipped.';
  end if;

  select cp.id
    into v_unpublished
  from public.creator_profiles cp
  where coalesce(cp.is_published, false) = false
  order by cp.created_at
  limit 1;

  if v_unpublished is not null then
    v_result := public.get_creator_trust_metrics(v_unpublished);
    if v_result is not null then
      raise exception 'Anonymous caller can still read unpublished Creator metrics.';
    end if;
  else
    raise notice 'Unpublished Creator fixture unavailable; anonymous-denial assertion skipped.';
  end if;

  -- Active Admin must retain unpublished access when an unpublished fixture exists.
  select p.id
    into v_admin
  from public.profiles p
  where p.role = 'admin'
    and p.status = 'active'
  order by p.created_at
  limit 1;

  if v_admin is not null and v_unpublished is not null then
    perform set_config('request.jwt.claim.sub', v_admin::text, true);
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_admin::text)::text,
      true
    );

    v_result := public.get_creator_trust_metrics(v_unpublished);
    if v_result is null then
      raise exception 'Active Admin unexpectedly denied unpublished Creator metrics.';
    end if;
  else
    raise notice 'Admin or unpublished fixture unavailable; Admin-success assertion skipped.';
  end if;

  -- Owning Creator with workspace access must retain their own unpublished metrics.
  for v_owner in
    select cp.id as creator_id, cp.user_id
    from public.creator_profiles cp
    where coalesce(cp.is_published, false) = false
      and cp.user_id is not null
    order by cp.created_at
  loop
    perform set_config('request.jwt.claim.sub', v_owner.user_id::text, true);
    perform set_config(
      'request.jwt.claims',
      jsonb_build_object('sub', v_owner.user_id::text)::text,
      true
    );

    if public.has_creator_workspace_access() then
      v_result := public.get_creator_trust_metrics(v_owner.creator_id);
      if v_result is null then
        raise exception 'Owning Creator with workspace access unexpectedly denied.';
      end if;
      v_owner_tested := true;
      exit;
    end if;
  end loop;

  if not v_owner_tested then
    raise notice 'Eligible unpublished Creator owner fixture unavailable; owner-success assertion skipped.';
  end if;

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{}', true);
end
$verify$;

rollback;
