-- Migration 28: support signed creator-like adjustments with integrity guards.
-- Existing grants, RLS policies, and RPC signatures are preserved.

alter table public.creator_like_adjustments
  drop constraint if exists creator_like_adjustments_delta_check;

alter table public.creator_like_adjustments
  add constraint creator_like_adjustments_delta_check
  check (
    delta_count <> 0
    and abs(delta_count::bigint) <= 100000
  );

create or replace function public.admin_add_creator_like_adjustment(
  p_creator_id uuid,
  p_delta_count integer,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_current_likes bigint;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'Akses Admin diperlukan.'
      using errcode = '42501';
  end if;

  if p_creator_id is null then
    raise exception 'Creator ID wajib diisi.'
      using errcode = '22023';
  end if;

  perform 1
  from public.creator_profiles
  where id = p_creator_id
  for update;

  if not found then
    raise exception 'Creator tidak ditemukan.'
      using errcode = '23503';
  end if;

  if p_delta_count is null
     or p_delta_count = 0
     or abs(p_delta_count::bigint) > 100000 then
    raise exception 'Delta Like harus berada di antara -100000 dan 100000, serta tidak boleh 0.'
      using errcode = '22023';
  end if;

  if char_length(btrim(coalesce(p_reason, ''))) < 1 then
    raise exception 'Alasan penyesuaian wajib diisi.'
      using errcode = '22023';
  end if;

  select
    (select count(*)::bigint
       from public.creator_likes
      where creator_id = p_creator_id)
    +
    (select coalesce(sum(delta_count), 0)::bigint
       from public.creator_like_adjustments
      where creator_id = p_creator_id)
  into v_current_likes;

  if v_current_likes + p_delta_count::bigint < 0 then
    raise exception 'Pengurangan Like melebihi total Like saat ini.'
      using errcode = '22023';
  end if;

  insert into public.creator_like_adjustments
    (creator_id, delta_count, reason, created_by)
  values
    (p_creator_id, p_delta_count, left(btrim(p_reason), 200), auth.uid());

  return jsonb_build_object(
    'success', true,
    'creator_id', p_creator_id,
    'delta_count', p_delta_count
  );
end;
$function$;

create or replace function public.get_creator_trust_metrics(p_creator_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  with base_likes as (
    select count(*)::bigint as n
    from public.creator_likes
    where creator_id = p_creator_id
  ),
  adjusted_likes as (
    select coalesce(sum(delta_count), 0)::bigint as n
    from public.creator_like_adjustments
    where creator_id = p_creator_id
  ),
  all_ratings as (
    select rating
    from public.creator_ratings
    where creator_id = p_creator_id
      and is_visible = true
    union all
    select rating
    from public.creator_external_ratings
    where creator_id = p_creator_id
      and is_visible = true
  )
  select jsonb_build_object(
    'likes', greatest(
      0::bigint,
      (select n from base_likes) + (select n from adjusted_likes)
    ),
    'ratingCount', (select count(*)::bigint from all_ratings),
    'ratingAvg', (
      select case
        when count(*) = 0 then null
        else round(avg(rating)::numeric, 1)
      end
      from all_ratings
    )
  );
$function$;

create or replace function public.get_public_creator_trust_summary()
returns table(
  creator_id uuid,
  likes bigint,
  rating_count bigint,
  rating_avg numeric
)
language sql
stable
security definer
set search_path = ''
as $function$
  with published as (
    select id
    from public.creator_profiles
    where is_published = true
  ),
  like_base as (
    select creator_id, count(*)::bigint n
    from public.creator_likes
    group by creator_id
  ),
  like_adj as (
    select creator_id, coalesce(sum(delta_count), 0)::bigint n
    from public.creator_like_adjustments
    group by creator_id
  ),
  ratings as (
    select creator_id, rating
    from public.creator_ratings
    where is_visible = true
    union all
    select creator_id, rating
    from public.creator_external_ratings
    where is_visible = true
  ),
  rating_agg as (
    select creator_id,
           count(*)::bigint rating_count,
           round(avg(rating)::numeric, 1) rating_avg
    from ratings
    group by creator_id
  )
  select p.id as creator_id,
         greatest(0::bigint, coalesce(lb.n, 0) + coalesce(la.n, 0)) as likes,
         coalesce(ra.rating_count, 0) as rating_count,
         ra.rating_avg
  from published p
  left join like_base lb on lb.creator_id = p.id
  left join like_adj la on la.creator_id = p.id
  left join rating_agg ra on ra.creator_id = p.id;
$function$;