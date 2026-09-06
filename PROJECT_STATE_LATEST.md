# STUDIHOME — PROJECT STATE LATEST

Snapshot: 6 September 2026  
Status: **SECURITY/RELEASE HARDENING ACTIVE**

## Current baseline

- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Latest main before this state-sync PR: `dc6cc2724fdc0ca4d5465d80c136e74565cc5234`
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

All are tracked under `supabase/migrations/`.

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
- `authenticated_security_definer_function_executable`: 27 WARN
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

Admin-success and non-admin-denial regression tests: PASS.

The following were tested for INVOKER but intentionally restored to DEFINER because authenticated lacks direct DML grants on their protected tables:

- `admin_set_creator_external_rating_visibility`
- `admin_add_creator_external_rating`
- `admin_add_creator_like_adjustment`

Do NOT grant broader table DML only to reduce Advisor warnings.

## Social proof privacy contract

`get_public_social_proof_recent()` intentionally returns full member names because Migration 22 records an explicit owner request to unmask them.

Do not silently re-mask this without a product/privacy decision.

## P1 remaining

- continue per-function SECURITY DEFINER classification/hardening
- review legacy/unmapped Edge Functions using invocation evidence before retirement
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
