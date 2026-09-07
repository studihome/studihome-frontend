# STUDIHOME — RELEASE CHECKLIST

Updated: 7 September 2026  
Status: **RELEASE HARDENING ACTIVE — DO NOT CLAIM FULL RELEASE READY**

Allowed values: **PASS / FAIL / BLOCKED / NOT VERIFIED**.

This checklist is the release-decision surface. Source-level tests do not replace browser or production evidence.

## A. Source, branch, and deployment authority

- PASS — Current source `main`: `175110a8a3165611798919f0ed0bc37939d24661`.
- PASS — Last fully production-verified application runtime: `57cd6e5e95890706f6954ee085bca0fadba088a7`.
- PASS — Vercel Production for `57cd6e5...`: SUCCESS.
- PASS — Release Gate #674: PASS.
- PASS — Production Smoke #18 / `34114129036`: PASS with SHA reconciliation.
- PASS — `57cd6e5...` -> current `main` changes only release/docs/workflow + Supabase migration/test/rollback artifacts; no browser/API runtime file changed.
- NOT VERIFIED — production alias SHA equals current source `main` `175110a...`; do not infer this from runtime equivalence.
- PASS — `vercel.json` routing/security invariants remain protected by the Release Gate.

## B. Current CSP release candidate — PR #114

- PASS — Canonical PR #114: `security(csp): remove static handlers and generated actions — phases A–I`.
- PASS — Exact source head before this checklist refresh: `67427aa1e1521f9f8ed8c2dcf7aeca318ba9b43a`.
- PASS — PR is 0 commits behind `main` and mergeable.
- PASS — Studihome Release Gate #723: PASS.
- PASS — Latest runtime-changing Phase I head `afa5b293af287797ae43e3c5ff62fde07bd368dc` had Vercel Preview **Ready**.
- BLOCKED — latest docs/test-only head Vercel attempt is Free-plan daily deployment-quota blocked.
- PASS — the commit after `afa5b293...` changed only the Shop regression + authority docs; no application/runtime/workflow file changed.
- BLOCKED — PR remains DRAFT until real browser acceptance and clean first-party console evidence exist.

### CSP progress

- PASS — static HTML event attributes: **25 -> 0**.
- PASS — generated HTML event attributes: **184 -> 170**.
- PASS — Home/Hero generated event attributes: 0.
- PASS — UI utility generated event attributes: 0.
- PASS — Auth utility generated event attributes: 0.
- PASS — Shop checkout generated event attributes: 0.
- PASS — `javascript:` URLs remain 0.
- PASS — Shop delegated binder has executable VM-DOM behavior regression for submit/change/click, original Event forwarding, nested targets, idempotency, unknown-action rejection, and outside-container rejection.
- PASS — dependency-free real-Chromium action-binder smoke is Release-Gate wired for A–I external binders using local DOM + mocked App; this verifies real browser event/delegation semantics without touching Supabase or production data.
- BLOCKED — strict `script-src-attr` / `style-src-attr` enforcement; **170 generated handlers**, **36 core generated style attributes**, and **2 core dynamic event-attribute setters** remain.
- NOT VERIFIED — full application/Preview browser parity for the complete A–I interaction set; the local real-Chromium binder smoke is narrower and must not be misreported as production E2E.

## C. Database and security

- PASS — Supabase remains the backend/Auth/data authority.
- PASS — Creator trust-metric visibility hardening is applied live as migration `20260907063648_constrain_creator_trust_metrics_visibility` and verified.
- PASS — redundant `idx_entitlements_user_product` index removal is applied live as `20260907110644_remove_redundant_entitlements_user_product_index`; valid UNIQUE/FK-supporting indexes remain.
- PASS — browser-facing table privilege hardening and current RLS regression guards are active.
- PASS — no current SECURITY DEFINER function is executable by PostgreSQL `PUBLIC`.
- PASS — audited admin RPCs are denied to `anon`; reviewed admin bodies enforce Admin authority.
- BLOCKED — Supabase HaveIBeenPwned leaked-password protection is unavailable on the current Free plan; classified as **accepted / plan-limited risk**, not an application regression.
- PASS — product decision currently retains minimum password length of 6 characters.
- NOT VERIFIED — complete independent invocation telemetry for quarantined legacy Edge Functions; do not retire them from inference alone.

## D. Console, PWA, and first-party runtime hygiene

- PASS — first-party social-proof success/debug console noise was removed; actual failure diagnostics remain.
- PASS — active Creator avatar rendering uses strict same-origin resilience for eligible Studihome avatar paths.
- PASS — custom PWA `beforeinstallprompt` / deferred `prompt()` contract is guarded in CI.
- PASS — first-party browser runtimes are guarded against unexpected `chrome.runtime` / `browser.runtime` messaging.
- NOT VERIFIED — clean-console evidence on PR #114 in a real browser with extensions disabled/incognito.
- NOT VERIFIED — real-device PWA install flow after the current CSP candidate.

## E. Auth, ownership, and privileged flows

- NOT VERIFIED — login/register/forgot-password real-browser flow on PR #114.
- NOT VERIFIED — logout removes workspace authority in real browser.
- NOT VERIFIED — authenticated Creator owner can manage own Dapur and cannot manage another Creator in real browser.
- NOT VERIFIED — public/member accounts are denied Admin interfaces/actions in real browser.
- PASS — source-level Auth Phase C regression preserves native submit Event forwarding and mode-switch ownership.

## F. Checkout/payment regression

- PASS — Phase I source-level Shop handler refactor preserves existing method ownership.
- PASS — VM-DOM behavior regression proves delegated submit/change/click dispatch and exact checkout-close arguments.
- NOT VERIFIED — paid-product checkout Step 1 in real browser.
- NOT VERIFIED — payment checkbox state -> confirmation button behavior in real browser.
- NOT VERIFIED — payment confirmation action in real browser.
- NOT VERIFIED — checkout close behavior in real browser.
- NOT VERIFIED — checkout/payment/order confirmation full production E2E.
- BLOCKED — PR #114 merge until the bounded Shop browser acceptance above is observed without new first-party console errors.

## G. Public routing, SEO, and production smoke

- PASS — private crawl boundaries, trust routes, sitemap collision handling, portfolio canonical routing, and IndexNow canonical enforcement are release-gated.
- PASS — production smoke checks security headers, trust pages, private noindex, sitemap uniqueness/private exclusion, Agent Search, pSEO Markdown, and active Edge Function unauthenticated boundaries.
- PASS — last full Production Smoke #18 passed for production-verified SHA `57cd6e5...`.
- NOT VERIFIED — dynamic route visual/browser parity under PR #114; this PR is CSP behavior work rather than SEO redesign.

## H. UI/UX and accessibility

- NOT VERIFIED — PR #114 desktop visual parity after A–I.
- NOT VERIFIED — PR #114 mobile 375px layout/touch behavior.
- NOT VERIFIED — keyboard/focus/modal parity across every affected A–I surface.
- PASS — Search source regression protects Enter-key ownership and Search action contracts.
- PASS — Dapur auth-modal accessibility source regression remains in the Release Gate.
- NOT VERIFIED — reduced-motion/browser accessibility acceptance for the full application.

## I. Remaining generated-handler inventory

Current core generated HTML handler inventory after Phase I:

- Admin: **80**
- Studio AI: **43** plus 2 dynamic event-attribute setters
- Creator Studio: **28**
- Products: **12**
- Dashboard: **7**
- Shop/UI/Auth/Home: **0**

Sequencing rule:
- do not choose the next phase only by smallest count;
- Dashboard includes two inline async Supabase/Dapur flows and has higher semantic blast radius;
- Products is the preferred bounded Phase J candidate after PR #114 is browser-accepted/merged because its 12 handlers are predominantly thin calls to existing App methods;
- do not start Phase J by expanding PR #114 while A–I browser acceptance is still unresolved.

## J. Release decision

**Current release decision: BLOCKED.**

PR #114 must not merge until at minimum:

1. real-browser Search/Auth/Smart Brief/PWA/modal/top-shell/Home/utility/Shop acceptance is completed for the changed surfaces;
2. paid Shop submit/change/confirm/close flows pass;
3. no new first-party console errors are observed with extension noise excluded;
4. exact release-head automated gate remains PASS;
5. a valid Vercel Preview/equivalent deployment-evidence chain is available under the current quota constraints.

Strict CSP enforcement is a later milestone. Do not enable strict event/style attribute blocking while Issue #98 still has generated-handler/style debt.

Use `PROJECT_STATE_LATEST.md`, `MASTER_HANDOFF_PROMPT_STUDIHOME.md`, and `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` together with this checklist. None of them individually substitutes for live browser evidence.
