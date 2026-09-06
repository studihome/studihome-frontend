# STUDIHOME — PROJECT STATE LATEST

Snapshot: 6 September 2026  
Status: **SECURITY/RELEASE HARDENING ACTIVE**

## Current baseline

- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Latest deployed production main before portfolio-collision PR: `bc3f31f445e21ac3b8582bd40ea70c10a7db167f`
- Latest fully production-smoke verified main: **NOT YET ESTABLISHED**
- Frontend: static HTML/CSS/Vanilla JS
- Backend/Auth: Supabase
- Hosting: Vercel
- Canonical Dapur: `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `supabase-config.js`

Always refresh `main`, Vercel, and live Supabase before new work.

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

## Production deployment verification — FIX IN PROGRESS

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

Portfolio route correction in progress:
- unique portfolio titles preserve their historical title-only slug.
- only colliding title slugs receive a deterministic UUID-derived suffix in the reserved `--` namespace (example: `demo--aaaaaaaa`).
- normal title slugification collapses punctuation runs to a single `-`, so a natural title slug cannot occupy the reserved `--` collision namespace.
- UUID suffix length expands when needed so equal short prefixes cannot re-collide.
- historical title-only deep links remain readable as backward-compatible fallback.
- runtime Creator links, Sitemap, Markdown/GEO, and IndexNow use the same canonical contract.
- release-gate includes behavior regressions for collision routing, reserved-namespace separation, sitemap uniqueness, and IndexNow canonical enforcement.
- PR #73 remains OPEN / NOT MERGED.
- current Vercel Preview blocker: `build-rate-limit`; classify as BLOCKED external, never as Preview PASS or a reason to bypass the gate.

## P1 remaining

- continue per-function SECURITY DEFINER classification/hardening
- review legacy/unmapped Edge Functions using invocation evidence before retirement (current connected Supabase tool does not expose invocation logs; do not retire without independent log evidence)
- continue observability and production smoke automation
- evaluate strict nonce/hash CSP migration only after inline-runtime extraction
- route-aware server/pre-render metadata for high-value public routes
- continue runtime monolith reduction with canonical-owner discipline

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
