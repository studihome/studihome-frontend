-- Applied to Supabase production as:
-- 20260906121149_remove_duplicate_core_fk_indexes
-- Purpose: retain one canonical btree index per FK lookup and remove only
-- exact, non-constraint, non-replica-identity duplicates.

do $precheck$
declare
  v_bad integer;
begin
  with pairs(drop_name, keep_name) as (
    values
      ('idx_entitlements_product','idx_entitlements_product_id'),
      ('idx_entitlements_user','idx_entitlements_user_id'),
      ('idx_modules_product','idx_modules_product_id'),
      ('idx_orders_user','idx_orders_user_id')
  ),
  attrs as (
    select
      c.relname as index_name,
      i.indrelid,
      i.indisunique,
      i.indisprimary,
      i.indisvalid,
      i.indisready,
      i.indisreplident,
      i.indkey::text as indkey,
      i.indclass::text as indclass,
      coalesce(pg_get_expr(i.indexprs, i.indrelid),'') as index_expr,
      coalesce(pg_get_expr(i.indpred, i.indrelid),'') as predicate,
      exists (
        select 1 from pg_catalog.pg_constraint con
        where con.conindid = c.oid
      ) as constraint_backed
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_index i on i.indexrelid = c.oid
    where n.nspname='public'
  )
  select count(*)::integer
    into v_bad
  from pairs p
  left join attrs d on d.index_name=p.drop_name
  left join attrs k on k.index_name=p.keep_name
  where d.index_name is null
     or k.index_name is null
     or d.indrelid <> k.indrelid
     or d.indisunique <> k.indisunique
     or d.indisprimary <> k.indisprimary
     or d.indkey <> k.indkey
     or d.indclass <> k.indclass
     or d.index_expr <> k.index_expr
     or d.predicate <> k.predicate
     or d.constraint_backed
     or d.indisreplident
     or not d.indisvalid
     or not d.indisready
     or not k.indisvalid
     or not k.indisready;

  if v_bad <> 0 then
    raise exception 'Duplicate-index precheck failed: index pairs are no longer safely equivalent';
  end if;
end
$precheck$;

drop index if exists public.idx_entitlements_product;
drop index if exists public.idx_entitlements_user;
drop index if exists public.idx_modules_product;
drop index if exists public.idx_orders_user;

do $verify$
begin
  if to_regclass('public.idx_entitlements_product') is not null
     or to_regclass('public.idx_entitlements_user') is not null
     or to_regclass('public.idx_modules_product') is not null
     or to_regclass('public.idx_orders_user') is not null then
    raise exception 'Duplicate-index cleanup verification failed: a retired index still exists';
  end if;

  if to_regclass('public.idx_entitlements_product_id') is null
     or to_regclass('public.idx_entitlements_user_id') is null
     or to_regclass('public.idx_modules_product_id') is null
     or to_regclass('public.idx_orders_user_id') is null then
    raise exception 'Duplicate-index cleanup verification failed: a canonical index is missing';
  end if;
end
$verify$;
