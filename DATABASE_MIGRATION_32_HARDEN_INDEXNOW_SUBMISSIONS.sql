begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create table if not exists public.indexnow_submissions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    target_url text not null
        check (
            octet_length(target_url) between 1 and 2048
            and target_url ~ '^https://studihome[.]id/[a-z0-9][a-z0-9-]{0,62}/portfolio/[a-z0-9][a-z0-9-]{0,119}$'
        ),
    submitted_at timestamptz not null default clock_timestamp()
);

comment on table public.indexnow_submissions is
    'Internal, append-only reservations used to rate-limit and deduplicate authenticated IndexNow submissions.';

alter table public.indexnow_submissions enable row level security;

revoke all on table public.indexnow_submissions from public, anon, authenticated, service_role;
grant select on table public.indexnow_submissions to service_role;

create index if not exists indexnow_submissions_user_time_idx
    on public.indexnow_submissions (user_id, submitted_at desc);

create index if not exists indexnow_submissions_user_url_time_idx
    on public.indexnow_submissions (user_id, target_url, submitted_at desc);

create or replace function public.reserve_indexnow_submission(p_target_url text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
    v_user_id uuid := auth.uid();
    v_target_url text := btrim(coalesce(p_target_url, ''));
    v_recent_count integer := 0;
begin
    if v_user_id is null then
        return jsonb_build_object('allowed', false, 'reason', 'unauthorized');
    end if;

    if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
        return jsonb_build_object('allowed', false, 'reason', 'unauthorized');
    end if;

    if octet_length(v_target_url) not between 1 and 2048
       or v_target_url !~ '^https://studihome[.]id/[a-z0-9][a-z0-9-]{0,62}/portfolio/[a-z0-9][a-z0-9-]{0,119}$' then
        return jsonb_build_object('allowed', false, 'reason', 'invalid_url');
    end if;

    perform pg_advisory_xact_lock(
        pg_catalog.hashtextextended('indexnow:' || v_user_id::text, 0)
    );

    delete from public.indexnow_submissions
    where user_id = v_user_id
      and submitted_at < pg_catalog.clock_timestamp() - interval '30 days';

    if exists (
        select 1
        from public.indexnow_submissions
        where user_id = v_user_id
          and target_url = v_target_url
          and submitted_at >= pg_catalog.clock_timestamp() - interval '10 minutes'
    ) then
        return jsonb_build_object('allowed', false, 'reason', 'duplicate');
    end if;

    select count(*)::integer
      into v_recent_count
      from public.indexnow_submissions
     where user_id = v_user_id
       and submitted_at >= pg_catalog.clock_timestamp() - interval '1 hour';

    if v_recent_count >= 20 then
        return jsonb_build_object('allowed', false, 'reason', 'rate_limited');
    end if;

    insert into public.indexnow_submissions (user_id, target_url)
    values (v_user_id, v_target_url);

    return jsonb_build_object('allowed', true, 'reason', 'reserved');
end;
$function$;

comment on function public.reserve_indexnow_submission(text) is
    'Reserves an authenticated creator IndexNow submission with per-user replay and rate limits.';

revoke all on function public.reserve_indexnow_submission(text)
    from public, anon, authenticated, service_role;
grant execute on function public.reserve_indexnow_submission(text) to authenticated;

commit;