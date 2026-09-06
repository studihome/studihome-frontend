-- Applied to Supabase production as:
-- 20260906143929_harden_creator_review_submission_rowcount
-- Captures UPDATE ROW_COUNT before clearing the transaction-local marker,
-- because PL/pgSQL FOUND is changed by subsequent PERFORM statements.

create or replace function public.submit_creator_for_review()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_creator public.creator_profiles%rowtype;
  v_has_primary boolean;
  v_has_service boolean;
  v_rows integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Sesi login diperlukan.'
      using errcode = '42501';
  end if;

  select * into v_creator
  from public.creator_profiles
  where user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Buat profil Creator dulu ya.';
  end if;

  if not public.is_creator_eligible() then
    raise exception 'Akses Premium belum aktif. Pastikan kamu punya minimal satu produk Premium Studihome.';
  end if;

  if trim(coalesce(v_creator.display_name, '')) = '' then
    raise exception 'Nama Creator belum diisi.';
  end if;

  select exists(
    select 1 from public.creator_category_members
    where creator_id = v_creator.id and is_primary = true
  ) into v_has_primary;

  if not v_has_primary then
    raise exception 'Pilih satu kategori utama dulu, ya.';
  end if;

  select exists(
    select 1 from public.creator_services
    where creator_id = v_creator.id and is_active = true
  ) into v_has_service;

  if not v_has_service then
    raise exception 'Tambahkan minimal satu jasa aktif dulu, ya.';
  end if;

  if v_creator.review_status = 'PENDING' then
    return jsonb_build_object(
      'success', true,
      'status', 'PENDING',
      'message', 'Profilmu masih sedang dicek Admin.'
    );
  end if;

  perform pg_catalog.set_config(
    'app.creator_review_submit_user',
    auth.uid()::text,
    true
  );

  update public.creator_profiles
  set review_status = 'PENDING',
      review_note = null,
      review_requested_at = now(),
      is_published = false,
      updated_at = now()
  where id = v_creator.id
    and user_id = auth.uid();

  get diagnostics v_rows = row_count;

  perform pg_catalog.set_config(
    'app.creator_review_submit_user',
    '',
    true
  );

  if v_rows <> 1 then
    raise exception 'Profil Creator tidak dapat diajukan.'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object('success', true, 'status', 'PENDING');
end;
$function$;
