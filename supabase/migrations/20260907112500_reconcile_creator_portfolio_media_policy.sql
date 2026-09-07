-- Reconcile four overlapping creator_portfolios media CHECK constraints.
-- Issue #90.
--
-- IMPORTANT: preserve CURRENT EFFECTIVE semantics.
-- Allowed:
--   link/image -> HTTPS
--   youtube/drive/tiktok/instagram -> HTTPS + current root/www provider hosts
-- Denied:
--   video, unknown types, HTTP, uppercase media_type, non-approved provider subdomains
--
-- No application data, RLS, grants, Auth, Storage, or other schema objects are changed.
do $preflight$
declare
  v_drift integer;
  v_bad_rows integer;
begin
  with expected(conname,convalidated,definition_md5) as (
    values
      ('creator_portfolios_external_media_policy',true,'d7871cbca030e70439584c39de0b65c1'),
      ('creator_portfolios_media_type_check',false,'c05819a550b8add8316bb3dcc36aaeb6'),
      ('creator_portfolios_media_url_https_check',true,'85efa3cd08de7b6ceb7c6eb6334fcf57'),
      ('creator_portfolios_supported_media_check',false,'155912782affbcc9d00fe952c28c38bf')
  ),
  actual as (
    select c.conname,c.convalidated,md5(pg_get_constraintdef(c.oid,true)) as definition_md5
    from pg_constraint c
    where c.conrelid='public.creator_portfolios'::regclass
      and c.conname in (
        'creator_portfolios_external_media_policy',
        'creator_portfolios_media_type_check',
        'creator_portfolios_media_url_https_check',
        'creator_portfolios_supported_media_check'
      )
  )
  select count(*) into v_drift
  from (
    select e.conname
    from expected e
    left join actual a using(conname)
    where a.conname is null
       or a.convalidated is distinct from e.convalidated
       or a.definition_md5 is distinct from e.definition_md5
    union all
    select a.conname
    from actual a
    left join expected e using(conname)
    where e.conname is null
  ) drift;

  if v_drift <> 0 then
    raise exception 'Migration aborted: legacy media constraint fingerprint drifted (% mismatch rows).', v_drift;
  end if;

  if exists (
    select 1 from pg_constraint
    where conrelid='public.creator_portfolios'::regclass
      and conname='creator_portfolios_media_policy_v2'
  ) then
    raise exception 'Migration aborted: creator_portfolios_media_policy_v2 already exists.';
  end if;

  select count(*) into v_bad_rows
  from public.creator_portfolios
  where not (
    (media_type='link' and media_url ~* '^https://')
    or (media_type='image' and media_url ~* '^https://')
    or (media_type='youtube' and media_url ~* '^https://(www\\.)?(youtube\\.com|youtu\\.be)/')
    or (media_type='drive' and media_url ~* '^https://(www\\.)?(drive\\.google\\.com|docs\\.google\\.com)/')
    or (media_type='tiktok' and media_url ~* '^https://(www\\.)?tiktok\\.com/')
    or (media_type='instagram' and media_url ~* '^https://(www\\.)?instagram\\.com/')
  );

  if v_bad_rows <> 0 then
    raise exception 'Migration aborted: % existing rows violate preserved effective media policy.', v_bad_rows;
  end if;
end
$preflight$;

alter table public.creator_portfolios
  add constraint creator_portfolios_media_policy_v2
  check (
    (media_type='link' and media_url ~* '^https://')
    or (media_type='image' and media_url ~* '^https://')
    or (media_type='youtube' and media_url ~* '^https://(www\\.)?(youtube\\.com|youtu\\.be)/')
    or (media_type='drive' and media_url ~* '^https://(www\\.)?(drive\\.google\\.com|docs\\.google\\.com)/')
    or (media_type='tiktok' and media_url ~* '^https://(www\\.)?tiktok\\.com/')
    or (media_type='instagram' and media_url ~* '^https://(www\\.)?instagram\\.com/')
  )
  not valid;

alter table public.creator_portfolios
  validate constraint creator_portfolios_media_policy_v2;

alter table public.creator_portfolios
  drop constraint creator_portfolios_external_media_policy,
  drop constraint creator_portfolios_media_type_check,
  drop constraint creator_portfolios_media_url_https_check,
  drop constraint creator_portfolios_supported_media_check;
