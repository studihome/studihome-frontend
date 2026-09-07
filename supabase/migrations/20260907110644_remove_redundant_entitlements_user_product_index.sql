-- Remove one proven redundant non-unique index.
-- Replacement UNIQUE constraint index on the identical key order remains intact.
do $migration$
declare
  v_redundant_def text;
  v_replacement_ok boolean;
begin
  select pg_get_indexdef(i.indexrelid)
    into v_redundant_def
  from pg_index i
  join pg_class ci on ci.oid=i.indexrelid
  left join pg_constraint con on con.conindid=i.indexrelid
  where i.indrelid='public.entitlements'::regclass
    and ci.relname='idx_entitlements_user_product'
    and i.indisunique=false
    and i.indisvalid=true
    and i.indisready=true
    and i.indpred is null
    and i.indexprs is null
    and i.indnkeyatts=2
    and i.indnatts=2
    and con.oid is null;

  if v_redundant_def is distinct from
     'CREATE INDEX idx_entitlements_user_product ON public.entitlements USING btree (user_id, product_id)' then
    raise exception 'Migration aborted: redundant index contract drifted.';
  end if;

  select exists (
    select 1
    from pg_index i
    join pg_class ci on ci.oid=i.indexrelid
    join pg_constraint con on con.conindid=i.indexrelid
    where i.indrelid='public.entitlements'::regclass
      and ci.relname='entitlements_user_id_product_id_key'
      and i.indisunique=true
      and i.indisvalid=true
      and i.indisready=true
      and i.indpred is null
      and i.indexprs is null
      and i.indnkeyatts=2
      and i.indnatts=2
      and con.conname='entitlements_user_id_product_id_key'
      and con.contype='u'
      and con.convalidated=true
      and pg_get_indexdef(i.indexrelid)=
        'CREATE UNIQUE INDEX entitlements_user_id_product_id_key ON public.entitlements USING btree (user_id, product_id)'
  ) into v_replacement_ok;

  if not v_replacement_ok then
    raise exception 'Migration aborted: valid constraint-backed replacement missing.';
  end if;

  execute 'drop index public.idx_entitlements_user_product';
end
$migration$;
