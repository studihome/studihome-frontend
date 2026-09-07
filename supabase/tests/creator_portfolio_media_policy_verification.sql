-- Post-apply verification for Issue #90.
-- Test rows are transaction-local and rolled back.
begin;

do $shape$
declare
  v_validated boolean;
begin
  select c.convalidated into v_validated
  from pg_constraint c
  where c.conrelid='public.creator_portfolios'::regclass
    and c.conname='creator_portfolios_media_policy_v2';

  if v_validated is distinct from true then
    raise exception 'Verification failed: v2 policy missing or not VALIDATED.';
  end if;

  if exists (
    select 1 from pg_constraint c
    where c.conrelid='public.creator_portfolios'::regclass
      and c.conname in (
        'creator_portfolios_external_media_policy',
        'creator_portfolios_media_type_check',
        'creator_portfolios_media_url_https_check',
        'creator_portfolios_supported_media_check'
      )
  ) then
    raise exception 'Verification failed: one or more legacy media constraints remain.';
  end if;
end
$shape$;

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
  select id into v_creator from public.creator_profiles order by created_at limit 1;
  if v_creator is null then raise exception 'Verification failed: no Creator fixture available.'; end if;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Link','', 'link','https://example.com/work',2147483000,false) returning id into v_id;
    insert into policy_results values('allow_link','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_link','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Image','', 'image','https://cdn.example.com/work.jpg',2147483001,false) returning id into v_id;
    insert into policy_results values('allow_image','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_image','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy YouTube','', 'youtube','https://www.youtube.com/watch?v=abc',2147483002,false) returning id into v_id;
    insert into policy_results values('allow_youtube','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_youtube','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Drive','', 'drive','https://drive.google.com/file/d/abc/view',2147483003,false) returning id into v_id;
    insert into policy_results values('allow_drive','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_drive','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy TikTok','', 'tiktok','https://www.tiktok.com/@x/video/1',2147483004,false) returning id into v_id;
    insert into policy_results values('allow_tiktok','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_tiktok','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Policy Instagram','', 'instagram','https://www.instagram.com/p/abc/',2147483005,false) returning id into v_id;
    insert into policy_results values('allow_instagram','allow',true);
    delete from public.creator_portfolios where id=v_id;
  exception when others then insert into policy_results values('allow_instagram','allow',false); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny Video','', 'video','https://cdn.example.com/work.mp4',2147483010,false) returning id into v_id;
    insert into policy_results values('deny_video','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_video','deny',true); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny HTTP','', 'link','http://example.com/work',2147483011,false) returning id into v_id;
    insert into policy_results values('deny_http','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_http','deny',true); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny Host','', 'youtube','https://example.com/watch?v=abc',2147483012,false) returning id into v_id;
    insert into policy_results values('deny_wrong_youtube_host','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_wrong_youtube_host','deny',true); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny Subdomain','', 'youtube','https://m.youtube.com/watch?v=abc',2147483013,false) returning id into v_id;
    insert into policy_results values('deny_youtube_subdomain','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_youtube_subdomain','deny',true); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny Uppercase','', 'LINK','https://example.com/work',2147483014,false) returning id into v_id;
    insert into policy_results values('deny_uppercase_type','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_uppercase_type','deny',true); end;

  begin
    insert into public.creator_portfolios(creator_id,title,description,media_type,media_url,sort_order,is_active)
    values(v_creator,'Deny Unknown','', 'other','https://example.com/work',2147483015,false) returning id into v_id;
    insert into policy_results values('deny_unknown_type','deny',false);
    delete from public.creator_portfolios where id=v_id;
  exception when check_violation then insert into policy_results values('deny_unknown_type','deny',true); end;

  if exists(select 1 from policy_results where passed=false) then
    raise exception 'Verification failed: one or more preserved-policy cases failed.';
  end if;
end
$cases$;

select case_name,expected,passed from policy_results order by case_name;
rollback;
