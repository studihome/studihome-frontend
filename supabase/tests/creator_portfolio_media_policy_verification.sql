-- Post-apply verification for creator_portfolios_media_policy_v2.
-- Application-data writes are transaction-local and rolled back.

begin;

do $verify$
declare
  v_validated boolean;
begin
  select c.convalidated into v_validated
  from pg_constraint c
  join pg_class t on t.oid=c.conrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public'
    and t.relname='creator_portfolios'
    and c.conname='creator_portfolios_media_policy_v2';

  if v_validated is distinct from true then
    raise exception 'Verification failed: creator_portfolios_media_policy_v2 is missing or not validated.';
  end if;

  if exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid=c.conrelid
    join pg_namespace n on n.oid=t.relnamespace
    where n.nspname='public'
      and t.relname='creator_portfolios'
      and c.conname in (
        'creator_portfolios_external_media_policy',
        'creator_portfolios_media_type_check',
        'creator_portfolios_media_url_https_check',
        'creator_portfolios_supported_media_check'
      )
  ) then
    raise exception 'Verification failed: legacy media constraints still exist.';
  end if;
end
$verify$;

create temporary table policy_results(
  case_name text primary key,
  expected text not null,
  passed boolean not null
) on commit drop;

do $cases$
declare
  v_creator uuid;
  v_id uuid;
begin
  select id into v_creator
  from public.creator_profiles
  order by created_at
  limit 1;

  if v_creator is null then
    raise exception 'Verification failed: no Creator fixture available.';
  end if;

  -- Helper pattern repeated deliberately so each supported type is tested
  -- against the real CHECK constraint.

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify Link','', 'link','https://example.com/work',2147483000,false)
    returning id into v_id;
    insert into policy_results values('allow_link','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_link','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify Image','', 'image','https://cdn.example.com/work.jpg',2147483001,false)
    returning id into v_id;
    insert into policy_results values('allow_image','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_image','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify Video','', 'video','https://cdn.example.com/work.mp4',2147483002,false)
    returning id into v_id;
    insert into policy_results values('allow_video','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_video','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify YouTube','', 'youtube','https://www.youtube.com/watch?v=abc123',2147483003,false)
    returning id into v_id;
    insert into policy_results values('allow_youtube','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_youtube','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify Drive','', 'drive','https://drive.google.com/file/d/abc/view',2147483004,false)
    returning id into v_id;
    insert into policy_results values('allow_drive','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_drive','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify TikTok','', 'tiktok','https://www.tiktok.com/@x/video/123',2147483005,false)
    returning id into v_id;
    insert into policy_results values('allow_tiktok','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_tiktok','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Verify Instagram','', 'instagram','https://www.instagram.com/p/abc/',2147483006,false)
    returning id into v_id;
    insert into policy_results values('allow_instagram','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then
    insert into policy_results values('allow_instagram','allow',false);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Deny HTTP','', 'link','http://example.com/work',2147483010,false)
    returning id into v_id;
    insert into policy_results values('deny_http','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then
    insert into policy_results values('deny_http','deny',true);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Deny Host','', 'youtube','https://example.com/watch?v=abc',2147483011,false)
    returning id into v_id;
    insert into policy_results values('deny_wrong_youtube_host','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then
    insert into policy_results values('deny_wrong_youtube_host','deny',true);
  end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Deny Type','', 'other','https://example.com/work',2147483012,false)
    returning id into v_id;
    insert into policy_results values('deny_unknown_type','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then
    insert into policy_results values('deny_unknown_type','deny',true);
  end;
end
$cases$;

do $assertions$
begin
  if exists(select 1 from policy_results where passed=false) then
    raise exception 'Verification failed: one or more media policy cases failed.';
  end if;
end
$assertions$;

select case_name,expected,passed
from policy_results
order by case_name;

rollback;
