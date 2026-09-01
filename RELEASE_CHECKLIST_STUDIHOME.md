# STUDIHOME — RELEASE CHECKLIST

Updated: 1 September 2026  
Status: **AUDIT OPEN — DO NOT CLAIM SIAP RILIS**

Allowed values: PASS / FAIL / BLOCKED / NOT VERIFIED.

## A. Source dan Deployment

- PASS — Functional source baseline identified: `6bfb0bd3dbf390dea479731d1d0189d27ce5e058`; subsequent snapshot commits are documentation-only.
- PASS — Vercel status check succeeded for the latest checked commit.
- NOT VERIFIED — Production-alias deployment SHA equals current main.
- PASS — `vercel.json` is valid JSON and SPA fallback is last.
- PASS — `/dapur` and `/dapur/:username` precede SPA fallback.
- PASS — sitemap and Markdown rewrites precede SPA fallback.
- PASS — no Tailwind CDN; compiled CSS loaded as `r6`.
- NOT VERIFIED — reproducible CSS build and Preflight contract.

## B. Database dan Security

- PASS — Supabase is current authority and migrations are queryable.
- PASS — target state of historical M10–M12 exists live.
- PASS — migrations 34–36 applied and recorded.
- PASS — audited SECURITY DEFINER functions have explicit search path.
- NOT VERIFIED — every SECURITY DEFINER caller, authorization check, output contract, and EXECUTE grant.
- PASS — authorization-only helpers deny anon in live privilege check.
- FAIL — leaked-password protection disabled according to Security Advisor.
- NOT VERIFIED — storage owner upload/update/delete E2E.
- NOT VERIFIED — public RPC abuse/rate-limit matrix.
- PASS — `ai_links` retired from current database migration history and feature integration.

## C. Routing dan Runtime

- PASS — `/dapur` renders canonical Dapur shell in production browser.
- BLOCKED — `/balkon` browser E2E while Under Construction gate is active.
- BLOCKED — `/studio-ai` browser E2E while Under Construction gate is active.
- NOT VERIFIED — public Creator and portfolio deep links across back/forward navigation.
- NOT VERIFIED — no legacy Dapur asset/runtime requests.
- NOT VERIFIED — complete console/network error matrix.

## D. Auth dan Ownership

- NOT VERIFIED — login/register browser flow.
- NOT VERIFIED — auth autocomplete warnings absent.
- NOT VERIFIED — Premium without Creator provisions exactly one draft.
- NOT VERIFIED — Premium owner can manage own Dapur.
- NOT VERIFIED — non-owner cannot edit another Creator.
- NOT VERIFIED — logout denies workspace.
- NOT VERIFIED — admin authority cannot be reached by public/member.

## E. Functional Regression

- NOT VERIFIED — Foyer/Menu/Hidangan/Ambalan save flows.
- NOT VERIFIED — username update and duplicate rejection.
- NOT VERIFIED — organic Creator/portfolio Like and unlike rollback behavior.
- NOT VERIFIED — admin Like adjustments remain consistent with public totals.
- NOT VERIFIED — checkout/payment/order confirmation flow.
- NOT VERIFIED — social-proof runtime returns only confirmed, public-safe fields.

## F. UI/UX dan Accessibility

- NOT VERIFIED — homepage locked visual baseline desktop.
- NOT VERIFIED — mobile 375px layout and horizontal overflow.
- NOT VERIFIED — keyboard focus and modal behavior.
- NOT VERIFIED — reduced-motion behavior.
- NOT VERIFIED — text/input sizing and touch targets.
- NOT VERIFIED — Balkon/Creator/Dapur image rendering on mobile.

## G. SEO dan GEO

- PASS — sitemap endpoint source has timeout, cache, and static fallback.
- PASS — IndexNow source requires auth, ownership, canonical URL, and rate limit.
- NOT VERIFIED — production HTTP response for `sitemap.xml`, `llms.txt`, `openapi.yaml` in this browser environment.
- NOT VERIFIED — canonical/metadata/JSON-LD for every dynamic route.
- NOT VERIFIED — Markdown RAG routes for Creator, portfolio, article, and pSEO.
- NOT VERIFIED — pSEO content factual integrity and absence of fabricated statistics.

## H. Performance

- PASS — Creator RLS initplans optimized for profiles, social, services, portfolios, and categories.
- NOT VERIFIED — remaining initplans for `site_settings`, `testimonials`, `modules`.
- NOT VERIFIED — five remaining foreign-key index recommendations.
- NOT VERIFIED — duplicate-index cleanup after query/caller proof.
- NOT VERIFIED — browser performance and long-task profile.

## I. Release Decision

Release claim remains BLOCKED until all P0 items are PASS:
1. SECURITY DEFINER caller/grant audit.
2. Authenticated owner/admin/Dapur E2E.
3. Checkout/payment regression verification.
4. Production-alias SHA reconciliation.
5. Critical browser console/network checks.

Current weighted readiness: **72%**. Remaining: **28%**.

