-- Migration 21: make public Social Proof originate only from verified paid
-- orders and expose a privacy-minimized read contract.

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
            when array_length(regexp_split_to_array(btrim(profile.name), E'\\s+'), 1) > 1 then
                left(split_part(btrim(profile.name), ' ', 1), 1)
                || '*** '
                || left(
                    (regexp_split_to_array(btrim(profile.name), E'\\s+'))[
                        array_length(regexp_split_to_array(btrim(profile.name), E'\\s+'), 1)
                    ],
                    1
                )
                || '.'
            else left(btrim(profile.name), 1) || '***'
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
is 'Privacy-minimized public social proof from server-verified paid orders only.';

create or replace view public.v_social_proof_recent
with (security_invoker = true)
as
select
    case
        when nullif(btrim(profile.name), '') is null then 'Member Studihome'
        when array_length(regexp_split_to_array(btrim(profile.name), E'\\s+'), 1) > 1 then
            left(split_part(btrim(profile.name), ' ', 1), 1)
            || '*** '
            || left(
                (regexp_split_to_array(btrim(profile.name), E'\\s+'))[
                    array_length(regexp_split_to_array(btrim(profile.name), E'\\s+'), 1)
                ],
                1
            )
            || '.'
        else left(btrim(profile.name), 1) || '***'
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

drop policy if exists social_proof_items_select_active_public
on public.social_proof_items;
revoke all on table public.social_proof_items from anon;
revoke all on table public.social_proof_items from authenticated;
grant select, insert, update, delete
on table public.social_proof_items
to authenticated;
