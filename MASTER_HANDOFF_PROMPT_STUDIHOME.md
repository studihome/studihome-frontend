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
