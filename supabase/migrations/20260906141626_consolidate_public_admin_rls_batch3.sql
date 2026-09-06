-- Applied to Supabase production as:
-- 20260906141626_consolidate_public_admin_rls_batch3
-- Splits anon/authenticated SELECT visibility and admin writes for the final
-- public/admin policy overlaps.

drop policy ai_categories_admin_manage on public.ai_categories;
drop policy ai_categories_public_read on public.ai_categories;
create policy ai_categories_anon_read_active
on public.ai_categories for select to anon
using (is_active = true);
create policy ai_categories_authenticated_read
on public.ai_categories for select to authenticated
using (is_active = true or (select public.is_admin()));
create policy ai_categories_admin_insert
on public.ai_categories for insert to authenticated
with check ((select public.is_admin()));
create policy ai_categories_admin_update
on public.ai_categories for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy ai_categories_admin_delete
on public.ai_categories for delete to authenticated
using ((select public.is_admin()));

drop policy creator_external_ratings_admin_manage on public.creator_external_ratings;
drop policy creator_external_ratings_public_read on public.creator_external_ratings;
create policy creator_external_ratings_anon_read
on public.creator_external_ratings for select to anon
using (
  is_visible = true
  and exists (
    select 1 from public.creator_profiles cp
    where cp.id = creator_external_ratings.creator_id
      and cp.is_published = true
  )
);
create policy creator_external_ratings_authenticated_read
on public.creator_external_ratings for select to authenticated
using (
  (
    is_visible = true
    and exists (
      select 1 from public.creator_profiles cp
      where cp.id = creator_external_ratings.creator_id
        and cp.is_published = true
    )
  )
  or (select public.is_admin())
);
create policy creator_external_ratings_admin_insert
on public.creator_external_ratings for insert to authenticated
with check ((select public.is_admin()));
create policy creator_external_ratings_admin_update
on public.creator_external_ratings for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy creator_external_ratings_admin_delete
on public.creator_external_ratings for delete to authenticated
using ((select public.is_admin()));

drop policy admin_manage_products on public.products;
drop policy semua_orang_bisa_baca_products on public.products;
create policy products_anon_read_active
on public.products for select to anon
using (is_active = true);
create policy products_authenticated_read
on public.products for select to authenticated
using (is_active = true or (select public.is_admin()));
create policy products_admin_insert
on public.products for insert to authenticated
with check ((select public.is_admin()));
create policy products_admin_update
on public.products for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
create policy products_admin_delete
on public.products for delete to authenticated
using ((select public.is_admin()));
