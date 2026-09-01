-- Migration 42: external Creator ratings are unpublished until an admin
-- deliberately reviews and makes them public.

create or replace function public.admin_add_creator_external_rating(
  p_creator_id uuid,
  p_reviewer_name text,
  p_rating integer,
  p_review text,
  p_source_label text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rating_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Akses Admin diperlukan.';
  end if;

  if not exists (select 1 from public.creator_profiles where id = p_creator_id) then
    raise exception 'Creator tidak ditemukan.';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating harus 1 sampai 5.';
  end if;

  if char_length(trim(coalesce(p_reviewer_name, ''))) < 1 then
    raise exception 'Nama pemberi ulasan wajib diisi.';
  end if;

  if char_length(trim(coalesce(p_source_label, ''))) < 1 then
    raise exception 'Sumber ulasan wajib diisi.';
  end if;

  insert into public.creator_external_ratings
    (creator_id, reviewer_name, rating, review, source_label, is_visible, created_by)
  values
    (p_creator_id,
     left(trim(p_reviewer_name), 120),
     p_rating,
     left(trim(coalesce(p_review, '')), 800),
     left(trim(p_source_label), 160),
     false,
     auth.uid())
  returning id into v_rating_id;

  return jsonb_build_object(
    'success', true,
    'rating_id', v_rating_id,
    'creator_id', p_creator_id,
    'is_visible', false
  );
end;
$$;

create or replace function public.admin_set_creator_external_rating_visibility(
  p_rating_id uuid,
  p_visible boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Akses Admin diperlukan.';
  end if;

  if not exists (
    select 1
    from public.creator_external_ratings
    where id = p_rating_id
  ) then
    raise exception 'Rating eksternal tidak ditemukan.';
  end if;

  update public.creator_external_ratings
  set is_visible = p_visible,
      updated_at = now()
  where id = p_rating_id;

  return jsonb_build_object(
    'success', true,
    'rating_id', p_rating_id,
    'is_visible', p_visible
  );
end;
$$;

revoke all on function public.admin_add_creator_external_rating(uuid, text, integer, text, text)
  from public, anon;
grant execute on function public.admin_add_creator_external_rating(uuid, text, integer, text, text)
  to authenticated;

revoke all on function public.admin_set_creator_external_rating_visibility(uuid, boolean)
  from public, anon;
grant execute on function public.admin_set_creator_external_rating_visibility(uuid, boolean)
  to authenticated;
