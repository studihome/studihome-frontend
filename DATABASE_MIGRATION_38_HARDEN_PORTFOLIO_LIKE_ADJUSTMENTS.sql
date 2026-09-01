-- Migration 38: make portfolio Like adjustments attributable and non-negative.
-- Existing rows remain valid: created_by is intentionally nullable for historical data.

alter table public.creator_portfolio_like_adjustments
  add column if not exists created_by uuid;

do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'creator_portfolio_like_adjustments_created_by_fkey'
      and conrelid = 'public.creator_portfolio_like_adjustments'::regclass
  ) then
    alter table public.creator_portfolio_like_adjustments
      add constraint creator_portfolio_like_adjustments_created_by_fkey
      foreign key (created_by) references public.profiles(id) on delete restrict;
  end if;
end;
$migration$;

create index if not exists creator_portfolio_like_adjustments_created_by_idx
  on public.creator_portfolio_like_adjustments (created_by);

create or replace function public.admin_add_portfolio_like_adjustment(
  p_portfolio_id uuid,
  p_delta_count integer,
  p_reason text default ''
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
    raise exception 'Akses Admin diperlukan.' using errcode = '42501';
  end if;

  if p_portfolio_id is null then
    raise exception 'Portfolio ID wajib diisi.' using errcode = '22023';
  end if;

  if p_delta_count is null
     or p_delta_count = 0
     or abs(p_delta_count::bigint) > 10000 then
    raise exception 'Delta Like harus berada di antara -10000 dan 10000, serta tidak boleh 0.'
      using errcode = '22023';
  end if;

  if length(coalesce(p_reason, '')) > 500 then
    raise exception 'Alasan penyesuaian maksimal 500 karakter.' using errcode = '22023';
  end if;

  perform 1
  from public.creator_portfolios
  where id = p_portfolio_id
  for update;

  if not found then
    raise exception 'Portofolio tidak ditemukan.' using errcode = '23503';
  end if;

  select
    (select count(*)::bigint
       from public.creator_portfolio_likes
      where portfolio_id = p_portfolio_id)
    +
    (select coalesce(sum(delta_count), 0)::bigint
       from public.creator_portfolio_like_adjustments
      where portfolio_id = p_portfolio_id)
  into v_current_likes;

  if v_current_likes + p_delta_count::bigint < 0 then
    raise exception 'Pengurangan Like melebihi total Like saat ini.' using errcode = '22023';
  end if;

  insert into public.creator_portfolio_like_adjustments (
    portfolio_id,
    delta_count,
    reason,
    created_by
  )
  values (
    p_portfolio_id,
    p_delta_count,
    coalesce(nullif(btrim(p_reason), ''), 'Admin manual portfolio adjustment'),
    (select auth.uid())
  );

  return jsonb_build_object(
    'success', true,
    'portfolio_id', p_portfolio_id,
    'delta_count', p_delta_count
  );
end;
$function$;

revoke all on function public.admin_add_portfolio_like_adjustment(uuid, integer, text) from public;
revoke all on function public.admin_add_portfolio_like_adjustment(uuid, integer, text) from anon;
grant execute on function public.admin_add_portfolio_like_adjustment(uuid, integer, text) to authenticated;

