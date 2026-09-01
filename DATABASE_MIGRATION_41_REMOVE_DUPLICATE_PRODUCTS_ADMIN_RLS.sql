-- Migration 41: remove the legacy duplicate policy.
--
-- `admin_manage_products` has the identical authenticated-admin predicate,
-- so removing the duplicate leaves public reads and admin mutations unchanged.

drop policy if exists "hanya_admin_bisa_ubah_products" on public.products;
