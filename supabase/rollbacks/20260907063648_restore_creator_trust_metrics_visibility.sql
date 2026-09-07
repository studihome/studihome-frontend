-- Explicit rollback for:
-- 20260907063648_constrain_creator_trust_metrics_visibility.sql
--
-- Restores the pre-hardening get_creator_trust_metrics(uuid) behavior exactly:
-- any caller with EXECUTE can query metrics for the supplied Creator UUID.
--
-- Use only if the hardening migration must be reverted.
-- No grants, RLS policies, schema, or data are changed here.

create or replace function public.get_creator_trust_metrics(p_creator_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
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
