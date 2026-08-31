-- Migration 22: harden the custom email-verification token contract.

create unique index if not exists email_verification_tokens_one_unused_per_user_idx
on public.email_verification_tokens (user_id)
where used_at is null;

create or replace function public.consume_email_verification_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_token text;
    v_hash text;
    v_token_id uuid;
    v_user_id uuid;
begin
    v_token := lower(btrim(coalesce(p_token, '')));

    if v_token !~ '^[0-9a-f]{64}$' then
        raise exception 'Tautan verifikasi tidak valid atau sudah tidak berlaku.'
            using errcode = '22023';
    end if;

    v_hash := encode(
        extensions.digest(
            convert_to(v_token, 'UTF8'),
            'sha256'
        ),
        'hex'
    );

    select token.id, token.user_id
      into v_token_id, v_user_id
    from public.email_verification_tokens token
    where token.token_hash = v_hash
      and token.used_at is null
      and token.expires_at > now()
    limit 1
    for update;

    if v_token_id is null then
        raise exception 'Tautan verifikasi tidak valid atau sudah tidak berlaku.'
            using errcode = '22023';
    end if;

    update public.profiles
       set email_verified = true,
           updated_at = now()
     where id = v_user_id;

    if not found then
        raise exception 'Profil pengguna tidak ditemukan.'
            using errcode = 'P0002';
    end if;

    update public.email_verification_tokens
       set used_at = now()
     where id = v_token_id
       and used_at is null;

    if not found then
        raise exception 'Tautan verifikasi tidak valid atau sudah tidak berlaku.'
            using errcode = '22023';
    end if;

    return jsonb_build_object(
        'success', true,
        'verified', true
    );
end;
$function$;

revoke all on function public.consume_email_verification_token(text)
from public, anon, authenticated;
grant execute on function public.consume_email_verification_token(text)
to anon, authenticated;

revoke all on table public.email_verification_tokens
from anon, authenticated;
