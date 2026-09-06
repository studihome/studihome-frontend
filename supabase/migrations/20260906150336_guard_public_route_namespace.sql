-- Applied to Supabase production as:
-- 20260906150336_guard_public_route_namespace
-- Prevents future collisions between root-level Creator usernames, AI
-- category slugs, and Studihome reserved/system routes. Advisory transaction
-- locks serialize concurrent claims for the same public route slug.

create or replace function public.is_reserved_public_route_slug(p_slug text)
returns boolean
language sql
immutable
set search_path = ''
as $function$
  select lower(btrim(coalesce(p_slug, ''))) = any (
    array[
      'admin','login','logout','dashboard','products','product',
      'terased','teras','studio-ai','studioai','api','assets',
      'auth','callback','functions','storage','supabase','vercel',
      'favicon','robots','sitemap','foyer','balkon','blog',
      'dapur','kamar','creator-studio','ruang-kerja',
      'privasi','ketentuan','ai-video','ai-automation','ai-content',
      'ai-untuk-guru','ai-untuk-umkm'
    ]::text[]
  );
$function$;

revoke all on function public.is_reserved_public_route_slug(text)
from public, anon, authenticated;
grant execute on function public.is_reserved_public_route_slug(text)
to service_role;

create or replace function public.guard_creator_public_route_namespace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_slug text := lower(btrim(coalesce(new.username, '')));
begin
  if tg_op = 'UPDATE'
     and lower(btrim(coalesce(new.username, '')))
         = lower(btrim(coalesce(old.username, ''))) then
    return new;
  end if;

  if v_slug = '' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('studihome-public-route:' || v_slug, 0)
  );

  if public.is_reserved_public_route_slug(v_slug) then
    raise exception 'Username Creator menggunakan alamat yang dicadangkan Studihome.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.ai_categories c
    where lower(btrim(c.slug)) = v_slug
  ) then
    raise exception 'Username Creator bertabrakan dengan alamat kategori Studihome.'
      using errcode = '23505';
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_creator_public_route_namespace()
from public, anon, authenticated;
grant execute on function public.guard_creator_public_route_namespace()
to service_role;

drop trigger if exists trg_creator_public_route_namespace
on public.creator_profiles;

create trigger trg_creator_public_route_namespace
before insert or update of username
on public.creator_profiles
for each row
execute function public.guard_creator_public_route_namespace();

create or replace function public.guard_category_public_route_namespace()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_slug text := lower(btrim(coalesce(new.slug, '')));
begin
  if tg_op = 'UPDATE'
     and lower(btrim(coalesce(new.slug, '')))
         = lower(btrim(coalesce(old.slug, ''))) then
    return new;
  end if;

  if v_slug = '' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('studihome-public-route:' || v_slug, 0)
  );

  if public.is_reserved_public_route_slug(v_slug) then
    raise exception 'Slug kategori menggunakan alamat yang dicadangkan Studihome.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.creator_profiles cp
    where lower(btrim(cp.username)) = v_slug
  ) then
    raise exception 'Slug kategori bertabrakan dengan username Creator.'
      using errcode = '23505';
  end if;

  return new;
end;
$function$;

revoke all on function public.guard_category_public_route_namespace()
from public, anon, authenticated;
grant execute on function public.guard_category_public_route_namespace()
to service_role;

drop trigger if exists trg_category_public_route_namespace
on public.ai_categories;

create trigger trg_category_public_route_namespace
before insert or update of slug
on public.ai_categories
for each row
execute function public.guard_category_public_route_namespace();
