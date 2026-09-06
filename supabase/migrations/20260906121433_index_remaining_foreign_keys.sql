-- Applied to Supabase production as:
-- 20260906121433_index_remaining_foreign_keys
-- Purpose: add covering indexes for the five remaining FK columns reported
-- by Supabase Performance Advisor. Tables were small at apply time.

create index if not exists idx_creator_external_ratings_created_by
  on public.creator_external_ratings(created_by);

create index if not exists idx_creator_like_adjustments_created_by
  on public.creator_like_adjustments(created_by);

create index if not exists idx_creator_profiles_reviewed_by
  on public.creator_profiles(reviewed_by);

create index if not exists idx_entitlements_order_id
  on public.entitlements(order_id);

create index if not exists idx_orders_verified_by
  on public.orders(verified_by);

do $verify$
declare
  v_invalid integer;
begin
  select count(*)::integer
    into v_invalid
  from (
    values
      ('idx_creator_external_ratings_created_by'),
      ('idx_creator_like_adjustments_created_by'),
      ('idx_creator_profiles_reviewed_by'),
      ('idx_entitlements_order_id'),
      ('idx_orders_verified_by')
  ) as expected(index_name)
  left join pg_catalog.pg_class c
    on c.relname = expected.index_name
  left join pg_catalog.pg_namespace n
    on n.oid = c.relnamespace and n.nspname='public'
  left join pg_catalog.pg_index i
    on i.indexrelid = c.oid
  where c.oid is null
     or n.oid is null
     or i.indexrelid is null
     or not i.indisvalid
     or not i.indisready;

  if v_invalid <> 0 then
    raise exception 'FK index verification failed: one or more indexes are missing/invalid';
  end if;
end
$verify$;
