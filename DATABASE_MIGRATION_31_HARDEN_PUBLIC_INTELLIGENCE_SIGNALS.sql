begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Search-intent logs are internal. Public clients may only use the constrained RPC.
alter table public.ai_search_logs enable row level security;

alter table public.ai_search_logs
  alter column source set default 'agent_search',
  alter column source set not null;

alter table public.ai_search_logs
  drop constraint if exists ai_search_logs_query_text_length_check,
  drop constraint if exists ai_search_logs_source_check;

alter table public.ai_search_logs
  add constraint ai_search_logs_query_text_length_check
    check (char_length(query_text) between 3 and 120),
  add constraint ai_search_logs_source_check
    check (source = 'agent_search');

create index if not exists ai_search_logs_created_at_idx
  on public.ai_search_logs (created_at desc);

drop policy if exists "Enable insert for anon logging" on public.ai_search_logs;
drop policy if exists "Enable read for admin only" on public.ai_search_logs;
drop policy if exists ai_search_logs_admin_select on public.ai_search_logs;

revoke all on table public.ai_search_logs from public, anon, authenticated, service_role;
grant select on table public.ai_search_logs to service_role;

create or replace function public.record_ai_search(p_query_text text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_query text;
  v_recent_count integer;
begin
  if p_query_text is null or octet_length(p_query_text) > 512 then
    return false;
  end if;

  v_query := regexp_replace(trim(p_query_text), '[[:cntrl:]]+', ' ', 'g');
  v_query := regexp_replace(v_query, '[[:space:]]+', ' ', 'g');
  v_query := regexp_replace(
    v_query,
    '[[:alnum:]._%+-]+@[[:alnum:].-]+[.][[:alpha:]]{2,}',
    '[redacted-email]',
    'gi'
  );
  v_query := regexp_replace(
    v_query,
    '(\+?62|0)[0-9][0-9[:space:]-]{7,}[0-9]',
    '[redacted-phone]',
    'g'
  );
  v_query := left(v_query, 120);

  if char_length(v_query) < 3 then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'record-ai-search:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MI'),
      0
    )
  );

  if exists (
    select 1
    from public.ai_search_logs l
    where l.query_text = v_query
      and l.created_at >= clock_timestamp() - interval '5 minutes'
  ) then
    return false;
  end if;

  select count(*)::integer
  into v_recent_count
  from public.ai_search_logs l
  where l.created_at >= clock_timestamp() - interval '1 minute';

  if v_recent_count >= 60 then
    return false;
  end if;

  insert into public.ai_search_logs (query_text, source)
  values (v_query, 'agent_search');

  return true;
end;
$function$;

revoke all on function public.record_ai_search(text) from public, anon, authenticated, service_role;
grant execute on function public.record_ai_search(text) to anon, service_role;

-- SMART demand accepts only enumerated aggregate keys and bounded traffic.
alter table public.smart_demand_signals enable row level security;

alter table public.smart_demand_signals
  drop constraint if exists smart_demand_signals_intent_len,
  drop constraint if exists smart_demand_signals_category_len,
  drop constraint if exists smart_demand_signals_intent_allowed,
  drop constraint if exists smart_demand_signals_category_allowed;

alter table public.smart_demand_signals
  add constraint smart_demand_signals_intent_allowed
    check (intent_key = any (array[
      'general',
      'content-video',
      'automation',
      'web',
      'education',
      'business-growth'
    ]::text[])),
  add constraint smart_demand_signals_category_allowed
    check (category_key = any (array[
      'general-ai',
      'ai-video-content',
      'ai-automation',
      'ai-website',
      'ai-education',
      'ai-business',
      'ai-design'
    ]::text[]));

create index if not exists smart_demand_signals_created_at_idx
  on public.smart_demand_signals (created_at desc);

drop policy if exists smart_demand_signals_no_direct_insert on public.smart_demand_signals;
drop policy if exists smart_demand_signals_no_direct_read on public.smart_demand_signals;

revoke all on table public.smart_demand_signals from public, anon, authenticated, service_role;
grant select on table public.smart_demand_signals to service_role;

create or replace function public.record_smart_demand(
  p_intent_key text,
  p_category_key text,
  p_session_key uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_intent text := lower(trim(coalesce(p_intent_key, '')));
  v_category text := lower(trim(coalesce(p_category_key, '')));
  v_session_count integer;
  v_recent_count integer;
  v_rows integer;
begin
  if p_session_key is null then
    return false;
  end if;

  if not (v_intent = any (array[
    'general',
    'content-video',
    'automation',
    'web',
    'education',
    'business-growth'
  ]::text[])) then
    return false;
  end if;

  if not (v_category = any (array[
    'general-ai',
    'ai-video-content',
    'ai-automation',
    'ai-website',
    'ai-education',
    'ai-business',
    'ai-design'
  ]::text[])) then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(
      'record-smart-demand:' || to_char(clock_timestamp(), 'YYYYMMDDHH24MI'),
      0
    )
  );

  select count(*)::integer
  into v_recent_count
  from public.smart_demand_signals s
  where s.created_at >= clock_timestamp() - interval '1 minute';

  if v_recent_count >= 120 then
    return false;
  end if;

  select count(*)::integer
  into v_session_count
  from public.smart_demand_signals s
  where s.demand_day = current_date
    and s.session_key = p_session_key;

  if v_session_count >= 12 then
    return false;
  end if;

  insert into public.smart_demand_signals (
    demand_day,
    intent_key,
    category_key,
    session_key
  )
  values (
    current_date,
    v_intent,
    v_category,
    p_session_key
  )
  on conflict (demand_day, session_key, intent_key, category_key)
  do nothing;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$function$;

revoke all on function public.record_smart_demand(text, text, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.record_smart_demand(text, text, uuid)
  to anon, authenticated, service_role;

revoke all on function public.get_smart_demand_summary(integer)
  from public, anon, authenticated, service_role;
grant execute on function public.get_smart_demand_summary(integer)
  to authenticated, service_role;

commit;
