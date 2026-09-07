# STUDIHOME — MASTER HANDOFF PROMPT

Updated: 6 September 2026, Asia/Jakarta  
Repository: `studihome/studihome-frontend`  
Status: **SECURITY / RELEASE HARDENING ACTIVE**

## 1. Mission

Act as the continuation Principal Full-Stack, Security, SRE, QA, PWA, SEO/GEO, and Conversion Engineer for Studihome.

Work evidence-first. Prefer small, reversible changes. Never declare a release clean because source code merely looks correct. A release claim requires agreement across source, CI, deployment SHA, production HTTP, and the relevant authenticated/browser evidence.

Use Indonesian for reports unless the operator requests otherwise.

## 2. Authority order

Before changing anything, refresh and reconcile in this order:

1. current GitHub `main` and active PR/branch;
2. current GitHub ruleset and `Studihome Release Gate / release-gate`;
3. current Vercel deployment/status and production alias SHA;
4. live Supabase schema, grants, RLS, Advisors, and Edge Functions when the task touches Supabase;
5. `PROJECT_CONSTITUTION.md`;
6. `PROJECT_STATE_LATEST.md`;
7. this document and `RELEASE_CHECKLIST_STUDIHOME.md`;
8. `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` for continuation agents;
9. `VERCEL_MANUAL_DEPLOY.md` before any manual Vercel deployment.

If dated documentation conflicts with live evidence, preserve Constitution principles but update the dated status. Do not substitute an old handoff claim for current verification.

## 3. Current release baseline

Verified production evidence SHA:

`1ce0b628fb1733d404c5125ff4ab0176791e58e4`

This is a documentation-only merge whose parent `49db8b39591752e6486506415bda42abb2096744` contains the portfolio runtime fix.

This SHA is the squash merge of PR **#73** (portfolio canonical collision hardening).

Evidence before merge:

- PR head `704fe6d56039aea76b14dbb2985672eef5944b05`;
- `release-gate`: **PASS 25/25**;
- Vercel Preview: **SUCCESS**;
- PR state before merge: clean.

Evidence after merge:

- main push `release-gate` run **602**: **PASS 25/25**;
- Vercel production status for `49db8b39591752e6486506415bda42abb2096744`: **FAIL / BLOCKED** with provider `build-rate-limit`;
- production smoke run `34047113620`: **FAIL** — all 36/36 alias checks still returned `bc3f31f445e21ac3b8582bd40ea70c10a7db167f`, not `49db8b39591752e6486506415bda42abb2096744`;
- production release status for `49db8b...`: **NOT VERIFIED / BLOCKED BY VERCEL DEPLOYMENT**.
- exact smoke error: `Production alias did not converge to 49db8b39591752e6486506415bda42abb2096744`.

Last known production alias evidence before this merge:

`bc3f31f445e21ac3b8582bd40ea70c10a7db167f`

For that SHA:

- production alias SHA reconciliation: **PASS**;
- global public security-header checks: **PASS**;
- production smoke run `34045201632`: **FAIL** on duplicate sitemap URLs.

Therefore do **not** claim the portfolio fix is live merely because it is merged to `main`. Re-run/complete deployment and production smoke only after Vercel can deploy the current main SHA.

Vercel capacity recovery and production verification — 7 Sep 2026:
- fresh PR #74 Vercel check: **SUCCESS**;
- PR #74 Release Gate #614: **PASS**;
- PR #74 merged as `1ce0b628fb1733d404c5125ff4ab0176791e58e4`;
- main push Release Gate #615: **PASS**;
- Vercel production deployment for `1ce0b628...`: **SUCCESS**;
- Studihome Production Smoke run #9 / `34068317674`: **PASS**;
- production alias SHA reconciliation therefore passed for `1ce0b628...`;
- production is **VERIFIED** for that deployment evidence.


Legacy/runtime ownership audit on current main:

- Issue #21 audit: **COMPLETED WITH CORRECTION** after direct parsing of the large `index.html`;
- `admin-dapur-ui-v2.js`: **DELETE-CANDIDATE**, with no current direct HTML/loader reference found;
- `admin-dapur-creator-v5.js`: **KEEP / ACTIVE RUNTIME** — `index.html` loads `/admin-dapur-creator-v5.js?v=10` and the Admin router calls `window.StudihomeAdminDapurCreatorV5?.open?.()`;
- `admin-gudang-v2.js`: **KEEP / ACTIVE RUNTIME** — `index.html` loads `/admin-gudang-v2.js?v=5` and the Admin router calls `window.StudihomeGudangV2?.open?.()`;
- `dapur-profile-enhancements.js`: **KEEP**, directly loaded by `index.html`;
- `under-construction-gudang.js`: **KEEP**, directly loaded by `index.html`;
- `under-construction.js`: **KEEP**, dynamically loaded by `maintenance-gate.js` and `under-construction-gudang.js`;
- `studio-ai-enhancements.js` and `studio-ai-production-enhancements.js`: **DELETE-CANDIDATE / NOT CURRENTLY LOADED** based on direct HTML parsing plus repository reference checks;
- Issue #22 ownership audit: **CLOSED / COMPLETED**;
- Issue #24 duplicate Supabase-client refactor: **CLOSED / COMPLETED**; production-verified in merge SHA `1c1702f1020c6743b09d84d0dce559484754284b`.
- no runtime file has been deleted or modified by this audit.

Important: GitHub code search can miss matches inside the very large `index.html`. For zero-consumer claims, parse the actual `index.html` source and inspect dynamic loaders before classifying a runtime as unused.

## 4. Console diagnostics baseline — 7 Sep 2026

Current `/studio-ai` console report was triaged against current main:

- repository search found no `chrome.runtime`, `browser.runtime`, `sendMessage`, `onMessage`, or page `message` listener matching the reported extension-channel errors;
- `Could not establish connection. Receiving end does not exist.` and `A listener indicated an asynchronous response... channel closed` are therefore classified **EXTERNAL / BROWSER-EXTENSION PROVENANCE LIKELY**, not a proven Studihome runtime defect;
- YouTube `compute-pressure` Permissions Policy warnings originate inside `youtube.com` embed code. Do **not** weaken Studihome `Permissions-Policy` merely to silence that warning;
- Chromium `powerPreference option is currently ignored... on Windows` is browser/driver diagnostic noise, not a Studihome application error;
- `beforeinstallprompt.preventDefault()` warning is expected when a custom PWA install flow suppresses the browser banner. Treat as actionable only if the custom install CTA itself fails to call the saved prompt after a user gesture;
- social-proof logs `supabaseClient ready immediately` and `loaded 3 items` are normal successful diagnostics.

Before changing app code for similar reports, reproduce with extensions disabled/incognito and identify a Studihome-owned stack frame or failed feature. Do not add catch-all handlers or relax security headers solely to make DevTools quiet.

First-party console-noise regression guard — 7 Sep 2026:
- Release Gate now rejects `chrome.runtime` / `browser.runtime` extension-messaging APIs in audited first-party browser runtimes;
- Release Gate rejects an unaudited Service Worker `message` channel;
- Release Gate locks the custom PWA install contract: `beforeinstallprompt` -> `preventDefault()` -> saved event -> `prompt()` -> `userChoice` -> `appinstalled`;
- this guard does not suppress external browser-extension or YouTube warnings; it prevents Studihome from accidentally becoming their source.

## 5. Portfolio canonical URL contract — DO NOT REGRESS

Public portfolio route:

`/{username}/portfolio/{portfolio-slug}`

Rules:

1. A portfolio whose normalized title slug is unique among its **active public siblings** keeps the historical title-only slug.
2. If active siblings collide on the same title slug, append a deterministic normalized UUID prefix.
3. Collision canonicals MUST use reserved separator `--`, e.g. `demo--aaaaaaaa`.
4. Normal title slugification collapses punctuation runs to a single `-`, therefore natural title slugs cannot generate `--`.
5. UUID prefix length expands 8 -> 12 -> 16 -> 20 -> 24 -> 28 -> 32 when needed.
6. Final slug remains <= 120 characters.
7. Historical title-only deep links remain readable as backward-compatible fallback, but canonical generation must return the collision-safe route.
8. Browser runtime, sitemap, Markdown/GEO, share/canonical SEO, Creator Studio IndexNow trigger, and `api/index-push.js` must implement the same contract.
9. IndexNow must reject an ambiguous/non-canonical portfolio URL and return the canonical URL instead of submitting the ambiguous path.
10. Never normalize reserved `--` back to a single `-`.

Required regression coverage:

- `tests/portfolio-route-regression.js`;
- `tests/sitemap-collision-regression.js`;
- `tests/index-push-canonical-regression.js`;
- release-gate static guards against title-only resolver regression and single-hyphen collision-namespace regression.

## 6. Release governance

GitHub main protection is active:

- PR required;
- required status check: `release-gate`;
- strict/up-to-date checks;
- force push and branch deletion blocked;
- no bypass actors.

Auto-deployment protocol:

1. branch -> PR;
2. release-gate PASS;
3. Preview SUCCESS;
4. merge;
5. Vercel production deployment;
6. wait until `https://studihome.id/api/version` reports merged `github.sha`;
7. production smoke PASS against that same SHA;
8. only then production-verified.

A Vercel quota/rate-limit is **BLOCKED**, never PASS.

Manual deployment rule: use the exact approved Git SHA from `main` through Vercel **Create Deployment**. Do not upload an untracked ZIP or deploy a documentation/feature branch as production. Current approved production source target is `49db8b39591752e6486506415bda42abb2096744`. If Vercel creates a staged deployment, confirm the Git SHA first and only then Promote to Production. Production remains NOT VERIFIED until `/api/version` matches and production smoke passes. See `VERCEL_MANUAL_DEPLOY.md`.

## 7. Current release-gate scope

The gate covers at least:

- tracked JavaScript syntax;
- inline JavaScript syntax;
- structured JSON config;
- P0 push rollout lock;
- public secret-pattern scan;
- security/dependency/PWA guards;
- SEO/trust/crawl guards;
- private-route noindex/admin snippet guards;
- public route namespace guards;
- Supabase least-privilege migration guards;
- public API timeout/resilience regression;
- portfolio collision canonical regression;
- reserved collision-namespace separation;
- sitemap collision regression;
- IndexNow portfolio canonical regression;
- Edge Function dependency pinning;
- legacy Edge Function quarantine;
- runtime version endpoint regression;
- production-smoke py_compile + self-test;
- production-smoke workflow invariants;
- diff hygiene.

Do not weaken a failing assertion merely to make CI green.

## 8. Supabase safety baseline

Project: `studihome` / ref `hbfmhwwxbgidsnljupca`.

Current important facts:

- Supabase Free plan;
- HaveIBeenPwned leaked-password protection unavailable on this plan: **ACCEPTED / PLAN-LIMITED RISK**;
- minimum product password length remains 6 by operator decision;
- push rollout remains disabled;
- M46 push source hardened but **NOT applied**;
- `send-push-notification` remains **NOT production-ready**;
- do not enable/deploy push until standards-compliant sender and real-device interoperability are verified.

Current recorded database performance state:

- duplicate indexes: 0;
- unindexed foreign keys: 0;
- multiple permissive policies: 0.

Do not drop an index solely because an Advisor calls it unused.

For any Supabase change:

1. refresh live state and Advisors;
2. map caller -> function/RPC -> EXECUTE -> RLS -> table/storage;
3. classify SECURITY DEFINER findings by actual caller and authorization;
4. use explicit least privilege;
5. write reversible migration;
6. test intended success and unauthorized denial;
7. re-run Advisors;
8. update source/live-state docs.

Never expose service-role/secret credentials.

## 9. Edge Functions

Current tracked Supabase JS target: `2.115.0`.

Recorded state:

- `send-email-verification`: live v5; application bearer/session validation; `verify_jwt=false` retained intentionally;
- `provision_managed_creators`: live v2; `verify_jwt=true`;
- `send-push-notification`: source-only / not production-ready;
- `smooth-action` and `swift-endpoint`: legacy/quarantined; no current repo runtime caller found.

Do not retire legacy functions without independent caller/invocation evidence.

## 10. Security and runtime boundaries

Never:

- reset/force-push history;
- merge a blocked PR;
- redesign unrelated UI while fixing a focused defect;
- broaden DB grants merely to silence Advisors;
- use RLS as a UI workaround;
- fabricate customers, purchases, ratings, testimonials, activity, or social proof;
- expose PII, private order data, secrets, service-role keys, or VAPID private material;
- re-enable push before backend/device verification;
- weaken CSP/security/noindex controls to make tests pass;
- mutate checkout/payment flows without focused audit and regression coverage.

## 11. SEO / GEO rules

- `llms.txt` is not a Google ranking lever.
- Maintain canonical consistency between runtime HTML/SPA, sitemap, Markdown endpoints, IndexNow, and structured data.
- Private/auth/admin routes need HTTP/meta indexing controls; robots.txt is not a security boundary.
- pSEO content must be useful, unique, factual, and free of unsupported claims.
- Sitemap `<loc>` values must be unique.
- Do not fabricate freshness or statistics.

## 12. Definition of done

Allowed status vocabulary:

- PASS
- FAIL
- BLOCKED
- NOT VERIFIED
- NOT APPLICABLE

Do not claim "zero bugs", "100% bug-free", or absolute "no regression".

Preferred scoped statement:

> Tidak ditemukan known regression pada test scope yang telah dijalankan untuk SHA <sha>.

A production release is verified only after:

- source SHA is known;
- required CI passes;
- deployment is not blocked;
- production alias reports the expected SHA;
- production smoke passes;
- relevant authenticated/browser checks are completed;
- documentation matches live evidence.

## 13. Required engineering report

Every substantive change report must include:

- root cause/evidence;
- risk level/blast radius;
- files/DB objects changed;
- tests and exact result;
- PR/CI/Preview/deployment state;
- production SHA/smoke state;
- known limitations/blockers;
- rollback path;
- documentation updated;
- exact next safest action.

Do not hide a blocker. Do not convert NOT VERIFIED into PASS.


## Admin Dapur canonical Supabase singleton refactor — COMPLETED / VERIFIED

Issue #24 implementation:
- active `admin-dapur-creator-v5.js` no longer owns a duplicate Supabase URL/key, SDK loader, or `window.__studihomeAdminSupabase` client;
- Admin Dapur now accepts only the canonical `window.supabaseClient` created by `supabase-config.js`;
- if the singleton is not ready immediately, the runtime waits for `studihome:supabase-client-ready` for up to 3000 ms and then fails with an explicit reload/retry message;
- `index.html` still loads `supabase-config.js?v=boot5` before Admin Dapur and now loads `admin-dapur-creator-v5.js?v=11`;
- regression coverage: `tests/admin-dapur-supabase-singleton-regression.js` plus Release Gate integration;
- no DB, RLS, grant, Auth policy, Supabase project, or service-role change.


Production verification for Issue #24:
- PR #77 Vercel Preview: SUCCESS;
- PR Release Gate #620: PASS;
- merged main SHA: `1c1702f1020c6743b09d84d0dce559484754284b`;
- Vercel Production: SUCCESS;
- main Release Gate #621: PASS;
- Production Smoke #12 / `34069115071`: PASS;
- Issue #24: CLOSED / COMPLETED.


## Dapur auth modal accessibility fix — 7 Sep 2026

Console triage on `/dapur`:
- AdobeClean slow-network font interventions reference `chrome-extension://efaidnbmnnnibpcajpcglclefindmkaj` and are external browser-extension noise;
- async message-channel-closed errors remain extension/content-script provenance unless a Studihome stack frame is proven;
- Supabase `signInWithPassword` HTTP 400 is an expected auth response for rejected credentials; Dapur catches the error and shows a toast. Local validation now blocks passwords shorter than the configured 6-character minimum before the network request;
- real first-party bug: auth modal previously applied `aria-hidden=true` while `.auth-close` could still retain focus.

Fix:
- hidden auth modal is initialized with both `aria-hidden=true` and `inert=true`;
- opening removes `inert`, exposes the dialog, and moves focus into the login email field;
- closing blurs focus inside the modal before applying `inert` / `aria-hidden`, hides the modal, then restores focus to the invoking control when possible;
- Dapur runtime asset bumped to `/dapur-entry.js?v=20260907a11y1`;
- regression coverage: `tests/dapur-auth-modal-accessibility-regression.js` wired into Release Gate.


## Current authority update — 7 Sep 2026

This section supersedes older contradictory status text in this document.

- production-verified main baseline before PR #79: `e213d6d98eab3c47f559cda8b285aebfb7a9895d`;
- PR #79 remains open: prior Release Gate PASS; Vercel Preview currently BLOCKED by build-rate-limit; merge waits for a fresh Vercel SUCCESS;
- Issue #24 is CLOSED / COMPLETED / production-verified;
- Issue #19 audit: `studio-ai-enhancements.js`, `studio-ai-production-enhancements.js`, and `studio-ai-search.js` are DELETE-CANDIDATE / not currently loaded; `studio-ai-creator-card.js?v=6` is ACTIVE / KEEP;
- strict CSP migration is deferred because current index.html still contains 25 inline scripts and 9 inline styles;
- Issue #62: `smooth-action` ACTIVE v2 and `swift-endpoint` ACTIVE v1; retirement remains BLOCKED BY MISSING INVOCATION EVIDENCE;
- Issue #23: live creator_portfolios schema/RLS supports bulk Admin intake without schema/RLS changes; default bulk rows inactive, dedupe normalized URL per Creator, no scraping or fabricated metadata;
- PR #43 and PR #50 were closed as superseded on 7 Sep 2026.


## Current authority update — 7 Sep 2026 / refresh 2

This section supersedes earlier authority/status blocks in this document.

- production-verified main baseline remains `e213d6d98eab3c47f559cda8b285aebfb7a9895d`; Vercel production SUCCESS, Release Gate #623 PASS, Production Smoke #13 PASS;
- PR #79 Dapur auth-modal accessibility: current branch workstream; merge remains forbidden until a fresh Vercel Preview SUCCESS exists for the same head SHA;
- Issue #80 / draft PR #81: Creator trust RPC hardening is PREPARED, Release Gate PASS on its current validated head, Vercel Preview provider-blocked, migration NOT APPLIED live;
- Issue #19 audit is CLOSED / COMPLETED; implementation split to Issue #84 (remove proven inactive Studio AI runtimes) and Issue #85 (phased inline extraction before CSP enforcement);
- Issue #82 unused-index audit is CLOSED / COMPLETED; 23 Advisor unused indexes were not dropped; 13/23 are FK-leading indexes;
- Issue #83 tracks the separate redundant non-unique `idx_entitlements_user_product` candidate; do not drop until isolated reversible migration + re-audit;
- Issue #62 remains BLOCKED BY MISSING INVOCATION EVIDENCE for `smooth-action` / `swift-endpoint`;
- Issue #23 canonical portfolio CRUD owner is `dapur-editor.js`, lazy-loaded by `dapur-entry.js`; do not implement bulk CRUD in `admin-dapur-creator-v5.js`;
- Issue #23 live contract requires HTTPS-only new portfolio URLs, existing media types `image|youtube|drive|tiktok|instagram|video|link`, canonical `window.supabaseClient`, Admin recheck via `is_admin()`, max 100 pasted lines, draft `is_active=false`, and no scraping/fabricated metadata;
- Issue #86 historical same-URL audit is CLOSED / COMPLETED with NO CLEANUP: the 45 groups are service-context variants with distinct non-null `service_id` values; never add global UNIQUE(`creator_id`, `media_url`) based on URL equality alone;
- PR #43 and PR #50 remain CLOSED AS SUPERSEDED.


## Creator trust RPC hardening — synchronized after PR #79

Issue #80 / draft PR #81:
- branch must stay synchronized with production-verified main `d32c7e04b5c3d916c85a57a5528f18e6501134a1`;
- live `get_creator_trust_metrics(uuid)` currently returns non-NULL for both published and unpublished Creator IDs in unauthenticated context;
- prepared migration: `supabase/migrations/20260907063648_constrain_creator_trust_metrics_visibility.sql`;
- target behavior: published Creator -> metrics; active Admin -> metrics; owning Creator with workspace access -> metrics; every other unpublished access -> NULL;
- preserve signature, SECURITY DEFINER, `search_path=''`, and current ACL;
- no table/schema/RLS/grant/data change is included;
- verification: `supabase/tests/creator_trust_metrics_visibility_verification.sql`;
- rollback: `supabase/rollbacks/20260907063648_restore_creator_trust_metrics_visibility.sql`;
- regression: `tests/creator-trust-metrics-visibility-regression.js`;
- migration remains NOT APPLIED live until fresh PR #81 Release Gate + Vercel Preview succeed and post-apply SQL verification passes.

## Current authority update — 7 Sep 2026 / refresh 3

- PR #79 is MERGED / PRODUCTION VERIFIED at `d32c7e04b5c3d916c85a57a5528f18e6501134a1`; Vercel Production SUCCESS; Release Gate #638 PASS; Production Smoke #14 PASS.
- PR #81 is the next priority security workstream and must be validated on top of that production state.
- Issue #23 remains next after #81; canonical portfolio CRUD owner is `dapur-editor.js`, HTTPS-only for new rows, max 100-line bulk intake, no historical URL cleanup.
- Issue #84/#85 remain deferred Studio AI/CSP follow-ups; Issue #62 remains blocked by missing Edge invocation evidence.


## Current authority update — 7 Sep 2026 / refresh 4

This section supersedes earlier status blocks.

- production main remains `d32c7e04b5c3d916c85a57a5528f18e6501134a1`; PR #79 is production-verified with Vercel Production SUCCESS, Release Gate #638 PASS, Production Smoke #14 PASS;
- PR #81 current head before this documentation refresh: `c89700a336850b716e602d2ebd903c1ee72d3679`; Release Gate #642 PASS; Vercel Preview BLOCKED by build-rate-limit; migration NOT APPLIED live;
- PR #81 pre-apply guard `supabase/tests/creator_trust_metrics_preflight.sql` now validates signature, SECURITY DEFINER, empty search_path encoding, anon/authenticated EXECUTE ACL, expected metric dependencies, and fails closed on drift/already-hardened state;
- live preflight PASS;
- actual migration SQL has been executed transactionally against live Supabase and fully rolled back: 0 published output mismatches, 0 anonymous unpublished leaks, Admin access PASS, owner workspace access PASS, ACL/security contract preserved;
- actual rollback SQL has been transaction-tested: 48 Creators checked, 0 output mismatches, security contract restored, pg_get_functiondef exact-match with baseline;
- final live preflight after rollback PASS, proving production RPC remains on the original definition;
- Issue #23 is implemented as stacked draft PR #88 on top of #81; exact feature head `4a01c183b282d3abbe07f67eabece35faa656afa`; Release Gate #643 PASS via temporary validation PR #89, Vercel BLOCKED; #88 must not merge before #81;
- PR #88 canonical owner is `dapur-editor.js`, with Admin recheck, HTTPS-only normalization, 100-line bound, normalized dedupe, one bounded insert, draft rows only, no scraping, and direct video-file URLs mapped to `link` under current live CHECK constraints;
- Issue #90 tracks reconciliation of overlapping portfolio media CHECK constraints; target unified policy was read-only tested against all 139 current rows with 139 compatible / 0 incompatible; no schema change has been made.


## Current authority update — 7 Sep 2026 / refresh 5

- production main remains `d32c7e04b5c3d916c85a57a5528f18e6501134a1`; PR #79 remains production-verified;
- PR #81 prior exact head `55abd94353f319ff085e132bb51ad61eb9df6885`: Release Gate #646 PASS, preflight PASS, actual migration transactional test PASS, exact rollback transactional test PASS, migration NOT APPLIED live;
- Vercel provider recovery is now proven by PR #88 exact head `3a1d5a681d56ee5f957487aabc8ffbd18ba1054e`: Release Gate #648 PASS + Vercel Preview SUCCESS;
- PR #88 remains stacked on #81 and DRAFT; latest hardening rejects embedded URL credentials and prevents platform-specific typing on non-default ports;
- Issue #90 media CHECK reconciliation contract is READY after transactional apply/deny tests and 4/4 exact rollback reconstruction; no live schema change;
- Issue #83 redundant entitlement index cleanup contract is READY after transactional drop/planner/rollback verification; no live index change;
- Issue #62 remains BLOCKED BY MISSING TELEMETRY because available Supabase tooling still exposes no Edge invocation logs.


## Console hygiene remediation — 7 Sep 2026

User console evidence was re-audited before continuing the release chain.

Classification:
- `[SP] supabaseClient ready immediately` / `[SP] loaded N items`: first-party informational noise; removed. Real query/fetch failures remain warnings.
- `beforeinstallprompt.preventDefault()` banner diagnostic: expected Chromium behavior for the intentional custom install flow. Keep `preventDefault()` + deferred `prompt()`; do not remove merely to silence the browser.
- `Could not establish connection. Receiving end does not exist` / asynchronous response channel closed: no first-party `chrome.runtime`, `browser.runtime`, `sendMessage`, `onMessage`, MessageChannel, or matching postMessage implementation. Existing Release Gate extension-messaging guard remains authoritative. Do not add global unhandledrejection suppression.
- reported Supabase Creator avatar `ERR_NAME_NOT_RESOLVED`: live storage audit confirmed bucket `creator-media` exists and all 5 reported avatar objects exist. This is DNS/network-layer failure, not missing data.

First-party remediation branch:
- `fix/console-hygiene-avatar-resilience`;
- same-origin `/api/creator-avatar` proxy accepts only Studihome UUID[/UUID]/avatar.webp object paths and fetches only the fixed Studihome Supabase public origin;
- no arbitrary URL input / no SSRF;
- upstream failure returns a short-cache transparent SVG with HTTP 200;
- successful avatar responses are CDN-cacheable;
- core `App.utils.safeUrl` proxies only exact Studihome creator-media avatar paths; other URLs preserve existing behavior;
- active `studio-ai-creator-card.js` uses the shared helper;
- asset bumps: creator card v7, social proof v14;
- regression: `tests/console-hygiene-avatar-resilience-regression.js`;
- no DB/RLS/Auth/grant/storage object change.


## Current authority update — 7 Sep 2026 / refresh 6

- production main is `2809811790ab12511886355f8a0cc42717a82745` after PR #101 console hygiene/avatar resilience;
- PR #101 verification: Vercel Production SUCCESS, Release Gate #657 PASS, Production Smoke #15 PASS;
- PR #81 now includes the verified console runtime + console regression while preserving Creator trust migration/preflight/rollback artifacts;
- Creator trust migration remains NOT APPLIED live;
- fresh exact-head Release Gate + Vercel Preview are required again after this synchronization before persistent migration/merge.

## Current authority update — 7 Sep 2026 / refresh 7

This section supersedes earlier contradictory status text.

- production main remains `2809811790ab12511886355f8a0cc42717a82745`; PR #101 console hygiene/avatar resilience is production-verified (Vercel Production SUCCESS, Release Gate #657 PASS, Production Smoke #15 PASS);
- live Supabase preflight for `get_creator_trust_metrics(uuid)` passed immediately before persistent apply;
- Creator trust visibility hardening is now **APPLIED LIVE** as Supabase migration history version `20260907063648` / `constrain_creator_trust_metrics_visibility`;
- post-apply verification passed: published Creator access retained, anonymous unpublished access denied, active Admin access retained, and eligible owner/workspace access retained;
- repository migration and rollback filenames are reconciled to the exact live migration version `20260907063648`; no table, RLS, grant, storage-object, or application-data mutation is part of this migration;
- Security Advisor was rerun. `get_creator_trust_metrics` still receives the generic anon/auth SECURITY DEFINER lint because public EXECUTE is intentionally retained for published Creator metrics; the function now performs internal publication/owner/Admin authorization. Other Advisor findings remain separate workstreams and must not be broadened into this focused change;
- Performance Advisor reported INFO-level unused-index candidates only; do not drop indexes from this workstream;
- the previous PR #81 Vercel Preview blocker was the Free-plan deployment quota. The #81 diff contains DB migration/tests/docs/workflow only, while current production runtime at main is already Vercel-successful. Treat this as a narrowly documented DB-only deployment-equivalence exception; exact-head Release Gate PASS and a no-runtime-diff check are still required before merge;
- rollback: `supabase/rollbacks/20260907063648_restore_creator_trust_metrics_visibility.sql`;
- PR #88 remains stacked and must be reconciled with main after #81 is merged.

## Admin bulk portfolio intake — clean mainline rebuild / 7 Sep 2026

- the original stacked PR #88 diverged after #81 was merged into `main`; do not force-push or merge that stale stack;
- a clean Issue #23 branch is rebuilt directly from production-lineage `main` `fec5512fd1f8449a31071a926a2ca5280c2ee498`;
- runtime transplant is safe because `dapur-editor.js`, `dapur-entry.js`, and the Release Gate workflow had byte-identical base SHAs between the old #88 base and current main before applying the feature delta;
- canonical implementation owner remains `dapur-editor.js`; `dapur-entry.js` only owns lazy loading/cache-busting;
- Admin authorization is rechecked server-side through `is_admin()`; the browser reuses canonical `window.supabaseClient`;
- bulk input is bounded to 100 lines, HTTPS-only, rejects embedded URL credentials, normalizes/deduplicates per Creator, uses one bounded batch insert, and creates inactive draft rows with `service_id=null`, empty description, deterministic title, and appended sort order;
- supported provider typing remains constrained to the live DB contract; non-default-port provider URLs fall back to generic `link`; no scraping/OpenGraph/AI metadata fetch is introduced;
- regression: `tests/admin-bulk-portfolio-intake-regression.js`; Release Gate wiring is retained;
- this is a runtime change, therefore unlike the DB-only #81 exception it must not merge without a fresh Vercel Preview SUCCESS on the exact clean-branch head;
- no schema, migration, RLS, grant, Auth, or production-data change belongs to this feature.

## Current authority update — 7 Sep 2026 / refresh 8

- source `main` is now `fec5512fd1f8449a31071a926a2ca5280c2ee498` after PR #81 merged with ancestry preserved;
- live Creator trust hardening remains applied as Supabase migration `20260907063648`; post-apply verification passed;
- Vercel deployment/status for `fec5512...` is BLOCKED by Free-plan build-rate-limit. The last production-verified deployed runtime remains `2809811790ab12511886355f8a0cc42717a82745`; #81 introduced no frontend/API runtime delta;
- stale stacked PR #88 is CLOSED AS SUPERSEDED / DO NOT MERGE;
- canonical Issue #23 implementation is replacement PR #102 on branch `feat/admin-bulk-portfolio-intake-mainline-2026-09-07`, rebuilt cleanly from `fec5512...`;
- PR #102 is a browser-runtime change and has no DB-only quota exception: require exact-head Release Gate PASS + Vercel Preview SUCCESS + up-to-date/mergeable state before merge.

## PR #102 dedupe-scope correction — 7 Sep 2026

- live duplicate-shape audit: 45 same-URL groups; all 45 are service-linked-only, 0 mixed generic/service groups, 0 multiple-generic groups;
- bulk intake must not treat service-linked portfolio rows as generic duplicates;
- #102 now reads `service_id` with existing URLs, computes append `maxSort` across all rows, but adds an existing URL to the generic dedupe set only when `service_id IS NULL`;
- batch-internal dedupe remains unchanged;
- regression executes the generic-vs-service row predicate and locks the query/guard markers;
- no live data cleanup or global uniqueness constraint is introduced.

## Current authority update — 7 Sep 2026 / refresh 9

This section supersedes earlier deployment/release status text.

- source `main`: `db7c47adc4c365d32b7a79bdc4cdb8c6ba811baa` after PR #102;
- PR #102 exact-head evidence before merge: Release Gate #671 PASS + Vercel Preview SUCCESS; clean branch was up-to-date and mergeable;
- main Release Gate #672: PASS;
- Vercel Production status for `db7c47a...`: **BLOCKED / build-rate-limit**;
- Production Smoke #17 / run `34092938276`: **FAIL** only at SHA convergence; all 36 attempts observed production commit `2809811790ab12511886355f8a0cc42717a82745`, never `db7c47a...`;
- therefore the last production-verified deployed runtime remains `2809811790ab12511886355f8a0cc42717a82745`; do not claim PR #102 live yet;
- live Supabase Creator trust hardening remains independently APPLIED + VERIFIED as migration `20260907063648`;
- Issue #23 source implementation is merged but remains production verification-pending until a production deployment reports the expected current-main SHA and Production Smoke passes;
- next safest action is a docs-only protected PR from current main to refresh the stale Vercel playbook and safely retrigger deployment capacity. Merge that recovery PR only when its exact head has Release Gate PASS + Vercel Preview SUCCESS;
- do not add another browser-runtime change while current runtime deployment is unresolved.

## Current authority update — 7 Sep 2026 / refresh 10

- production-verified SHA: `57cd6e5e95890706f6954ee085bca0fadba088a7`;
- Vercel Production: SUCCESS;
- main Release Gate #674: PASS;
- Production Smoke #18 / `34114129036`: PASS with SHA-aware alias convergence;
- PR #102 Admin bulk portfolio runtime is live in this verified deployment;
- Issue #80 Creator trust RPC hardening is CLOSED / COMPLETED;
- Issue #23 remains open only for its explicit authenticated-browser acceptance criterion; source, CI, Preview, deployment, and production smoke are verified;
- previous Vercel `build-rate-limit` blocker is resolved for this release chain;
- resume the normal protected release flow for subsequent work.

## Issue #83 redundant entitlements index cleanup — prepared / 7 Sep 2026

- live re-audit confirms `entitlements_user_id_product_id_key` is VALID/READY UNIQUE constraint-backed btree on `(user_id, product_id)`;
- `idx_entitlements_user_product` is VALID/READY non-unique, non-constraint-backed, same two keys/order/opclasses, no predicate/expression/include difference, 16 kB;
- table remains tiny (~11 estimated rows);
- transaction-only drop/rollback test PASS; representative equality lookup remained indexed/no Seq Scan after temporary drop, and rollback restored the redundant index;
- prepared isolated migration uses fail-closed catalog guards and drops only `public.idx_entitlements_user_product`;
- exact rollback recreates `CREATE INDEX idx_entitlements_user_product ON public.entitlements USING btree (user_id, product_id)`;
- preflight + post-apply planner/FK verification + Release Gate regression are included;
- migration is **NOT APPLIED LIVE** until exact-head Release Gate PASS + Vercel Preview SUCCESS, followed by fresh live preflight.

## Issue #83 live apply — 7 Sep 2026

- exact-head PR #105 pre-apply Release Gate #677 PASS + Vercel Preview SUCCESS; branch was behind main 0 / mergeable true;
- fresh live fail-closed preflight PASS;
- persistent Supabase migration APPLIED as `20260907110644_remove_redundant_entitlements_user_product_index`;
- `public.idx_entitlements_user_product` is now absent live;
- VALID/READY UNIQUE constraint-backed `entitlements_user_id_product_id_key` remains present;
- expected FK-leading indexes `idx_entitlements_user_id`, `idx_entitlements_product_id`, and `idx_entitlements_order_id` remain present;
- post-apply representative lookup remains indexed / no Seq Scan;
- Performance Advisor rerun completed and no longer reports `idx_entitlements_user_product`;
- source migration + rollback filenames are reconciled to live version `20260907110644`;
- exact rollback: `supabase/rollbacks/20260907110644_restore_redundant_entitlements_user_product_index.sql`;
- PR #105 requires fresh exact-head Release Gate + Preview after reconciliation before merge.

## Issue #98 Phase A — static Search actions prepared / 7 Sep 2026

- current-main static inline handler baseline: 25 total = onclick 21 + onkeydown 1 + onsubmit 3;
- Phase A touches only the Search/home-brand surface: 7 handlers;
- extracted ownership lives in new same-origin `static-search-actions.js`, loaded once near the existing bottom runtime loaders after core `App` definition;
- Search/home-brand elements now use stable IDs and no executable `on*=...` attributes;
- after Phase A static handler count is 18 = onclick 15 + onsubmit 3; static onkeydown is 0;
- Enter-key Search submit, desktop/mobile open, both close actions, button submit, and brand-home navigation are preserved by addEventListener bindings;
- regression locks exact static counts, IDs, loader count, behavior markers, and prohibits markup/network/Supabase behavior in the binder;
- no Auth, Studio Smart Brief, generated template handlers, CSS, CSP header, Supabase, API, or application-data change belongs to this phase;
- PREPARED ONLY while Vercel Preview is `build-rate-limit`; do not merge until exact-head Release Gate PASS + Preview SUCCESS + Search keyboard/mouse browser acceptance.

## Issue #98 Phase B — static Studio Brief actions prepared / 7 Sep 2026

- stacked on Phase A Search branch; do not merge before Phase A;
- Phase B removes exactly 6 static Smart Brief onclick handlers;
- static handler count after Phase B: 12 = onclick 9 + onsubmit 3;
- ownership moves to same-origin `static-studio-brief-actions.js`;
- close icon + secondary close use stable IDs;
- three conversational chips use `data-studio-refinement` contracts;
- submit preserves the original button element argument to `App.studioAI.submitSmartBrief`;
- regression locks counts, exact refinement values, IDs, loader, and no inline `App.studioAI`;
- no Search behavior change beyond inherited Phase A; no Auth, generated template, CSS, CSP header, DB, API, or data change;
- PREPARED ONLY while Vercel is quota-blocked; after Phase A merges, retarget/sync this branch before Preview/merge.

