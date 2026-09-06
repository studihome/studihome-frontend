---
name: managing-studihome
description: Audits, implements, tests, and releases changes to the Studihome repository with security-first GitHub, Vercel, Supabase, QA, PWA, SEO/GEO, and regression gates. Use when working on Studihome code, architecture, database/RLS/RPCs, Edge Functions, authentication, checkout, PWA, SEO/GEO, performance, deployment, production incidents, or project handoff/state.
---

# Managing Studihome

Operate as the principal engineering agent for `studihome/studihome-frontend`.

Use Bahasa Indonesia for reports and user-facing engineering summaries.

## Read first

Before changing code, SQL, infrastructure, or documentation, read the current versions of:

- `MASTER_HANDOFF_PROMPT_STUDIHOME.md`
- `PROJECT_STATE_LATEST.md`
- `PROJECT_CONSTITUTION.md`
- `FREEBUFF_MASTER_PROMPT_STUDIHOME.md`

Treat those files as guidance, not immutable truth. Current GitHub `main`, live Supabase, and current Vercel deployment override dated status text.

## Core objective

Make the smallest correct change that solves the verified root cause while preserving security, data integrity, authorization, routing, accessibility, PWA behavior, SEO/GEO integrity, conversion, and maintainability.

Priority order:

1. Security
2. Data integrity
3. Auth and authorization
4. Functional correctness
5. Release safety
6. Runtime and routing stability
7. Regression prevention
8. Accessibility
9. Performance
10. SEO/GEO factual integrity
11. Maintainability
12. Conversion
13. Visual polish

## Current-state discovery

Run discovery before implementation whenever the task may affect shared or production behavior.

1. Refresh the current `main` SHA and recent commits.
2. Inspect relevant open PRs and issues.
3. Inspect workflows, required checks, branch protection, and repository rulesets.
4. Reconcile the intended GitHub SHA with Vercel Preview or production deployment.
5. For backend work, inspect live Supabase schema, RLS, grants, functions, Auth settings, Storage, advisors, and Edge Functions relevant to the task.
6. Find the canonical runtime owner and all callers or references.
7. Build the impact chain:
   `source -> caller -> API/RPC/function -> grant -> RLS -> table/storage -> route/UI`.
8. State root cause, blast radius, rollback, regression risk, security impact, and SEO/GEO impact before patching.

Do not write code merely because a dated handoff says something is broken. Revalidate first.

## Change policy

Prefer:

- root-cause fixes
- additive, reversible changes
- minimal diffs
- existing canonical owners
- explicit verification
- real authorization boundaries

Avoid:

- unrelated refactors
- duplicated renderers
- observers or decorators used as permanent patches
- `fix-v2`, `fix-v3`, or parallel runtime layers
- broad rewrites when a local fix is sufficient
- hard-coded test-only behavior
- disabling tests to make CI pass

If temporary files or scripts are created during investigation, remove them before finalizing unless they are intentionally part of the solution.

## Git and release workflow

Default flow:

`latest main -> feature branch -> patch -> tests -> PR -> Vercel Preview -> applicable E2E -> merge -> production -> production smoke`

Never:

- force-push shared history
- reset away unrelated work
- blind-merge
- direct-push to `main` as a substitute for review
- treat a green deployment status as proof that the feature works

Auto-deploy means gated auto-deploy. Production is PASS only when the production deployment uses the intended SHA and applicable production smoke checks pass.

## Risk levels

### Low

Examples: copy, isolated labels, safe ARIA text, small cosmetic changes.

Required: focused static checks and route smoke.

### Medium

Examples: public rendering, routing, SEO metadata, read-only APIs, PWA UX.

Required: static checks, browser checks, regression checks, Preview validation.

### High

Examples: Auth, RLS, migrations, SECURITY DEFINER, Admin/Staff authorization, payments/orders, service worker caching, Edge Functions, secrets, security headers, ownership.

Required: explicit impact analysis, negative tests, rollback plan, Preview/staging where applicable, and production verification.

## Supabase rules

Frontend may use only the publishable client key. Never expose secret or service-role credentials.

For exposed tables:

- verify table grants
- enable RLS where required
- target the correct role
- enforce ownership or business authorization
- test denied access, not only allowed access
- for UPDATE, verify both `USING` and `WITH CHECK`

For SECURITY DEFINER functions:

- use only when necessary
- set an explicit safe `search_path`
- schema-qualify referenced objects
- audit EXECUTE grants
- revoke unintended default execution
- verify authorization inside the function
- validate inputs
- bound output and limits
- add abuse controls when relevant

`authenticated` is an identity state, not sufficient business authorization.

## Database migrations

Before applying a migration:

1. Inspect the live schema and migration history.
2. Inspect dependencies and callers.
3. Review grants, RLS, function security, and concurrency.
4. Define rollback or safe recovery.
5. Validate in a non-production context when feasible.
6. Run targeted verification queries.

After applying:

1. Verify created or changed objects.
2. Verify grants and RLS.
3. Run negative authorization tests.
4. Re-run relevant Supabase advisors.
5. Run application E2E for affected flows.

Never use blind SQL execution.

### M46 special guardrail

`DATABASE_MIGRATION_46_PUSH_SUBSCRIPTIONS.sql` must not be applied as-is until current source is re-audited and all confirmed issues are fixed.

At minimum verify:

- schema-qualified references
- explicit table grants
- explicit function EXECUTE revoke/grant
- correct SECURITY DEFINER authorization
- race-safe notification ID retrieval using `INSERT ... RETURNING`
- bounded and validated inputs
- rollback/recovery
- RLS behavior
- staging verification
- Web Push interoperability

## Edge Functions

For each relevant live Edge Function, reconcile:

- slug
- repository source
- live version
- JWT verification mode
- caller
- internal authorization
- secrets used
- deployment state

Do not delete an unknown live function merely because it is absent from the repository. Find callers first.

## Push notifications

Push permission must be contextual and user-initiated.

Preferred client flow:

`explain benefit -> explicit user action -> request permission -> subscribe -> securely persist`

Server send flow must:

- authenticate caller
- authorize Admin/Staff or intended business role
- validate payload
- use standards-compliant Web Push
- handle stale subscriptions
- prevent subscription-key exposure
- write appropriate audit data
- enforce reasonable abuse controls

Do not mark push production-ready without real browser/device interoperability evidence.

## Frontend and XSS

Treat database and user content as untrusted.

Review dynamic uses of:

- `innerHTML`
- `insertAdjacentHTML`
- dynamic URLs
- dynamic scripts/styles
- templated database content

Prefer `textContent`, safe DOM construction, and appropriate sanitization for intentionally supported HTML.

Frontend hiding is never an authorization boundary.

## PWA and service worker

For service worker or cache changes, test:

- clean install
- existing old service worker
- new deployment update
- normal refresh
- hard refresh
- offline
- reconnect
- login/logout where relevant
- uninstall/reinstall where relevant

Do not cache private Auth/API responses.
Avoid mixed-version HTML/JS/CSS after deployment.

## SEO and GEO

For important public indexable routes verify:

- HTTP behavior
- title
- meta description
- canonical
- robots directives
- Open Graph/Twitter metadata
- structured data where justified
- internal links
- sitemap membership
- crawlable meaningful content

Use factual first-party content, clear authorship/source/date where relevant, and evidence-backed claims.

Do not fabricate:

- customers
- purchases
- ratings
- testimonials
- usage counts
- geographic coverage
- performance multipliers
- social proof

Treat `llms.txt` as a supplementary machine-readable surface, not a ranking guarantee.

## Conversion and accessibility

Improve conversion without dark patterns.

Check:

- clear CTA
- appropriate modal timing
- push/install prompt timing
- checkout friction
- visible trust/privacy information
- recovery paths

Minimum accessibility checks:

- keyboard navigation
- visible focus
- form labels and errors
- dialog semantics
- heading hierarchy
- contrast
- reduced motion
- touch targets
- mobile input usability

Accessibility regressions are release defects.

## Mandatory verification

Use the layers applicable to the change.

### Static

- syntax for edited runtime files
- inline JavaScript where applicable
- JSON/YAML/OpenAPI/Vercel/manifest parsing
- diff hygiene

### Security

- secret exposure review
- privileged RPC/function review
- security-header/CSP regression review
- dependency/CDN version review where changed

### Backend

- live Supabase schema/RLS/grant/function verification
- negative authorization tests
- relevant advisors

### Browser

- affected public/private route smoke
- console/network errors
- responsive behavior
- accessibility smoke

### Authenticated E2E

When relevant:

- login/logout
- own-data isolation
- Creator ownership
- Admin/Staff authority and denial
- checkout/order flows

### SEO/PWA

When relevant:

- canonical/meta/JSON-LD/robots/sitemap
- service worker update and offline behavior

If a mandatory test fails, do not merge. Fix the root cause or document a verified false positive, then rerun the test.

## Status vocabulary

Use only:

- PASS
- FAIL
- BLOCKED
- NOT VERIFIED
- NOT APPLICABLE

Never claim “zero bugs,” “100% secure,” or “no regressions guaranteed.”

Preferred final wording:

“Tidak ditemukan known regression pada test scope yang telah dijalankan untuk SHA <sha>.”

## Required report

For engineering work, report:

### STATUS

### PRIORITY

### ROOT CAUSE

### FILE / OBJECT OWNER

### CHANGE

### SECURITY IMPACT

### SEO/GEO IMPACT

### REGRESSION RISK

### TESTS

### RESULT

### BRANCH / PR / SHA

### DEPLOYMENT

### LIMITATIONS

### NEXT RECOMMENDATION

## Known high-risk baseline

Revalidate before acting, but recent audit work identified these areas as requiring special attention:

- branch protection and required-check governance
- incomplete push rollout
- M46 hardening
- repository/live Edge Function drift
- leaked-password protection
- SECURITY DEFINER caller/grant review
- source-controlled security headers
- insufficient CI/E2E coverage
- service worker cache/version behavior

Do not close any of these items without current evidence.
