-- READ-ONLY fail-closed preflight for redundant entitlements composite index cleanup.
do $preflight$
declare
  v_redundant record;
  v_replacement record;
begin
  select
    i.indisunique,
    i.indisvalid,
    i.indisready,
    i.indnkeyatts,
    i.indnatts,
    i.indpred is null as no_predicate,
    i.indexprs is null as no_expression,
    pg_get_indexdef(i.indexrelid) as indexdef,
    con.conname as constraint_name
  into v_redundant
  from pg_index i
  join pg_class ci on ci.oid=i.indexrelid
  left join pg_constraint con on con.conindid=i.indexrelid
  where i.indrelid='public.entitlements'::regclass
    and ci.relname='idx_entitlements_user_product';

  if v_redundant is null then
    raise exception 'Preflight failed: idx_entitlements_user_product missing.';
  end if;
  if v_redundant.indisunique
     or not v_redundant.indisvalid
     or not v_redundant.indisready
     or v_redundant.indnkeyatts <> 2
     or v_redundant.indnatts <> 2
     or not v_redundant.no_predicate
     or not v_redundant.no_expression
     or v_redundant.constraint_name is not null
     or v_redundant.indexdef <> 'CREATE INDEX idx_entitlements_user_product ON public.entitlements USING btree (user_id, product_id)' then
    raise exception 'Preflight failed: redundant index contract drifted.';
  end if;

  select
    i.indisunique,
    i.indisvalid,
    i.indisready,
    i.indnkeyatts,
    i.indnatts,
    i.indpred is null as no_predicate,
    i.indexprs is null as no_expression,
    pg_get_indexdef(i.indexrelid) as indexdef,
    con.conname as constraint_name,
    con.contype as constraint_type,
    con.convalidated
  into v_replacement
  from pg_index i
  join pg_class ci on ci.oid=i.indexrelid
  join pg_constraint con on con.conindid=i.indexrelid
  where i.indrelid='public.entitlements'::regclass
    and ci.relname='entitlements_user_id_product_id_key';

  if v_replacement is null
     or not v_replacement.indisunique
     or not v_replacement.indisvalid
     or not v_replacement.indisready
     or v_replacement.indnkeyatts <> 2
     or v_replacement.indnatts <> 2
     or not v_replacement.no_predicate
     or not v_replacement.no_expression
     or v_replacement.constraint_name <> 'entitlements_user_id_product_id_key'
     or v_replacement.constraint_type <> 'u'
     or not v_replacement.convalidated
     or v_replacement.indexdef <> 'CREATE UNIQUE INDEX entitlements_user_id_product_id_key ON public.entitlements USING btree (user_id, product_id)' then
    raise exception 'Preflight failed: constraint-backed replacement contract drifted.';
  end if;

  if to_regclass('public.idx_entitlements_user_id') is null
     or to_regclass('public.idx_entitlements_product_id') is null
     or to_regclass('public.idx_entitlements_order_id') is null then
    raise exception 'Preflight failed: expected single-column FK indexes are missing.';
  end if;
end
$preflight$;

select 'entitlements_redundant_index_preflight'::text as check_name, true as passed;
