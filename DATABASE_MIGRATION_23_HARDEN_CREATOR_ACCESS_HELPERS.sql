-- Migration 23: harden creator access SECURITY DEFINER helpers.
-- Scope: explicit empty search_path only; authorization semantics and grants are preserved.

create or replace function public.has_premium_creator_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.entitlements e
    join public.products p on p.id = e.product_id
    where e.user_id = auth.uid()
      and e.status = 'ACTIVE'
      and coalesce(p.is_free, true) = false
      and coalesce(p.is_active, true) = true
  );
$function$;

create or replace function public.has_creator_workspace_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select public.is_admin() or public.has_premium_creator_access();
$function$;