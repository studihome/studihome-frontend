begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

alter policy creator_likes_own_delete on public.creator_likes
  using (user_id = (select auth.uid()));

alter policy creator_likes_own_insert on public.creator_likes
  with check (
    (user_id = (select auth.uid()))
    and exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_likes.creator_id
        and cp.is_published = true
    )
  );

alter policy creator_ratings_own_delete on public.creator_ratings
  using (user_id = (select auth.uid()));

alter policy creator_ratings_own_insert on public.creator_ratings
  with check (
    (user_id = (select auth.uid()))
    and exists (
      select 1
      from public.creator_profiles cp
      where cp.id = creator_ratings.creator_id
        and cp.is_published = true
    )
  );

alter policy creator_ratings_own_update on public.creator_ratings
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

commit;

