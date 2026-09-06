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
8. `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` for continuation agents.

If dated documentation conflicts with live evidence, preserve Constitution principles but update the dated status. Do not substitute an old handoff claim for current verification.

## 3. Current release baseline

Current GitHub `main` source SHA:

`49db8b39591752e6486506415bda42abb2096744`

This SHA is the squash merge of PR **#73** (portfolio canonical collision hardening).

Evidence before merge:

- PR head `704fe6d56039aea76b14dbb2985672eef5944b05`;
- `release-gate`: **PASS 25/25**;
- Vercel Preview: **SUCCESS**;
- PR state before merge: clean.

Evidence after merge:

- main push `release-gate` run **602**: **PASS 25/25**;
- Vercel production status for `49db8b39591752e6486506415bda42abb2096744`: **FAIL / BLOCKED** with provider `build-rate-limit`;
- production smoke run `34047113620`: started for this SHA but has **not established PASS** because production alias has not converged to the merge SHA;
- production release status for `49db8b...`: **NOT VERIFIED / BLOCKED BY VERCEL DEPLOYMENT**.

Last known production alias evidence before this merge:

`bc3f31f445e21ac3b8582bd40ea70c10a7db167f`

For that SHA:

- production alias SHA reconciliation: **PASS**;
- global public security-header checks: **PASS**;
- production smoke run `34045201632`: **FAIL** on duplicate sitemap URLs.

Therefore do **not** claim the portfolio fix is live merely because it is merged to `main`. Re-run/complete deployment and production smoke only after Vercel can deploy the current main SHA.

## 4. Portfolio canonical URL contract — DO NOT REGRESS

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

## 5. Release governance

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

## 6. Current release-gate scope

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

## 7. Supabase safety baseline

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

## 8. Edge Functions

Current tracked Supabase JS target: `2.115.0`.

Recorded state:

- `send-email-verification`: live v5; application bearer/session validation; `verify_jwt=false` retained intentionally;
- `provision_managed_creators`: live v2; `verify_jwt=true`;
- `send-push-notification`: source-only / not production-ready;
- `smooth-action` and `swift-endpoint`: legacy/quarantined; no current repo runtime caller found.

Do not retire legacy functions without independent caller/invocation evidence.

## 9. Security and runtime boundaries

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

## 10. SEO / GEO rules

- `llms.txt` is not a Google ranking lever.
- Maintain canonical consistency between runtime HTML/SPA, sitemap, Markdown endpoints, IndexNow, and structured data.
- Private/auth/admin routes need HTTP/meta indexing controls; robots.txt is not a security boundary.
- pSEO content must be useful, unique, factual, and free of unsupported claims.
- Sitemap `<loc>` values must be unique.
- Do not fabricate freshness or statistics.

## 11. Definition of done

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

## 12. Required engineering report

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
