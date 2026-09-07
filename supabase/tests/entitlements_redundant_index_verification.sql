-- Post-apply verification. No application-data mutation.
begin;

do $verify$
declare
  r record;
  v_plan text := '';
  v_replacement_ok boolean;
begin
  if to_regclass('public.idx_entitlements_user_product') is not null then
    raise exception 'Verification failed: redundant index still exists.';
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
      and con.conname='entitlements_user_id_product_id_key'
      and con.contype='u'
      and con.convalidated=true
  ) into v_replacement_ok;

  if not v_replacement_ok then
    raise exception 'Verification failed: replacement UNIQUE constraint/index invalid.';
  end if;

  if to_regclass('public.idx_entitlements_user_id') is null
     or to_regclass('public.idx_entitlements_product_id') is null
     or to_regclass('public.idx_entitlements_order_id') is null then
    raise exception 'Verification failed: expected FK-leading indexes missing.';
  end if;

  perform set_config('enable_seqscan','off',true);
  for r in execute $sql$
    explain (costs off)
    select *
    from public.entitlements
    where user_id='00000000-0000-4000-8000-000000000001'::uuid
      and product_id='00000000-0000-4000-8000-000000000002'::uuid
  $sql$
  loop
    v_plan := v_plan || ' ' || r."QUERY PLAN";
  end loop;

  if position('Seq Scan' in v_plan) > 0
     or (position('Index' in v_plan)=0 and position('Bitmap' in v_plan)=0) then
    raise exception 'Verification failed: representative lookup lost indexed path. Plan=%', v_plan;
  end if;
end
$verify$;

rollback;

select 'entitlements_redundant_index_verification'::text as check_name, true as passed;
