# STUDIHOME - PROJECT STATE LATEST

Snapshot: 1 September 2026  
Status: **AUDIT OPEN - RELEASE EVIDENCE INCOMPLETE**

## Baseline

- Repository: `studihome/studihome-frontend`, branch `main`.
- Last documented main: [`06ba899`](https://github.com/studihome/studihome-frontend/commit/06ba899) (1 Sep 2026, includes Creator Like fix + CSP update).
- Vercel status for `06ba899`: auto-deployed. Production-alias SHA: NOT VERIFIED (needs Vercel dashboard confirmation).
- Frontend: static HTML/CSS/Vanilla JS. Database/Auth: Supabase. Hosting: Vercel.
- Canonical Dapur: `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `supabase-config.js`.
- `/balkon` and `/studio-ai` browser verification remains BLOCKED while Under Construction controls those routes.

## Verified work through M42

| Scope | Status | Live evidence |
|---|---|---|
| M37 publish trigger hardening | PASS | Trigger validation is schema-qualified and not API-executable. |
| M38 portfolio Like integrity | PASS | Adjustment actor audit, bounded delta, non-negative totals. |
| M39 stale admin policy cleanup | PASS | Legacy modules/testimonials/site-settings admin bypass policies removed. |
| M40 `site_settings` RLS | PASS | Admin policy is `TO authenticated` with `(select is_admin())`; public read retained. |
| M41 products policy cleanup | PASS | Duplicate admin policy removed; canonical admin and public-active read policies remain. |
| M42 external Creator rating gate | PASS | New external ratings start hidden; explicit admin moderation required to publish. |
| Frontend external rating review | PASS | Admin UI creates drafts and shows internal/external ratings together for moderation. |
| GitHub/Vercel latest documented frontend commit | PASS | `06ba899`, auto-deployed. |

## Social proof and privacy position

- No fabricated social proof may be inserted or displayed.
- Public social proof runtime is server-side filtered and must not expose email, phone, `user_id`, amount, or private order information.
- External Creator ratings are not equivalent to verified purchases. Their source and permission require an Admin review before visibility.
- Audit found one legacy external rating already public. It is a review backlog, not evidence of validity; do not alter it automatically.
- Admin Like adjustments are auditable but remain a P1 governance review because they affect public trust metrics.

## Security status

- PASS: RLS is enabled on exposed public tables audited so far.
- PASS: `v_social_proof_recent` uses `security_invoker=true` and has no public grant.
- PASS: audited SECURITY DEFINER functions use explicit `search_path`.
- NOT VERIFIED: complete caller/output/abuse matrix for every executable SECURITY DEFINER function.
- FAIL: Supabase Security Advisor reports leaked-password protection disabled. Enable in Supabase Auth Dashboard after review.
- NOT VERIFIED: storage and authenticated owner/admin E2E flows.

## Known performance posture

- PASS: Creator profile/social/services/portfolio/category RLS initplans optimized.
- PASS: `site_settings` admin initplan optimized in M40.
- NOT VERIFIED: `testimonials` and `modules` remaining RLS performance findings after equivalence review.
- NOT VERIFIED: foreign-key index recommendations and duplicate-index cleanup; Advisor `unused_index` is insufficient removal evidence.

## Current priorities

1. P0 - Complete SECURITY DEFINER caller/grant/output classification.
2. P0 - Authenticated owner/admin/Dapur and checkout/payment E2E, without production writes outside normal test scope.
3. P0 - Production-alias SHA reconciliation.
4. P1 - Enable leaked-password protection and review the one legacy public external rating.
5. P1 - Define governance for Like adjustments as public trust signals.
6. P2 - mobile 375px/accessibility/console verification and production SEO/GEO checks.

## No-regression boundary

Do not touch Under Construction, checkout/payment, canonical Dapur architecture, or unrelated UI while auditing. Do not reset, force-push, merge blindly, fabricate production data, or use RLS to solve UI. See `MASTER_HANDOFF_PROMPT_STUDIHOME.md` and `FREEBUFF_MASTER_PROMPT_STUDIHOME.md` for the continuation protocol.

