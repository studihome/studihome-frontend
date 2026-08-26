# STUDIHOME — RELEASE CHECKLIST

**Last updated: 26 Agustus 2026**  
**Current status: AUDIT OPEN**

## A. Source / Config
- [ ] `main` SHA identified and consistent across all 3 docs (Handoff, Constitution, State).
- [ ] Production SHA verified via Vercel dashboard matches local HEAD.
- [ ] `vercel.json` parses and contains only canonical Dapur rewrites.
- [ ] No invalid inline regex in Vercel rewrite sources.
- [ ] No legacy Dapur injector/gate is referenced by canonical shell.
- [ ] `dapur.html` loads canonical runtime only.
- [ ] No global `MutationObserver` in canonical Dapur runtime.
- [ ] No second-stage Dapur decorator.
- [ ] No Tailwind CDN.
- [ ] `/tailwind-compiled.css` exists and is loaded.
- [ ] **CSS version consistent** across source and all docs (`?v=20260825r3`).
- [ ] **No dead file references** (e.g., `/dapur-button.js` in vercel.json when file absent).

## A2. Security Headers
- [ ] `X-Frame-Options: SAMEORIGIN` present.
- [ ] `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` present.
- [ ] `X-Content-Type-Options: nosniff` present.
- [x] CSP meta tag present in `index.html` (with appropriate directives).
- [x] `Referrer-Policy: strict-origin-when-cross-origin` present.

## A3. Database Migrations
- [ ] Migration 10 (`validate_creator_publish` + `search_path=""` + REVOKE EXECUTE) run and verified. (File: **HARDENED ✅**, not yet run)
- [ ] Migration 11 (`contact_email DROP NOT NULL`) run and verified. (File: **HARDENED ✅**, not yet run)
- [ ] Migration 12 (`hero_promo_modules JSONB`) run and verified. (File: **HARDENED ✅**, not yet run)
- [ ] All SECURITY DEFINER functions have `search_path=""` (post-migration check).
- [ ] No anon/PUBLIC EXECUTE grants on authorization-only functions.

## A4. Internal Gate Consistency
- [ ] RC15 gate status matches RC16 gate status (no contradictions in `index.html`).
- [ ] RC15 `db.is-admin-public-execute` is PASS.
- [ ] RC15 `db.post-patch-verify` is PASS.
- [ ] RC16 `release.fingerprint` matches or is documented as drift.
- [ ] RC19 `security.final` reports `SECURITY_CLOSED`.
- [ ] RC19 `release.status` reports `FROZEN`.

## B. Homepage Visual Regression Gate
- [ ] Hero matches locked baseline: blue gradient `#151c75 → #3f48bf`.
- [ ] Hero typography/spacing/CTA unchanged from agreed baseline.
- [ ] No white-card cascade regression over hero.
- [ ] Desktop screenshot checked.
- [ ] Mobile screenshot checked.

## C. Auth Accessibility Gate
- [ ] `#login-email` → `autocomplete="username"`.
- [ ] `#login-password` → `autocomplete="current-password"`.
- [ ] `#reg-name` → `autocomplete="name"`.
- [ ] `#reg-email` → `autocomplete="email"`.
- [ ] `#reg-phone` → `autocomplete="tel"`.
- [ ] `#reg-password` → `autocomplete="new-password"`.
- [ ] No browser autocomplete warnings on member/admin login modal.
- [ ] **Browser-verified** (Constitution Gate B — previously OPEN, must re-verify).

## D. Public Flow
- [ ] `/` loads.
- [ ] `/dapur` loads as the same Dapur shell used for members.
- [ ] Public shows `Masuk / Daftar` only as its active auth action.
- [ ] `Masuk / Daftar` opens the canonical popup.
- [ ] Public Dapur does not show auth verification error before session resolution.
- [ ] Flash Sale loads exactly one active Premium product with the largest current discount.
- [ ] Flash Sale checkout uses existing Lobi checkout/order flow.
- [ ] Public Creator API reads return 200.
- [ ] No 401/403/404/500 caused by public Creator read requests.

## E. Member / Premium Flow
### Non-Premium
- [ ] `/dapur` renders.
- [ ] Workspace remains denied.
- [ ] Direct `/dapur/{username}` cannot bypass entitlement.

### Premium without Creator
- [ ] CTA is `Mulai Membuat Dapur`.
- [ ] Backend provisions draft exactly once.
- [ ] Redirect to `/dapur/{username}` succeeds.
- [ ] Refresh does not create duplicate Creator.

### Premium with Creator
- [ ] CTA is `Kelola Dapur Kamu` / current canonical copy.
- [ ] Opens the owned workspace.
- [ ] Workspace is usable on mobile and desktop.

## F. Creator Workspace E2E
- [ ] Foyer save works.
- [ ] Menu save works.
- [ ] Hidangan save works.
- [ ] Ambalan save works.
- [ ] Username change with valid value works.
- [ ] Duplicate username is rejected.
- [ ] No `permission denied for function validate_creator_username`.
- [ ] Public URL follows updated username.
- [ ] `Salin` copies canonical `/{username}` URL.
- [ ] `Bagikan` uses supported share behavior.
- [ ] Owner cannot edit another Creator.
- [ ] Logout blocks workspace access.

## G. Admin
- [ ] `/admin` loads.
- [ ] Admin auth modal works.
- [ ] Admin autocomplete warnings are absent.
- [ ] Admin Creator controls still work.
- [ ] No public user can reach admin authority.

## H. Runtime / Network
- [ ] Vercel Production deployment is `READY`.
- [ ] Deployment SHA equals final functional source SHA.
- [ ] `/dapur` HTTP 200.
- [ ] `/dapur/{username}` HTTP 200.
- [ ] No Dapur runtime errors in Vercel logs.
- [ ] No unexpected legacy Dapur asset requests.
- [ ] No `Uncaught TypeError`, `permission denied`, `Failed to fetch`, 401, 403, 404, 500 on tested flows.

## I. Performance / Accessibility
- [ ] No unnecessary polling.
- [ ] Long timer violations are profiled before modification.
- [ ] Inputs are readable and ≥16px on mobile where applicable.
- [ ] Keyboard focus works.
- [ ] ESC/backdrop closes auth modal where expected.
- [ ] `prefers-reduced-motion` respected.
- [ ] No horizontal overflow on ~375px viewport.

## J. Documentation Alignment
- [ ] MASTER_HANDOFF_PROMPT status matches actual state.
- [ ] PROJECT_CONSTITUTION Art XV baseline matches actual production.
- [ ] PROJECT_STATE_LATEST reflects current file inventory.
- [ ] All 3 docs cite the same Production SHA.
- [ ] No stale claims (e.g., "✅ verified" for items that require browser verification).

## K. Release Decision

### PASS criteria
All critical sections A–J pass. Section I may contain non-blocking warnings only if documented and outside the current release scope.

### DO NOT RELEASE when
- Production SHA is not verified and consistent across all docs.
- Homepage hero differs from locked visual contract (browser-verified).
- Auth accessibility warning remains on tested production modal (browser-verified).
- Creator authorization/ownership is not proven (browser E2E).
- Public Creator read requests return unauthorized errors.
- Any canonical Dapur legacy runtime is still active.
- RC15/RC16 internal contradiction exists.
- Migrations 10–12 not run.
- Security headers incomplete.
- Documentation contains unverifiable claims.

### Status values
- `AUDIT OPEN` — audit findings not yet resolved
- `FIX IN PROGRESS` — fixes being applied
- `READY FOR E2E` — code ready, awaiting browser verification
- `READY FOR MIGRATION` — code ready, migrations pending
- `SIAP RILIS` — all gates passed, browser-verified

`SIAP RILIS` is allowed **only** after actual browser verification, not source inspection alone.
