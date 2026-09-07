-- READ-ONLY pre-apply guard for Issue #90.
-- Fails closed if the audited creator_portfolios media-policy baseline drifts.

do $preflight$
declare
  v_count integer;
  v_bad_rows integer;
begin
  select count(*) into v_count
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public'
    and t.relname='creator_portfolios'
    and c.conname in (
      'creator_portfolios_external_media_policy',
      'creator_portfolios_media_type_check',
      'creator_portfolios_media_url_https_check',
      'creator_portfolios_supported_media_check'
    );

  if v_count <> 4 then
    raise exception 'Preflight failed: expected 4 legacy media constraints, found %.', v_count;
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_external_media_policy'
      and c.convalidated=true
  ) then
    raise exception 'Preflight failed: external media policy validation state drifted.';
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_type_check'
      and c.convalidated=false
  ) then
    raise exception 'Preflight failed: media type check validation state drifted.';
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_url_https_check'
      and c.convalidated=true
  ) then
    raise exception 'Preflight failed: media URL check validation state drifted.';
  end if;

  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_supported_media_check'
      and c.convalidated=false
  ) then
    raise exception 'Preflight failed: supported media check validation state drifted.';
  end if;

  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public' and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_policy_v2'
  ) then
    raise exception 'Preflight failed: v2 policy already exists.';
  end if;

  select count(*) into v_bad_rows
  from public.creator_portfolios
  where not (
    case lower(coalesce(media_type,''))
      when 'image' then media_url ~* '^https://'
      when 'video' then media_url ~* '^https://'
      when 'link' then media_url ~* '^https://'
      when 'youtube' then media_url ~* '^https://(www\.)?(youtube\.com|youtu\.be)/'
      when 'drive' then media_url ~* '^https://(www\.)?(drive\.google\.com|docs\.google\.com)/'
      when 'tiktok' then media_url ~* '^https://(www\.)?tiktok\.com/'
      when 'instagram' then media_url ~* '^https://(www\.)?instagram\.com/'
      else false
    end
  );

  if v_bad_rows <> 0 then
    raise exception 'Preflight failed: % current rows violate target policy.', v_bad_rows;
  end if;
end
$preflight$;

select
  'creator_portfolio_media_policy_preflight'::text as check_name,
  true as passed,
  (select count(*)::int from public.creator_portfolios) as rows_compatible;
