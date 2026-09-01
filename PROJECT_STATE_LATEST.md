# STUDIHOME — PROJECT STATE LATEST

Snapshot: 1 September 2026  
Status: **AUDIT OPEN — 72% release-verified**

## Baseline

- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Functional source baseline SHA: `6bfb0bd3dbf390dea479731d1d0189d27ce5e058`
- Commits berikutnya pada snapshot ini adalah documentation-only; current main wajib dibaca dinamis
- Vercel check terakhir: SUCCESS
- Production-alias SHA: NOT VERIFIED pada snapshot ini
- Frontend: static HTML/CSS/Vanilla JS
- Database/Auth: Supabase
- Hosting: Vercel
- Current CSS: `/tailwind-compiled.css?v=20260825r6`

## Progress

- Implementation estimate: 84%
- Release-verified estimate: 72%
- Remaining to verified release: 28%

Perbedaan berasal dari browser E2E, security caller/grant audit, accessibility/mobile, dan production-alias verification yang belum selesai.

## Verified This Snapshot

| Area | Status | Evidence |
|---|---|---|
| GitHub main | PASS | SHA `6bfb0bd3...` |
| Vercel commit check | PASS | Vercel status success |
| `/dapur` production shell | PASS | Browser title `Dapur Creator Studihome` |
| `/balkon`, `/studio-ai` runtime | BLOCKED | Under Construction redirects to upgrade page |
| Canonical Vercel rewrite order | PASS | sitemap → markdown → Dapur → SPA fallback |
| M10 target state | PASS | `validate_creator_publish()` exists with safe search path |
| M11 target state | PASS | `creator_profiles.contact_email` nullable |
| M12 target state | PASS | `site_settings.hero_promo_modules` JSONB |
| Migrations 34–36 | PASS | live and recorded in repo |
| SECURITY DEFINER search_path | PASS | every live definer has explicit search path |
| SECURITY DEFINER caller/grants | NOT VERIFIED | audit still required per function |
| Auth leaked-password protection | FAIL | Security Advisor reports disabled |
| Authenticated E2E | NOT VERIFIED | requires real sessions |
| Checkout/payment regression | NOT VERIFIED | audit must remain non-mutating |
| Mobile/accessibility/browser console | NOT VERIFIED | full matrix pending |

## Recent Completed Work

- Retired `ai_links` frontend/admin/database integration.
- Privacy-hardened AI search and smart-demand signals.
- Authenticated/rate-limited IndexNow submissions.
- Bounded/cache-hardened sitemap generation.
- Indexed portfolio-like foreign keys.
- Optimized RLS initplans for Creator profiles, social graph, services, portfolios, and categories.

## Live Supabase Notes

- Migration history extends through `optimize_creator_content_rls_initplans`.
- SECURITY DEFINER functions expose mixed intentional surfaces:
  - admin/auth actions;
  - public trust/social-proof reads;
  - email token consumption;
  - public intelligence signal recording.
- Search paths are hardened; authorization, caller, output privacy, and abuse-limit review remains P0.
- Remaining performance findings include three legacy RLS initplans, five unindexed foreign keys, duplicate indexes, and informational unused-index notices.
- Do not drop an index solely because the Advisor says unused; production statistics may not cover every query path.

## Stale Documentation Resolved

The 26 August snapshot referenced:
- production SHA `f9c6d51`;
- CSS `r3`;
- migrations 10–12 as pending.

Those status claims are superseded by this snapshot. Constitution principles remain authoritative; dated baseline/status sections must be interpreted using current live evidence.

## Next Priorities

1. P0 SECURITY DEFINER dependency/caller/grant audit.
2. P0 authenticated owner/admin/checkout/Dapur browser E2E.
3. P0 final production-alias SHA reconciliation.
4. P1 leaked-password protection impact review and enablement.
5. P1 remaining RLS initplan/index work with rollback/equivalence tests.
6. P2 mobile 375px, accessibility, console/network, SEO/GEO factual integrity.

## No-Regression Boundary

- Do not touch Under Construction without explicit authorization.
- Do not change checkout/payment during audit.
- Do not change canonical Dapur routes/runtime architecture.
- Do not fabricate social proof or production data.
- Do not use RLS to fix presentation issues.
- Do not claim release readiness without production/browser evidence.

