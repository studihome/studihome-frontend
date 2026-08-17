# STUDIHOME — RELEASE CHECKLIST

## A. Source / Config
- [ ] `main` SHA identified.
- [ ] `vercel.json` parses and contains only canonical Dapur rewrites.
- [ ] No invalid inline regex in Vercel rewrite sources.
- [ ] No legacy Dapur injector/gate is referenced by canonical shell.
- [ ] `dapur.html` loads canonical runtime only.
- [ ] No global `MutationObserver` in canonical Dapur runtime.
- [ ] No second-stage Dapur decorator.
- [ ] No Tailwind CDN.
- [ ] `/tailwind-compiled.css` exists and is loaded.

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

## J. Release Decision
### PASS criteria
All critical sections A–H pass. I may contain non-blocking warnings only if documented and outside the current release scope.

### DO NOT RELEASE when
- Homepage hero differs from locked visual contract.
- Auth accessibility warning remains on tested production modal.
- Production SHA is not the final functional SHA.
- Creator authorization/ownership is not proven.
- Public Creator read requests return unauthorized errors.
- Any canonical Dapur legacy runtime is still active.

Final status values:
- `AUDIT OPEN`
- `FIX IN PROGRESS`
- `READY FOR E2E`
- `SIAP RILIS`

`SIAP RILIS` is allowed only after actual verification, not source inspection alone.
