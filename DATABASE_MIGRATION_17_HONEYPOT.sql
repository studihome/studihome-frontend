begin;

create table if not exists public.ai_search_logs (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  source text not null default 'agent_search',
  created_at timestamptz not null default now(),
  constraint ai_search_logs_query_text_length_check
    check (char_length(query_text) between 3 and 120),
  constraint ai_search_logs_source_check
    check (source = 'agent_search')
);

comment on table public.ai_search_logs is
  'Server-side search-intent logs from the public Studihome AI Action endpoint.';
comment on column public.ai_search_logs.query_text is
  'Normalized search text submitted to the public agent-search endpoint; maximum 120 characters.';

alter table public.ai_search_logs enable row level security;

revoke all on table public.ai_search_logs from public, anon, authenticated;
grant insert, select on table public.ai_search_logs to service_role;
grant select on table public.ai_search_logs to authenticated;

drop policy if exists ai_search_logs_admin_select on public.ai_search_logs;
create policy ai_search_logs_admin_select
on public.ai_search_logs
for select
to authenticated
using ((select public.is_admin()));

create index if not exists ai_search_logs_created_at_idx
  on public.ai_search_logs (created_at desc);

commit;

