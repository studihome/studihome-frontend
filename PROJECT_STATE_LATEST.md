# STUDIHOME — PROJECT STATE LATEST

Snapshot: 6 September 2026  
Status: **AUDIT OPEN — STRICT RELEASE GATES NOT YET PASSED**

## Current baseline
- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Latest main observed while preparing this state: `4cae3c144ae5583868478bea7ba3fca0cf254d7a`
- Frontend: static HTML/CSS/Vanilla JS
- Backend/Auth: Supabase
- Hosting: Vercel
- Canonical Dapur: `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `supabase-config.js`

IMPORTANT: Always refresh main before work. This SHA is historical immediately after newer commits land.

## P0
1. Main branch governance
   - protected=false at last audit
   - active rulesets=none at last audit
2. Push rollout incomplete
   - frontend push code exists
   - live DB lacked push_subscriptions / push_notification_log / trigger_push_notification
   - live Edge Functions did not include send-push-notification
3. M46 unsafe as-is
   - requires schema qualification, ACL hardening, correct RETURNING, validation, rollback
4. Supabase Security Advisor
   - leaked-password protection disabled
   - multiple SECURITY DEFINER executable findings requiring classification
5. CI/release gates insufficient
   - existing workflow mainly syntax-level
   - not enough for auth/RLS/PWA/SEO/checkout/regression assurance
6. GitHub/Supabase deployment drift
   - live Edge Function set not fully represented by current repo

## P1
- restore/verify global HTTP security headers
- CSP hardening plan
- service worker version/cache hardening
- exact-version Supabase SDK strategy
- runtime duplication cleanup via evidence-first consolidation
- server/pre-render metadata for high-value public entity routes
- push permission UX should be explicit/contextual

## Confirmed positive baseline
- frontend uses publishable Supabase key, not service_role credential
- dynamic SEO updater handles canonical/meta/OG/Twitter/JSON-LD for many SPA routes
- robots/sitemap/llms/Markdown/OpenAPI/IndexNow surfaces exist
- previous M37–M42 security/integrity work remains documented but must be revalidated against live DB when relevant

## No-regression boundary
Do not:
- fabricate social proof
- expose PII/secrets
- redesign unrelated UI
- force-push/reset history
- blindly merge
- apply SQL without live audit/rollback
- use RLS to solve presentation bugs
- change checkout/payment/Auth/Dapur without scoped tests

## Required next engineering order
1. Protect main + required checks
2. Freeze/feature-gate incomplete push behavior
3. Rewrite M46 safely
4. Reconcile Edge Function source/live state
5. Enable leaked-password protection
6. Complete SECURITY DEFINER matrix
7. Expand CI/E2E
8. Restore/verify security headers
9. Harden SW/cache and push UX
10. SEO/GEO and performance optimization after security/release correctness

See:
- `FREEBUFF_SKILL_STUDIHOME.md`
- `FREEBUFF_INITIAL_COMMAND.md`
- `MASTER_HANDOFF_PROMPT_STUDIHOME.md`
- `PROJECT_CONSTITUTION.md`
