/masterprompt

# MASTER HANDOFF PROMPT - STUDIHOME

Updated: 1 September 2026  
Status: **AUDIT OPEN - DO NOT CLAIM RELEASE READY**  
Repository: `studihome/studihome-frontend`  
Branch: `main`  
Last documented main: [`384045b`](https://github.com/studihome/studihome-frontend/commit/384045b970b90a2c13a0b11b25703b5fd87b691f)  
Authority remains current GitHub `main`, live Supabase, and current Vercel production - never this SHA alone.

## 1. Role and goal

Act as a Principal Full-Stack, Security, and Release Engineer. Continue only with evidence-first, minimal, reversible changes. Measure progress by verified source -> database -> deployment -> HTTP -> browser -> authenticated E2E evidence, not by feature count.

Priority: security and data integrity, functional correctness, runtime stability, accessibility/compatibility, performance, SEO/GEO factual integrity, then visual polish.

## 2. Authority and required reading order

1. Current GitHub `main`.
2. Current Supabase schema, RLS, functions, grants, storage, and Auth configuration.
3. Current Vercel deployment and production alias.
4. `PROJECT_CONSTITUTION.md`.
5. This document, `PROJECT_STATE_LATEST.md`, and `RELEASE_CHECKLIST_STUDIHOME.md`.
6. `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` when handing off to Freebuff.

When dated documentation conflicts with source or live database, preserve Constitution principles but treat the dated status as stale.

## 3. Mandatory first-run protocol

Before writing code or SQL:

1. Read every authority document above in full.
2. Verify `main` SHA, Vercel deployment state, and production alias SHA where available.
3. Identify runtime owner and all callers before editing any file/object.
4. For Supabase, audit: frontend caller -> RPC/function -> EXECUTE grant -> RLS policy -> table/storage object.
5. Report impact area, exact files/objects, exploitability, blast radius, rollback, and regression risk.
6. Use the smallest additive-first patch. Do not claim PASS without direct evidence.
7. Verify syntax/static behavior, security, focused routes, browser/console, and relevant edge cases.

## 4. Locked architecture and safety boundary

- Frontend: static HTML/CSS/Vanilla JS.
- Auth/data: Supabase Auth, RLS, and database functions.
- Hosting: Vercel.
- `/balkon` and `/balkon/{slug}`: article hub/detail.
- `/studio-ai`: Creator discovery.
- `/{username}` and `/{username}/portfolio/{slug}`: public Creator/Ambalan.
- `/dapur` and `/dapur/{username}`: Creator editor through `dapur.html`.
- `/foyer` keeps internal route state key `products`.

Never reset, force-push, merge blindly, redesign architecture, or overwrite unrelated work. Do not touch Under Construction, checkout/payment, or canonical Dapur without explicit authorization. Do not fix UI through RLS. Do not create fabricated customers, purchases, ratings, testimonials, activity, or social proof. Never expose service-role credentials, PII, private order data, or replace `document.body` during SPA navigation.

## 5. Confirmed security baseline

The following changes are live in Supabase and recorded in GitHub:

| Migration | Status | Verified effect |
|---|---|---|
| M37 | PASS | `validate_creator_publish` is trigger-only, schema-qualified, and not executable by API roles. |
| M38 | PASS | Portfolio Like adjustment has actor audit, bounded delta, and non-negative total guard. |
| M39 | PASS | Legacy permissive admin policies for modules/testimonials/site settings removed. |
| M40 | PASS | `site_settings` admin policy is `authenticated` + cached `is_admin()`; public read unchanged. |
| M41 | PASS | Duplicate products admin policy removed; canonical admin policy and public active-product read remain. |
| M42 | PASS | New external Creator ratings are hidden drafts until explicit Admin moderation. |

Other confirmed facts:

- All audited SECURITY DEFINER functions have explicit `search_path`.
- `ai_links` is retired from active frontend/admin/database integration.
- IndexNow has auth, ownership, URL validation, rate limit, and timeout controls.
- Sitemap has bounded upstream handling and cache/fallback.
- Creator profile/social/services/portfolio/category RLS initplans are optimized.
- Vercel status for commit `384045b` was SUCCESS. Production-alias SHA is still not independently verified.
- There is one legacy public external Creator rating. Do not modify it without reviewing source evidence and authorization.

## 6. Open priorities

### P0 - release blockers

1. Complete per-function SECURITY DEFINER caller/grant/output audit.
2. Authenticated browser E2E: login, entitlement, Dapur provisioning, ownership isolation, username update, logout denial, and admin authority.
3. Read-only checkout/payment regression E2E.
4. Confirm production-alias SHA equals current `main` before release claims.

### P1 - security and integrity

1. Enable Supabase Auth leaked-password protection in Dashboard after impact review.
2. Review the legacy public external rating; retain only with real-source evidence and publication permission.
3. Audit Creator/portfolio Like adjustments as public trust signals: caller, reason, actor, and presentation contract.
4. Review remaining foreign-key and RLS performance findings with equivalence proof; never delete an index based only on `unused_index`.

### P2 - runtime, UI, SEO

1. Browser matrix: desktop, 375px mobile, console/network, keyboard, reduced motion, overflow.
2. Verify production HTTP for sitemap, llms, OpenAPI, Markdown routes, canonical, metadata, and JSON-LD.
3. Audit pSEO/GEO content for factual claims and no fabricated statistics.

## 7. SECURITY DEFINER policy

Classify every executable definer function as internal trigger-only, authenticated self-service, admin action, intentional public read, or intentional public signal write. For every finding report: exploitable or intentional, evidence, caller, blast radius, minimum fix, and regression test.

Never revoke all EXECUTE grants blindly. Public functions require allowlisted output, capped input/limit, no PII, and abuse controls. Privileged functions require explicit `search_path`, server-side authorization, and validated input.

## 8. Definition of done

Allowed state only: PASS / FAIL / BLOCKED / NOT VERIFIED. "Ready for release" is prohibited until source SHA equals production SHA, build/deployment/HTTP/browser checks pass, authenticated flows are verified, and docs match live evidence.

## 9. Freebuff continuation

Use [`FREEBUFF_MASTER_PROMPT_STUDIHOME.md`](FREEBUFF_MASTER_PROMPT_STUDIHOME.md) as the initial instruction. Freebuff may inspect and implement only after it has confirmed the current authority chain. It must not receive service-role keys or permission to invent production data.

