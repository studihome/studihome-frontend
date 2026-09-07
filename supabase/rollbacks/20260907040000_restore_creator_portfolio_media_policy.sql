-- Explicit rollback for:
-- 20260907040000_reconcile_creator_portfolio_media_policy.sql
--
-- Restores the exact pre-migration media CHECK constraint semantics and
-- VALID / NOT VALID states audited on 7 Sep 2026.

alter table public.creator_portfolios
  add constraint creator_portfolios_external_media_policy
  check (
    media_type = 'link' and media_url ~* '^https://'
    or media_type = 'image' and media_url ~* '^https://'
    or media_type = 'youtube' and media_url ~* '^https://([^/]+\.)?(youtube\.com|youtu\.be)(/|$)'
    or media_type = 'drive' and media_url ~* '^https://([^/]+\.)?(drive\.google\.com|docs\.google\.com)(/|$)'
    or media_type = 'tiktok' and media_url ~* '^https://([^/]+\.)?tiktok\.com(/|$)'
    or media_type = 'instagram' and media_url ~* '^https://([^/]+\.)?instagram\.com(/|$)'
  );

alter table public.creator_portfolios
  add constraint creator_portfolios_media_type_check
  check (
    lower(coalesce(media_type,'')) = any (
      array['image','youtube','drive','tiktok','instagram','video','link']
    )
  ) not valid;

alter table public.creator_portfolios
  add constraint creator_portfolios_media_url_https_check
  check (media_url ~* '^https?://');

alter table public.creator_portfolios
  add constraint creator_portfolios_supported_media_check
  check (
    case lower(coalesce(media_type,''))
      when 'image' then media_url ~* '^https://'
      when 'video' then media_url ~* '^https://'
      when 'link' then media_url ~* '^https://'
      when 'youtube' then media_url ~* '^https://(www\.)?(youtube\.com|youtu\.be)/'
      when 'drive' then media_url ~* '^https://(www\.)?(drive\.google\.com|docs\.google\.com)/'
      when 'tiktok' then media_url ~* '^https://(www\.)?tiktok\.com/'
      when 'instagram' then media_url ~* '^https://(www\.)?instagram\.com/'
      else false
    end
  ) not valid;

alter table public.creator_portfolios
  drop constraint creator_portfolios_media_policy_v2;
