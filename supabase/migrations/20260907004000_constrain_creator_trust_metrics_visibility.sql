-- Security hardening for public Creator trust metrics.
-- Keeps the existing RPC signature, SECURITY DEFINER mode, search_path, and ACL.
-- Only the row-visibility contract changes:
--   * anonymous/public callers can read metrics for published Creators;
--   * an authenticated owning Creator may read their own metrics while they
--     still have Creator workspace access;
--   * active Admins may read any Creator metrics;
--   * every other caller receives NULL (same shape-safe behavior for current
--     frontend, which already normalizes null to an empty metrics object).
--
-- No table grants, RLS policies, schema, or underlying data are changed.

create or replace function public.get_creator_trust_metrics(p_creator_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to ''
as $function$
  with caller as (
    select
      (select auth.uid()) as uid,
      public.is_admin() as is_admin
  ),
  allowed_creator as (
    select cp.id
    from public.creator_profiles cp
    cross join caller c
    where cp.id = p_creator_id
      and (
        cp.is_published = true
        or c.is_admin
        or (
          c.uid is not null
          and cp.user_id = c.uid
          and public.has_creator_workspace_access()
        )
      )
  ),
  base_likes as (
    select count(*)::bigint as n
    from public.creator_likes l
    join allowed_creator a on a.id = l.creator_id
  ),
  adjusted_likes as (
    select coalesce(sum(adj.delta_count), 0)::bigint as n
    from public.creator_like_adjustments adj
    join allowed_creator a on a.id = adj.creator_id
  ),
  all_ratings as (
    select r.rating
    from public.creator_ratings r
    join allowed_creator a on a.id = r.creator_id
    where r.is_visible = true

    union all

    select er.rating
    from public.creator_external_ratings er
    join allowed_creator a on a.id = er.creator_id
    where er.is_visible = true
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
  )
  from allowed_creator;
$function$;
