-- Migration 18: harden the admin-only portfolio Like adjustment RPC.
-- Keeps the existing signature and success response used by the active admin UI.

create or replace function public.admin_add_portfolio_like_adjustment(
    p_portfolio_id uuid,
    p_delta_count integer,
    p_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
    if (select auth.uid()) is null or not public.is_admin() then
        raise exception 'Akses Admin diperlukan.'
            using errcode = '42501';
    end if;

    if p_portfolio_id is null then
        raise exception 'Portfolio ID wajib diisi.'
            using errcode = '22023';
    end if;

    if p_delta_count is null
       or p_delta_count = 0
       or abs(p_delta_count::bigint) > 10000 then
        raise exception 'Delta Like harus berada di antara -10000 dan 10000, serta tidak boleh 0.'
            using errcode = '22023';
    end if;

    if length(coalesce(p_reason, '')) > 500 then
        raise exception 'Alasan penyesuaian maksimal 500 karakter.'
            using errcode = '22023';
    end if;

    if not exists (
        select 1
        from public.creator_portfolios
        where id = p_portfolio_id
    ) then
        raise exception 'Portofolio tidak ditemukan.'
            using errcode = '23503';
    end if;

    insert into public.creator_portfolio_like_adjustments (
        portfolio_id,
        delta_count,
        reason
    )
    values (
        p_portfolio_id,
        p_delta_count,
        coalesce(
            nullif(btrim(p_reason), ''),
            'Admin manual portfolio adjustment'
        )
    );

    return '{"success": true}'::jsonb;
end;
$function$;

revoke all privileges
on function public.admin_add_portfolio_like_adjustment(uuid, integer, text)
from public;

revoke all privileges
on function public.admin_add_portfolio_like_adjustment(uuid, integer, text)
from anon;

revoke all privileges
on function public.admin_add_portfolio_like_adjustment(uuid, integer, text)
from authenticated;

grant execute
on function public.admin_add_portfolio_like_adjustment(uuid, integer, text)
to authenticated;

comment on function public.admin_add_portfolio_like_adjustment(uuid, integer, text)
is 'Admin-only audited adjustment of public portfolio Like totals.';
