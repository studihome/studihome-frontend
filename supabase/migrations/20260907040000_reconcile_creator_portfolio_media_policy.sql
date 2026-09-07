-- Reconcile overlapping creator_portfolios media CHECK constraints.
-- Issue #90.
--
-- Fail closed if the audited live constraint baseline has drifted.
-- Target behavior:
--   image/video/link -> HTTPS
--   youtube/drive/tiktok/instagram -> HTTPS + approved host
--   everything else -> denied
--
-- No data mutation, RLS, grants, Auth, or other schema objects are changed.

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
    raise exception 'Preflight failed: expected 4 legacy creator_portfolios media constraints, found %.', v_count;
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_external_media_policy'
      and c.convalidated=true
  ) then
    raise exception 'Preflight failed: creator_portfolios_external_media_policy baseline drifted.';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_type_check'
      and c.convalidated=false
      and pg_get_constraintdef(c.oid,true) ilike '%video%'
  ) then
    raise exception 'Preflight failed: creator_portfolios_media_type_check baseline drifted.';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_url_https_check'
      and c.convalidated=true
  ) then
    raise exception 'Preflight failed: creator_portfolios_media_url_https_check baseline drifted.';
  end if;

  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_supported_media_check'
      and c.convalidated=false
      and pg_get_constraintdef(c.oid,true) ilike '%video%'
  ) then
    raise exception 'Preflight failed: creator_portfolios_supported_media_check baseline drifted.';
  end if;

  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname='creator_portfolios_media_policy_v2'
  ) then
    raise exception 'Preflight failed: creator_portfolios_media_policy_v2 already exists.';
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
    raise exception 'Preflight failed: % existing creator_portfolios rows violate target media policy.', v_bad_rows;
  end if;
end
$preflight$;

alter table public.creator_portfolios
  add constraint creator_portfolios_media_policy_v2
  check (
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
  ) not valid;

alter table public.creator_portfolios
  validate constraint creator_portfolios_media_policy_v2;

alter table public.creator_portfolios
  drop constraint creator_portfolios_external_media_policy,
  drop constraint creator_portfolios_media_type_check,
  drop constraint creator_portfolios_media_url_https_check,
  drop constraint creator_portfolios_supported_media_check;
