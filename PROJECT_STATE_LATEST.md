# STUDIHOME — PROJECT STATE LATEST

Snapshot: 6 September 2026  
Status: **SECURITY/RELEASE HARDENING ACTIVE**

## Current baseline

- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Verified production evidence SHA: `1ce0b628fb1733d404c5125ff4ab0176791e58e4`
- PR #73: **MERGED**
- Main push release-gate run 602: **PASS 25/25**
- Vercel production deployment for `1ce0b628...`: **SUCCESS**
- Last known production alias SHA before merge: `bc3f31f445e21ac3b8582bd40ea70c10a7db167f`
- Production verification for `1ce0b628...`: **PASS / VERIFIED**
- Latest fully production-smoke verified evidence: `1ce0b628fb1733d404c5125ff4ab0176791e58e4`
- Frontend: static HTML/CSS/Vanilla JS
- Backend/Auth: Supabase
- Hosting: Vercel
- Canonical Dapur: `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `supabase-config.js`

Always refresh `main`, Vercel, and live Supabase before new work.

Manual Vercel recovery playbook: `VERCEL_MANUAL_DEPLOY.md`. Current approved production source target is `main` SHA `49db8b39591752e6486506415bda42abb2096744`; never use PR #74 head as application production source.

Vercel capacity recovery and production verification — 7 Sep 2026:
- PR #74 fresh Vercel check: SUCCESS;
- PR #74 Release Gate #614: PASS;
- merged main SHA: `1ce0b628fb1733d404c5125ff4ab0176791e58e4`;
- main Release Gate #615: PASS;
- production Vercel deployment: SUCCESS;
- Production Smoke run #9 / `34068317674`: PASS;
- production alias SHA reconciliation passed;
- state: **PASS / VERIFIED** for this deployment evidence.


## Release governance — RESOLVED

GitHub Ruleset:

- Name: `Studihome Main Protection`
- Enforcement: Active
- Target: `refs/heads/main`
- Pull request required: ON
- Required approvals: 0
- Required status check: `release-gate`
- Integration: GitHub Actions
- Strict/up-to-date status checks: ON
- Branch deletion blocked
- Non-fast-forward / force-push blocked
- No bypass actors

## Current release gate

`Studihome Release Gate / release-gate` validates:

- JavaScript syntax
- inline JavaScript syntax
- structured config
- P0 push rollout guardrails
- public runtime secret patterns
- security headers
- exact Supabase SDK pin
- PWA cache/version invariants
- SEO/trust/crawl invariants
- diff hygiene

## P0 / high-risk state

### Push notification

- `PUSH_ROLLOUT_ENABLED = false`
- automatic permission/subscription after login/register removed
- M46 source hardened but NOT applied
- `send-push-notification` remains NOT production-ready
- do not enable push until standards-compliant sender + real-device interoperability pass

### Supabase Auth leaked-password protection

- Advisor warning remains because project is on Supabase Free
- HaveIBeenPwned leaked-password protection requires Pro+
- classification: **ACCEPTED / PLAN-LIMITED RISK**
- do not fake this with SQL or client-side-only validation
- product decision currently keeps minimum password length at 6 characters

## Supabase performance state

Latest Advisor after optimizer work:

- duplicate indexes: **0**
- unindexed foreign keys: **0**
- multiple permissive policies: **0**
- unused indexes: observational only; do not drop solely from this lint

Applied production migrations:

- `20260906120944_remove_redundant_email_token_policy`
- `20260906121149_remove_duplicate_core_fk_indexes`
- `20260906121433_index_remaining_foreign_keys`
- `20260906141254_consolidate_rls_policies_batch1`
- `20260906141506_consolidate_creator_rls_policies_batch2`
- `20260906141626_consolidate_public_admin_rls_batch3`
- `20260906141936_convert_safe_admin_rpcs_to_security_invoker`
- `20260906142048_correct_admin_rpc_security_modes`
- `20260906142509_convert_more_admin_rpcs_to_security_invoker`
- `20260906143452_convert_creator_read_helpers_to_security_invoker`
- `20260906143850_fix_creator_review_submission_trigger_contract`
- `20260906143929_harden_creator_review_submission_rowcount`
- `20260906144934_convert_creator_self_service_rpcs_to_security_invoker`
- `20260906150336_guard_public_route_namespace`
- `20260906150757_harden_browser_table_privileges`

All are tracked under `supabase/migrations/`.

## Browser-role table ACLs — HARDENED

Verified production state:
- `anon` / `authenticated` have no `TRUNCATE`, `TRIGGER`, or `REFERENCES` table privilege in `public`.
- `anon` access to `modules`, `site_settings`, and `testimonials` is read-only.
- schema `public`: anon/authenticated have USAGE but not CREATE.
- authenticated CRUD needed by Creator/Admin flows remains intact.
- Supabase Data API uses explicit CRUD grants + RLS; browser roles are not given DDL/destructive table privileges.

Regression tests:
- anon public reads: PASS
- admin authenticated category update: PASS
- Creator self-service username RPC: PASS
- all mutation tests rolled back.

CI now rejects tracked Supabase migrations that re-grant dangerous table privileges to browser-facing roles.

## RLS regression verification

Completed and PASS:

- admin/member visibility after batch 1
- admin/Creator-owner visibility after batch 2
- anon/member/admin visibility after batch 3

No data mutation persisted from regression tests; tests used transaction rollback.

## Security Advisor state

Current findings:

- `rls_enabled_no_policy`: 3 INFO
- `anon_security_definer_function_executable`: 8 WARN
- `authenticated_security_definer_function_executable`: 20 WARN
- `auth_leaked_password_protection`: 1 WARN (Free-plan limitation)

The three RLS/no-policy tables are intentional direct-access deny surfaces:

- `ai_search_logs`
- `indexnow_submissions`
- `smart_demand_signals`

Verified table ACL:
- anon: no direct table grant
- authenticated: no direct table grant
- service_role: SELECT only

Do not add dummy RLS policies merely to silence INFO.

## SECURITY DEFINER hardening

Verified:

- no current SECURITY DEFINER function is executable by PostgreSQL `PUBLIC`
- admin RPCs are not executable by `anon`
- admin RPC bodies reviewed so far perform `is_admin()` checks
- public signal functions have explicit bounds/rate controls
- public read functions are intentional privileged/sanitized read contracts

Converted and regression-tested as `SECURITY INVOKER`:

- `admin_set_creator_verified(uuid, boolean)`
- `admin_set_creator_portfolio_active(uuid, boolean)`
- `admin_set_creator_rating_visibility(uuid, boolean)`
- `admin_delete_creator_like(uuid)`
- `admin_review_creator(uuid, text, text)`
- `has_premium_creator_access()`
- `is_creator_eligible()`
- `has_creator_workspace_access()`
- `can_publish_creator(uuid)`
- `change_creator_username_once(text)`
- `change_creator_username_for_profile(uuid, text)`
- `submit_creator_for_review()`

Admin-success and non-admin-denial regression tests: PASS.

Creator self-service INVOKER regression tests:
- change username once baseline vs after: PASS
- change username by profile baseline vs after: PASS
- submit review baseline vs after: PASS
- non-owner username change denial: PASS

Creator helper INVOKER equivalence tests:
- admin baseline/output: PASS
- premium Creator baseline/output: PASS
- non-premium member baseline/output: PASS
- downstream Creator RLS visibility after helper conversion: PASS

The following were tested for INVOKER but intentionally restored to DEFINER because authenticated lacks direct DML grants on their protected tables:

- `admin_set_creator_external_rating_visibility`
- `admin_add_creator_external_rating`
- `admin_add_creator_like_adjustment`

Do NOT grant broader table DML only to reduce Advisor warnings.


## Creator review submission bug — RESOLVED

A pre-change baseline test found `submit_creator_for_review()` was already failing with:

`Status review dikelola sistem/Admin.`

Root cause:
- `submit_creator_for_review()` legitimately updates review-managed fields;
- `enforce_creator_review_rules()` blocked every non-admin change to those fields;
- SECURITY DEFINER does not change `auth.uid()` / the business identity, so the trigger still treated the caller as a normal Creator.

Resolution:
- the RPC now sets a transaction-local `app.creator_review_submit_user` marker bound to `auth.uid()`;
- the trigger accepts only the narrow owner-bound transition to `PENDING`;
- direct client updates to review status remain denied;
- RPC update row count is captured with `GET DIAGNOSTICS ... ROW_COUNT` before any later `PERFORM`.

Regression test:
- official submit RPC -> PASS
- transactional state becomes `PENDING` -> PASS
- direct Creator update of `review_status` -> still denied, PASS
- all test mutations rolled back.


## Social proof privacy contract

`get_public_social_proof_recent()` intentionally returns full member names because Migration 22 records an explicit owner request to unmask them.

Do not silently re-mask this without a product/privacy decision.

## Private crawl hardening — ACTIVE

- private application routes receive `X-Robots-Tag: noindex, nofollow, noarchive`.
- Dapur shell has matching meta robots.
- Admin Gudang/Admin Dapur roots use `data-nosnippet`.
- release-gate includes private crawl/admin snippet regression guards.

## Public route namespace — HARDENED

Verified current state:
- Creator username ↔ category slug collisions: 0 before guard.
- Legacy static/category collisions remain for `ai-video`, `ai-automation`, and `ai-content`.
- Those legacy category slugs are allowed only while unchanged.
- New Creator usernames cannot claim category/system route slugs.
- New/changed category slugs cannot claim Creator/system route slugs.
- Matching route claims are serialized with an advisory transaction lock.
- Sitemap skips category entries shadowed by an existing static route, so one canonical URL is emitted.

Regression tests:
- valid Creator username change: PASS
- Creator username -> existing category slug: denied, PASS
- Creator username -> reserved system route: denied, PASS
- category slug -> existing Creator username: denied, PASS
- unchanged legacy `ai-video` category slug: PASS
- all mutation tests rolled back.

## Public API resilience — HARDENING IN PROGRESS

Current bounded upstream behavior:
- `api/sitemap.js`: Supabase read timeout 3500 ms.
- `api/index-push.js`: bounded request window 10000 ms.
- `api/agent-search.js`: data read timeout 3500 ms; non-critical intent log timeout 1200 ms.
- `api/markdown.js`: each Supabase read bounded to 3500 ms.
- no automatic retry is added to native-fetch Data API calls; failure remains bounded and explicit.
- Markdown public error payload remains unchanged on upstream timeout.
- Agent Search timeout uses HTTP 504 with the existing JSON error envelope.
- release-gate includes timeout guard markers for all four public API handlers.
- runtime regression harness validates Agent Search success/timeout behavior and Markdown success/timeout/pSEO fallback behavior with mocked abortable upstreams.

## Edge Function supply chain — HARDENED

Current repo target:
- browser and Edge Function Supabase SDK target: `2.115.0`.
- `send-email-verification`: redeployed live v5; source/live exact match after pin; `verify_jwt=false` retained because the function performs its own bearer/session validation.
- `provision_managed_creators`: redeployed live v2; `index.ts` + `deno.json` source/live exact match after pin; `verify_jwt=true`.
- `send-push-notification`: source-only pin; function remains NOT production-ready and must not be deployed/enabled from this dependency change alone.
- release-gate rejects major-range `npm:@supabase/supabase-js@2` imports in tracked Edge Functions.
- `smooth-action` and `swift-endpoint` are legacy/quarantined; no current repo runtime caller was found and CI blocks new runtime references.
- direct HTTP Edge invocation smoke remains **NOT VERIFIED** because the connected tooling exposes deploy/read but not invoke/logs, while the local shell has no DNS route to the Supabase host.
- do not retire legacy functions until independent invocation evidence is available.

## Manual Vercel deployment recovery — DOCUMENTED

- preferred recovery path is Vercel Dashboard -> Deployments -> Create Deployment -> exact approved Git SHA;
- current approved source target: `49db8b39591752e6486506415bda42abb2096744` from `main`;
- if branch configuration is requested, use `main` / Production configuration;
- avoid untracked ZIP upload because `/api/version` verification depends on Git deployment provenance;
- a manual deployment is still quota-counted and cannot bypass `build-rate-limit`;
- only Promote to Production after confirming the deployment Git SHA;
- after promotion, `/api/version` must equal the approved SHA and production smoke must PASS;
- full operator procedure: `VERCEL_MANUAL_DEPLOY.md`.

## Production deployment verification — VERIFIED

Current mechanism:
- `api/version.js` exposes only the current Vercel Git commit SHA and deployment environment; no secret/config values.
- response is `no-store` and GET/HEAD only.
- post-deploy GitHub workflow waits until `studihome.id/api/version` equals the pushed `github.sha` before testing production.
- smoke logic lives in dependency-free `scripts/production-smoke.py`; release-gate py-compiles and self-tests it before merge.
- production workflow YAML is intentionally minimal: checkout + one Python command.
- production smoke validates global security headers, trust pages, Dapur noindex, sitemap uniqueness/private-route exclusion, Agent Search, pSEO Markdown, and unauthenticated 401 boundaries for the two active Edge Functions.

Latest production evidence for `bc3f31f445e21ac3b8582bd40ea70c10a7db167f`:
- Vercel deployment: SUCCESS.
- production alias SHA reconciliation: PASS.
- public pages/security headers: PASS.
- production smoke run `34045201632`: FAIL on duplicate sitemap URLs.
- live-data root cause: three published Creator scopes each contain three active portfolios with the same title-derived route slug.
- this is a real canonical/deep-link ambiguity, not only a test artifact.
- no production data was deleted or rewritten to hide the conflict.

Portfolio route correction — SOURCE MERGED / PRODUCTION BLOCKED:
- unique portfolio titles preserve their historical title-only slug.
- only colliding title slugs receive a deterministic UUID-derived suffix in the reserved `--` namespace (example: `demo--aaaaaaaa`).
- normal title slugification collapses punctuation runs to a single `-`, so a natural title slug cannot occupy the reserved `--` collision namespace.
- UUID suffix length expands when needed so equal short prefixes cannot re-collide.
- historical title-only deep links remain readable as backward-compatible fallback.
- runtime Creator links, Sitemap, Markdown/GEO, and IndexNow use the same canonical contract.
- release-gate includes behavior regressions for collision routing, reserved-namespace separation, sitemap uniqueness, and IndexNow canonical enforcement.
- PR #73 merged to `main` as `49db8b39591752e6486506415bda42abb2096744` after release-gate PASS and Vercel Preview SUCCESS.
- main push release-gate run 602: PASS 25/25.
- production Vercel deployment for the merge SHA returned `build-rate-limit`; classify as BLOCKED external.
- production smoke run `34047113620`: **FAIL** — all 36/36 alias checks still returned `bc3f31f445e21ac3b8582bd40ea70c10a7db167f`, not merge SHA `49db8b39591752e6486506415bda42abb2096744`.
- exact smoke error: `Production alias did not converge to 49db8b39591752e6486506415bda42abb2096744`.
- do not claim the collision fix live until `/api/version` equals current main and production smoke passes.

## Console diagnostics triage — 7 Sep 2026

User-supplied `/studio-ai` console evidence was audited against current main:
- no repository implementation of `chrome.runtime`, `browser.runtime`, `sendMessage`, `onMessage`, or a matching page message listener was found;
- repeated `Receiving end does not exist` / asynchronous message-channel-closed errors are **not proven Studihome defects** and are classified as likely browser-extension/content-script noise;
- YouTube embed emits `compute-pressure` Permissions Policy warning; current Studihome policy remains unchanged because playback does not require weakening the security boundary;
- Chromium Windows emits `powerPreference option is currently ignored` diagnostic from the embedded player path;
- PWA banner warning reflects `beforeinstallprompt.preventDefault()` semantics; no runtime change is justified without evidence that the custom install CTA fails;
- social-proof widget diagnostics show successful client readiness and 3 loaded items.

No application/runtime/security-header change was made for the reported third-party/extension-origin console messages. Required reproduction rule: test with extensions disabled/incognito and obtain a Studihome-owned stack frame before opening a runtime-fix PR.

Console regression guard — ACTIVE:
- CI scans audited first-party browser runtimes and rejects `chrome.runtime` / `browser.runtime` extension messaging;
- CI rejects a Service Worker `message` listener unless the release guard is deliberately updated with an audited contract;
- CI verifies the custom PWA install flow retains `beforeinstallprompt`, `preventDefault`, saved deferred event, `prompt()`, `userChoice`, and `appinstalled`;
- no global `unhandledrejection`/`window.onerror` suppression was introduced.

## Legacy/runtime ownership audit — COMPLETED WITH CORRECTION

Direct parsing of the large current-main `index.html` corrected an earlier incomplete code-search result.

Verified current-main ownership:
- `index.html` loads `/admin-dapur-creator-v5.js?v=10`.
- Admin router calls `window.StudihomeAdminDapurCreatorV5?.open?.()` for the `dapur-creator` tab.
- `index.html` loads `/admin-gudang-v2.js?v=5`.
- Admin router calls `window.StudihomeGudangV2?.open?.()` for the `gudang` tab.
- `dapur-profile-enhancements.js` is directly loaded by `index.html`.
- `under-construction-gudang.js` is directly loaded by `index.html`.
- `under-construction.js` is dynamically loaded by `maintenance-gate.js` and `under-construction-gudang.js`.
- `admin-dapur-ui-v2.js` has no current direct HTML loader; its discovered consumers remain unproven as current-loaded runtimes.
- `studio-ai-enhancements.js` and `studio-ai-production-enhancements.js` have no direct `index.html` loader and no external filename reference found in the current ownership audit.

Classification:
- `admin-dapur-creator-v5.js`: **KEEP / ACTIVE RUNTIME**.
- `admin-gudang-v2.js`: **KEEP / ACTIVE RUNTIME**.
- `dapur-profile-enhancements.js`: **KEEP**.
- `under-construction-gudang.js`: **KEEP**.
- `under-construction.js`: **KEEP**.
- `admin-dapur-ui-v2.js`: **DELETE-CANDIDATE**.
- `studio-ai-enhancements.js`: **DELETE-CANDIDATE / NOT CURRENTLY LOADED**.
- `studio-ai-production-enhancements.js`: **DELETE-CANDIDATE / NOT CURRENTLY LOADED**.
- Issue #21: **COMPLETED WITH CORRECTED EVIDENCE**.
- Issue #22: **CLOSED / COMPLETED**.
- Issue #24: **CLOSED / COMPLETED** after canonical singleton refactor was merged and production-verified.
- no runtime file was deleted or changed in this audit.

Audit rule: GitHub code search can miss references inside the very large `index.html`. Zero-consumer proof must include direct source parsing plus dynamic-loader inspection.


## P1 remaining

- continue per-function SECURITY DEFINER classification/hardening
- review legacy/unmapped Edge Functions using invocation evidence before retirement (current connected Supabase tool does not expose invocation logs; do not retire without independent log evidence)
- continue observability and production smoke automation
- evaluate strict nonce/hash CSP migration only after inline-runtime extraction
- route-aware server/pre-render metadata for high-value public routes
- continue runtime monolith reduction with canonical-owner discipline
- resolve Issue #24 on a separate runtime PR: remove duplicate Admin Dapur Supabase client fallback only after focused singleton/readiness regression coverage

## No-regression boundary

Do not:

- fabricate social proof
- expose service-role/secret credentials
- redesign unrelated UI
- force-push/reset history
- bypass `release-gate`
- apply SQL without live audit + verification
- use RLS as UI workaround
- broaden table grants solely to remove Advisor warnings
- re-enable push before backend/device verification

## Release language

Use:
- PASS
- FAIL
- BLOCKED
- NOT VERIFIED
- NOT APPLICABLE

Preferred statement:

“Tidak ditemukan known regression pada test scope yang telah dijalankan untuk SHA <sha>.”


## Admin Dapur Supabase singleton — COMPLETED / PRODUCTION VERIFIED

Issue #24:
- removed duplicate hardcoded Supabase URL/key ownership from `admin-dapur-creator-v5.js`;
- removed dynamic Supabase SDK injection from that runtime;
- removed secondary `window.__studihomeAdminSupabase` creation path;
- runtime now uses only canonical `window.supabaseClient`;
- delayed readiness is handled by waiting for `studihome:supabase-client-ready` with a 3000 ms timeout;
- failure is explicit instead of silently creating a second auth client;
- `index.html` loader bumped from `v=10` to `v=11`;
- added `tests/admin-dapur-supabase-singleton-regression.js` and wired it into Release Gate;
- no schema, migration, RLS, grant, Auth configuration, or production data change.

Verified evidence: PR #77 Release Gate #620 PASS; Vercel Preview SUCCESS; merged main SHA `1c1702f1020c6743b09d84d0dce559484754284b`; Vercel Production SUCCESS; main Release Gate #621 PASS; Production Smoke #12 / `34069115071` PASS.


## Dapur auth modal accessibility — FIX IMPLEMENTED

User console evidence on `/dapur`:
- AdobeClean slow-network intervention: external Chrome extension;
- async message channel closed: external/extension provenance unless first-party stack is proven;
- Supabase login 400: expected rejected-auth response, already caught by Dapur UI;
- actionable Studihome warning: focused `.auth-close` remained inside `#dapur-auth-modal` when `aria-hidden=true` was applied.

Implementation:
- hidden modal starts `inert=true` + `aria-hidden=true`;
- open flow clears inert and focuses `#login-email`;
- close flow blurs contained focus before inert/aria-hidden, then restores invoking control focus;
- login now blocks passwords shorter than 6 characters before network auth;
- `dapur-entry.js` cache-buster bumped to `v=20260907a11y1`;
- added `tests/dapur-auth-modal-accessibility-regression.js` and Release Gate integration;
- no DB, RLS, Auth configuration, Supabase project, or security-header change.


## Current authority update — 7 Sep 2026

This section supersedes older contradictory status paragraphs in this file.

- production-verified main baseline before PR #79: `e213d6d98eab3c47f559cda8b285aebfb7a9895d`;
- PR #79 accessibility fix remains open; prior Release Gate PASS, Vercel Preview currently BLOCKED by build-rate-limit;
- Issue #24: CLOSED / COMPLETED / production-verified;
- Issue #19: Studio AI legacy files `studio-ai-enhancements.js`, `studio-ai-production-enhancements.js`, and `studio-ai-search.js` are DELETE-CANDIDATE / not loaded; no deletion yet. CSP tightening is deferred because index.html still contains 25 inline script blocks and 9 inline style blocks;
- Issue #62: `smooth-action` ACTIVE v2, `swift-endpoint` ACTIVE v1; no repo runtime caller, but retirement remains BLOCKED by missing invocation-log evidence;
- Issue #23: live creator_portfolios schema/grants/RLS support Admin bulk intake without DB changes; implementation contract is deterministic URL-only classification/title, same-Creator normalized URL dedupe, `is_active=false`, explicit added/skipped/duplicate/invalid counts, no scraping;
- PR #43 and PR #50 were closed as superseded on 7 Sep 2026.


## Current authority update — 7 Sep 2026 / refresh 2

This section supersedes earlier contradictory status sections.

- production-verified main: `e213d6d98eab3c47f559cda8b285aebfb7a9895d`; Vercel SUCCESS; Release Gate #623 PASS; Production Smoke #13 PASS;
- PR #79: Dapur auth-modal accessibility fix; source/CI ready but merge blocked until fresh Vercel Preview SUCCESS for current head;
- Issue #80 / draft PR #81: Creator trust RPC hardening prepared and CI-validated; migration remains NOT APPLIED live;
- Issue #19: CLOSED / COMPLETED audit. Follow-ups: #84 inactive Studio AI cleanup, #85 phased CSP extraction/enforcement;
- Issue #82: CLOSED / COMPLETED audit; no Advisor-unused index dropped;
- Issue #83: redundant `idx_entitlements_user_product` cleanup candidate, isolated/reversible only;
- Issue #62: legacy Edge retirement blocked by missing invocation evidence;
- Issue #23: canonical CRUD owner corrected to `dapur-editor.js`. Live DB requires HTTPS-only portfolio URLs. Bulk intake contract: private Admin-only path, canonical Supabase singleton, normalize/dedupe new generic URLs only, no historical cleanup, max 100 lines, deterministic title, `service_id=null`, `description=''`, `is_active=false`, append deterministic sort order, no scraping;
- Issue #86: CLOSED / COMPLETED with NO CLEANUP after proving 45 same-URL groups are service-linked variants, not safe duplicates;
- PR #43 and PR #50 remain CLOSED AS SUPERSEDED.


## Creator trust RPC hardening — synchronized branch state

- production main after PR #79: `d32c7e04b5c3d916c85a57a5528f18e6501134a1`;
- PR #79 verification: Vercel Production SUCCESS; Release Gate #638 PASS; Production Smoke #14 PASS;
- PR #81 security branch must be synchronized with this production state before fresh Preview/CI;
- prepared migration constrains unpublished direct trust-metric visibility while retaining published/owner/Admin access;
- post-apply SQL verification and explicit rollback artifacts are present;
- migration remains NOT APPLIED live pending fresh PR #81 Preview + Release Gate and post-apply SQL verification.


## Current authority update — 7 Sep 2026 / refresh 4

- production main: `d32c7e04b5c3d916c85a57a5528f18e6501134a1`; Vercel Production SUCCESS; Release Gate #638 PASS; Production Smoke #14 PASS;
- PR #81: security hardening workstream; current validated head before this docs refresh `c89700a336850b716e602d2ebd903c1ee72d3679`; Release Gate #642 PASS; Vercel BLOCKED; migration NOT APPLIED;
- live preflight PASS and exact migration SQL transaction-test PASS; published parity 0 mismatch; unpublished anonymous denial PASS; Admin PASS; owner workspace PASS; ACL/security contract preserved;
- exact rollback SQL transaction-test PASS on 48 Creator rows with 0 output mismatch and exact function-definition restoration;
- final live preflight after rollback PASS;
- PR #88: stacked draft Issue #23 implementation on #81; exact feature head `4a01c183b282d3abbe07f67eabece35faa656afa`; Release Gate #643 PASS; Vercel BLOCKED; no schema/RLS/Auth/grant/data change;
- Issue #90: overlapping portfolio media CHECK constraints audited; proposed unified policy is compatible with 139/139 live rows; no schema change applied.


## Current authority update — 7 Sep 2026 / refresh 5

- production main `d32c7e04b5c3d916c85a57a5528f18e6501134a1` remains VERIFIED;
- PR #81 prior exact head `55abd94353f319ff085e132bb51ad61eb9df6885`: Release Gate #646 PASS; live preflight PASS; transactional apply PASS; exact rollback PASS; migration NOT APPLIED;
- Vercel provider recovery confirmed on PR #88 exact head `3a1d5a681d56ee5f957487aabc8ffbd18ba1054e`: Release Gate #648 PASS; Preview SUCCESS;
- PR #88 remains stacked and unmerged; URL credential/non-default-port hardening included;
- Issue #90 migration contract READY with transactional apply/deny/rollback proof; no live schema change;
- Issue #83 cleanup contract READY with transactional drop/planner/rollback proof; no live index change;
- Issue #62 remains BLOCKED by unavailable invocation telemetry.


## Console hygiene remediation state — 7 Sep 2026

Before continuing #81 -> #88, current console evidence was triaged.

- Social proof successful boot/load logs: first-party noise, remediation prepared.
- PWA beforeinstallprompt banner diagnostic: expected custom-install behavior; no functional change.
- message-channel errors: extension/content-script provenance remains the supported classification; first-party extension-messaging regression guard remains active.
- Creator avatar DNS failures: all 5 reported storage objects exist in live `creator-media`; no data repair required.
- isolated remediation branch adds strict same-origin avatar proxy, fallback image behavior, active Studio AI renderer integration, social-proof log cleanup, cache-buster updates, and regression coverage.
- no persistent Supabase/storage/schema/RLS/Auth/grant change.


## Current authority update — 7 Sep 2026 / refresh 6

- production main: `2809811790ab12511886355f8a0cc42717a82745`;
- PR #101 console hygiene/avatar resilience: PRODUCTION VERIFIED;
- Release Gate #657 PASS; Production Smoke #15 PASS;
- PR #81 synchronized with console runtime/CI and retains Creator trust migration/preflight/verification/rollback artifacts;
- migration remains NOT APPLIED pending fresh exact-head gate + Preview validation.

## Current authority update — 7 Sep 2026 / refresh 7

- production main: `2809811790ab12511886355f8a0cc42717a82745`; console hygiene/avatar resilience is production-verified;
- the five reported Creator avatar objects exist in live `creator-media`; the observed `ERR_NAME_NOT_RESOLVED` was not a missing-object/RLS failure and current main routes eligible avatar rendering through the strict same-origin resilience endpoint;
- Creator trust RPC hardening preflight: PASS;
- persistent Supabase apply: PASS; live migration history version `20260907063648` / `constrain_creator_trust_metrics_visibility`;
- post-apply visibility verification: PASS for published, anonymous-unpublished denial, Admin, and eligible owner/workspace cases;
- migration source/rollback/test references are being reconciled to `20260907063648` before merge to avoid local-vs-remote migration-history drift;
- no table/RLS/grant/storage/application-data change was introduced by this migration;
- Security Advisor rerun completed; the target RPC retains intentional public EXECUTE for published Creator metrics and therefore remains visible to generic SECURITY DEFINER linting even though unpublished authorization is now enforced inside the RPC;
- Performance Advisor: INFO-only unused-index candidates; no index change performed;
- before merging #81: require exact-head Release Gate PASS and confirm its diff remains DB/tests/docs/workflow only. PR #88 stays stacked until #81 is completed.

## Issue #23 mainline rebuild — 7 Sep 2026

- original PR #88 is superseded as a stale stacked branch after #81 merged;
- clean feature work is rebuilt from main `fec5512fd1f8449a31071a926a2ca5280c2ee498` with only the intended Admin bulk-portfolio runtime/test/docs delta;
- `dapur-editor.js` and `dapur-entry.js` old-base SHAs matched current main before transplant, preventing loss of intervening runtime changes;
- contract: Admin recheck via `is_admin()`, canonical `window.supabaseClient`, HTTPS-only, max 100 lines, reject URL credentials, normalized dedupe, one bounded batch insert, deterministic draft rows, no scraping;
- direct video/generic non-provider URLs stay DB-compatible via generic `link` classification where required;
- no DB/RLS/Auth/grant/data mutation;
- merge gate is strict: exact-head Release Gate PASS **and fresh Vercel Preview SUCCESS** are required because this branch changes browser runtime.

## Current authority update — 7 Sep 2026 / refresh 8

- source main: `fec5512fd1f8449a31071a926a2ca5280c2ee498` after completed PR #81;
- last production-verified deployed runtime: `2809811790ab12511886355f8a0cc42717a82745`; Vercel for `fec5512...` is provider-quota BLOCKED, while #81 has no frontend/API runtime delta;
- live Supabase trust-metric visibility hardening remains APPLIED + VERIFIED as migration `20260907063648`;
- PR #88: CLOSED AS SUPERSEDED;
- PR #102: canonical clean-mainline Admin bulk portfolio intake replacement, based directly on current main with seven intended feature/test/docs/workflow files;
- PR #102 must not merge until exact-head Release Gate PASS and fresh Vercel Preview SUCCESS.

