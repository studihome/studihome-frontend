-- Studihome migration 30
-- Retire the unused AI links feature after all production callers were removed.
-- Deliberately avoids CASCADE so unexpected dependencies fail safely.

set lock_timeout = '5s';
set statement_timeout = '30s';

drop table if exists public.ai_links;
