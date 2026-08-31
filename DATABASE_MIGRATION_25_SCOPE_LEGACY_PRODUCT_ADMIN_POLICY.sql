-- Migration 25: remove the anonymous profiles dependency from the legacy product admin policy.
-- Public active-product reads remain governed by semua_orang_bisa_baca_products.

alter policy "hanya_admin_bisa_ubah_products"
on public.products
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));