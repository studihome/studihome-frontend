-- Exact rollback for 20260907110000_remove_redundant_entitlements_user_product_index.sql
create index idx_entitlements_user_product
  on public.entitlements using btree (user_id, product_id);
