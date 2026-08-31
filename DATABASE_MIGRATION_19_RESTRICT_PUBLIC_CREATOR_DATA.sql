-- Migration 19: restrict public Creator identity/affinity exposure.
-- Public profile discovery and aggregate trust metrics remain available.

create or replace function public.get_public_portfolio_like_summary()
returns table (
    portfolio_id uuid,
    likes_count bigint
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        portfolio.id as portfolio_id,
        greatest(
            0::bigint,
            (
                select count(*)
                from public.creator_portfolio_likes organic_like
                where organic_like.portfolio_id = portfolio.id
            )
            + coalesce(
                (
                    select sum(adjustment.delta_count)::bigint
                    from public.creator_portfolio_like_adjustments adjustment
                    where adjustment.portfolio_id = portfolio.id
                ),
                0::bigint
            )
        ) as likes_count
    from public.creator_portfolios portfolio
    join public.creator_profiles creator
      on creator.id = portfolio.creator_id
    where portfolio.is_active = true
      and creator.is_published = true;
$function$;

revoke all on function public.get_public_portfolio_like_summary() from public, anon, authenticated;
grant execute on function public.get_public_portfolio_like_summary() to anon, authenticated;

-- Anonymous callers may select only the public profile contract.
revoke select on table public.creator_profiles from anon;
grant select (
    id,
    username,
    display_name,
    bio,
    avatar_url,
    cover_url,
    whatsapp,
    location,
    is_published,
    is_verified,
    created_at,
    updated_at,
    managed_by_studihome,
    is_studihome_official
) on table public.creator_profiles to anon;

-- Raw profile-like affinity is private to its owner or an admin.
revoke all on table public.creator_likes from anon;
drop policy if exists creator_likes_public_read on public.creator_likes;
drop policy if exists creator_likes_own_select on public.creator_likes;
create policy creator_likes_own_select
on public.creator_likes
for select
to authenticated
using (
    user_id = (select auth.uid())
    or (select public.is_admin())
);
revoke all on table public.creator_likes from authenticated;
grant select, insert, delete on table public.creator_likes to authenticated;

-- Raw portfolio-like affinity is private to its owner or an admin.
revoke all on table public.creator_portfolio_likes from anon;
drop policy if exists "Portfolio likes are viewable by everyone" on public.creator_portfolio_likes;
drop policy if exists "Users can insert their own portfolio likes" on public.creator_portfolio_likes;
drop policy if exists "Users can delete their own portfolio likes" on public.creator_portfolio_likes;
drop policy if exists creator_portfolio_likes_own_select on public.creator_portfolio_likes;
drop policy if exists creator_portfolio_likes_own_insert on public.creator_portfolio_likes;
drop policy if exists creator_portfolio_likes_own_delete on public.creator_portfolio_likes;
create policy creator_portfolio_likes_own_select
on public.creator_portfolio_likes
for select
to authenticated
using (
    user_id = (select auth.uid())
    or (select public.is_admin())
);
create policy creator_portfolio_likes_own_insert
on public.creator_portfolio_likes
for insert
to authenticated
with check (user_id = (select auth.uid()));
create policy creator_portfolio_likes_own_delete
on public.creator_portfolio_likes
for delete
to authenticated
using (
    user_id = (select auth.uid())
    or (select public.is_admin())
);
revoke all on table public.creator_portfolio_likes from authenticated;
grant select, insert, delete on table public.creator_portfolio_likes to authenticated;

-- Adjustment ledgers are internal. Public callers use aggregate RPCs.
revoke all on table public.creator_portfolio_like_adjustments from anon;
drop policy if exists "Public can read portfolio like adjustments" on public.creator_portfolio_like_adjustments;
drop policy if exists creator_portfolio_like_adjustments_admin_read on public.creator_portfolio_like_adjustments;
create policy creator_portfolio_like_adjustments_admin_read
on public.creator_portfolio_like_adjustments
for select
to authenticated
using ((select public.is_admin()));
revoke all on table public.creator_portfolio_like_adjustments from authenticated;
grant select on table public.creator_portfolio_like_adjustments to authenticated;

revoke all on table public.creator_like_adjustments from anon;
revoke all on table public.creator_like_adjustments from authenticated;
grant select on table public.creator_like_adjustments to authenticated;

-- Rating rows contain user affinity. Public UI consumes aggregate trust RPCs.
revoke all on table public.creator_ratings from anon;
drop policy if exists creator_ratings_public_read on public.creator_ratings;
drop policy if exists creator_ratings_authenticated_read on public.creator_ratings;
create policy creator_ratings_authenticated_read
on public.creator_ratings
for select
to authenticated
using (
    (
        is_visible = true
        and exists (
            select 1
            from public.creator_profiles creator
            where creator.id = creator_ratings.creator_id
              and creator.is_published = true
        )
    )
    or (select public.is_admin())
);
revoke all on table public.creator_ratings from authenticated;
grant select, insert, update, delete on table public.creator_ratings to authenticated;
