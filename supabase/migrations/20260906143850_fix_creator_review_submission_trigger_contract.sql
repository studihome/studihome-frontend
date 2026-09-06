-- Applied to Supabase production as:
-- 20260906143850_fix_creator_review_submission_trigger_contract
-- Fixes an existing conflict where submit_creator_for_review() was blocked by
-- enforce_creator_review_rules(). The RPC sets a transaction-local marker
-- bound to auth.uid(); direct client updates remain denied.

create or replace function public.enforce_creator_review_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_service_role boolean := coalesce(auth.role(), '') = 'service_role';
  v_seed_mode boolean := coalesce(current_setting('app.managed_creator_seed', true), '') = 'true';
  v_managed boolean := coalesce(new.managed_by_studihome, false);
  v_submit_user text := coalesce(current_setting('app.creator_review_submit_user', true), '');
  v_submit_mode boolean :=
    tg_op = 'UPDATE'
    and auth.uid() is not null
    and v_submit_user = auth.uid()::text
    and new.user_id = auth.uid()
    and new.review_status = 'PENDING'
    and new.review_note is null
    and new.review_requested_at is not null
    and new.reviewed_at is not distinct from old.reviewed_at
    and new.reviewed_by is not distinct from old.reviewed_by
    and new.is_verified is not distinct from old.is_verified
    and new.is_published = false;
begin
  if tg_op = 'INSERT' then
    if v_service_role or v_seed_mode or v_managed or public.is_admin() then
      return new;
    end if;
    new.review_status := 'DRAFT';
    new.review_note := null;
    new.review_requested_at := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.is_verified := false;
    new.is_published := false;
    return new;
  end if;

  if tg_op = 'UPDATE' and v_managed then
    if not public.is_admin() and not v_service_role and not v_seed_mode then
      if new.managed_by_studihome is distinct from old.managed_by_studihome then
        raise exception 'Status pengelolaan Studihome hanya dapat diubah Admin.';
      end if;
    end if;
    return new;
  end if;

  if v_submit_mode then
    return new;
  end if;

  if tg_op = 'UPDATE' and not public.is_admin() and not v_service_role and not v_seed_mode then
    if new.review_status is distinct from old.review_status
       or new.review_note is distinct from old.review_note
       or new.review_requested_at is distinct from old.review_requested_at
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by then
      raise exception 'Status review dikelola sistem/Admin.';
    end if;
    if new.is_published = true and (old.review_status is distinct from 'APPROVED' or old.is_verified is not true) then
      raise exception 'Profil baru bisa tayang setelah disetujui Admin.';
    end if;
    if new.is_verified is distinct from old.is_verified then
      raise exception 'Status verifikasi hanya bisa diubah Admin.';
    end if;
  end if;

  return new;
end;
$function$;

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

  perform pg_catalog.set_config(
    'app.creator_review_submit_user',
    '',
    true
  );

  if not found then
    raise exception 'Profil Creator tidak dapat diajukan.'
      using errcode = 'P0002';
  end if;

  return jsonb_build_object('success', true, 'status', 'PENDING');
end;
$function$;
