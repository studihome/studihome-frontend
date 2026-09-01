begin;

set local lock_timeout = '5s';
set local statement_timeout = '30s';

create index if not exists creator_portfolio_like_adjustments_portfolio_id_idx
    on public.creator_portfolio_like_adjustments (portfolio_id);

create index if not exists creator_portfolio_likes_user_id_idx
    on public.creator_portfolio_likes (user_id);

commit;

