# STUDIHOME - RELEASE CHECKLIST

Updated: 1 September 2026  
Status: **AUDIT OPEN - DO NOT CLAIM RELEASE READY**

Allowed values: PASS / FAIL / BLOCKED / NOT VERIFIED.

## A. Source and deployment

- PASS - Last documented `main`: `384045b970b90a2c13a0b11b25703b5fd87b691f`.
- PASS - Vercel check for documented frontend commit: SUCCESS.
- NOT VERIFIED - Production-alias deployment SHA equals current `main`.
- PASS - `vercel.json` rewrite order keeps sitemap/Markdown/Dapur before SPA fallback.
- PASS - `/dapur` and `/dapur/:username` target `dapur.html` before SPA fallback.
- NOT VERIFIED - reproducible CSS build and Tailwind Preflight contract.

## B. Database and security

- PASS - Supabase remains the live authority; target state through M42 was verified.
- PASS - M37 publish trigger is not API-callable and uses schema-qualified access.
- PASS - M38 portfolio Like adjustments have actor audit and non-negative total protection.
- PASS - M39 removed stale legacy admin policy bypasses.
- PASS - M40 `site_settings` uses authenticated-only cached admin policy; public read retained.
- PASS - M41 removed duplicate products admin policy; canonical policy remains.
- PASS - M42 external Creator ratings are draft-by-default and require explicit Admin visibility moderation.
- PASS - audited SECURITY DEFINER functions have explicit `search_path`.
- NOT VERIFIED - complete per-function caller, authorization, output, grant, and abuse-control matrix.
- FAIL - Supabase Auth leaked-password protection is disabled according to Security Advisor.
- NOT VERIFIED - storage owner upload/update/delete E2E.
- NOT VERIFIED - public RPC abuse/rate-limit matrix.

## C. Routing and runtime

- PASS - `/dapur` renders the canonical Dapur shell in production browser.
- BLOCKED - `/balkon` browser E2E while Under Construction controls the route.
- BLOCKED - `/studio-ai` browser E2E while Under Construction controls the route.
- NOT VERIFIED - Creator/portfolio deep links with aggressive back/forward navigation.
- NOT VERIFIED - complete console/network error matrix and absence of legacy Dapur assets.

## D. Auth and ownership

- NOT VERIFIED - login/register browser flow.
- NOT VERIFIED - Premium entitlement provisions exactly one Creator draft.
- NOT VERIFIED - owner can manage own Dapur and cannot edit another Creator.
- NOT VERIFIED - logout removes workspace authority.
- NOT VERIFIED - admin authority is denied to public/member accounts.

## E. Functional and integrity regression

- NOT VERIFIED - Foyer/Menu/Hidangan/Ambalan save flows.
- NOT VERIFIED - username update and duplicate rejection.
- NOT VERIFIED - organic Creator/portfolio Like/unlike rollback behavior.
- NOT VERIFIED - Admin Like adjustments reconcile with public totals and approved governance.
- NOT VERIFIED - checkout/payment/order confirmation flow.
- NOT VERIFIED - social-proof runtime returns only confirmed public-safe fields in production browser.
- NOT VERIFIED - the one legacy public external Creator rating has evidence and publication permission.
- PASS - new external Creator ratings cannot be public until Admin review.

## F. UI/UX and accessibility

- NOT VERIFIED - homepage visual baseline desktop.
- NOT VERIFIED - mobile 375px layout, overflow, image rendering, and touch targets.
- NOT VERIFIED - keyboard focus, modal behavior, and reduced-motion behavior.
- NOT VERIFIED - browser console errors and network failure handling.

## G. SEO and GEO

- PASS - sitemap source has timeout, cache, and static fallback.
- PASS - IndexNow source requires auth, ownership, canonical URL, and rate limit.
- NOT VERIFIED - production HTTP for sitemap, llms, OpenAPI, and Markdown routes.
- NOT VERIFIED - canonical/metadata/JSON-LD for dynamic routes.
- NOT VERIFIED - pSEO copy factual integrity and no fabricated statistics.

## H. Performance

- PASS - Creator RLS initplans optimized for profiles, social, services, portfolios, categories, and site settings.
- NOT VERIFIED - testimonials/modules RLS equivalence and remaining performance findings.
- NOT VERIFIED - foreign-key and duplicate-index changes after caller/query proof.
- NOT VERIFIED - browser performance and long-task profile.

## I. Release decision

Release claim remains BLOCKED until all P0 items are PASS:

1. SECURITY DEFINER caller/grant/output audit.
2. Authenticated owner/admin/Dapur E2E.
3. Checkout/payment regression verification.
4. Production-alias SHA reconciliation.
5. Critical browser console/network checks.

Use `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` for safe third-party continuation. It cannot replace this checklist or live verification.

