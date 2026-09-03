-- Migration 22: show full member names in public Social Proof.
-- Replaces the privacy-masked member_name contract (Migration 21) with the
-- member's full name, by owner request. Everything else stays identical:
--   - Only server-verified paid orders (status VERIFIED + payment_status PAID
--     + payment_confirmed_at + verified_by) are eligible.
--   - Empty names still fall back to 'Member Studihome'.
--   - Grants/revokes are unchanged (anon/authenticated can SELECT).

create or replace function public.get_public_social_proof_recent(p_limit integer default 10)
returns table (
    member_name text,
    product_title text,
    created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
    select
        case
            when nullif(btrim(profile.name), '') is null then 'Member Studihome'
            else btrim(profile.name)
        end as member_name,
        product.title as product_title,
        orders.payment_confirmed_at as created_at
    from public.orders
    join public.products product on product.id = orders.product_id
    join public.profiles profile on profile.id = orders.user_id
    where orders.status = 'VERIFIED'
      and orders.payment_status = 'PAID'
      and orders.payment_confirmed_at is not null
      and orders.verified_by is not null
    order by orders.payment_confirmed_at desc
    limit least(greatest(coalesce(p_limit, 10), 1), 20);
$function$;

revoke all on function public.get_public_social_proof_recent(integer)
from public, anon, authenticated;
grant execute on function public.get_public_social_proof_recent(integer)
to anon, authenticated;
comment on function public.get_public_social_proof_recent(integer)
is 'Public social proof from server-verified paid orders; shows the member full name (Migration 22).';

create or replace view public.v_social_proof_recent
with (security_invoker = true)
as
select
    case
        when nullif(btrim(profile.name), '') is null then 'Member Studihome'
        else btrim(profile.name)
    end as member_name,
    product.title as product_title,
    orders.payment_confirmed_at as created_at
from public.orders
join public.products product on product.id = orders.product_id
join public.profiles profile on profile.id = orders.user_id
where orders.status = 'VERIFIED'
  and orders.payment_status = 'PAID'
  and orders.payment_confirmed_at is not null
  and orders.verified_by is not null;

revoke all on table public.v_social_proof_recent
from public, anon, authenticated;
grant select on table public.v_social_proof_recent
to anon, authenticated;
comment on view public.v_social_proof_recent
is 'Public social proof mirror showing full member names (Migration 22).';

-- Verification
select 'M22_fn_created' as check_name, proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where proname = 'get_public_social_proof_recent';

select 'M22_fn_sample' as check_name, member_name, product_title
from public.get_public_social_proof_recent(3);

select 'M22_view_sample' as check_name, member_name, product_title
from public.v_social_proof_recent
limit 3;
