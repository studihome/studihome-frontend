# Supabase Edge Function Source/Live Reconciliation

Snapshot: 6 September 2026  
Project: `hbfmhwwxbgidsnljupca`

This document is a reconciliation snapshot, not a deployment manifest. Always refresh live state before deploying or retiring a function.

| Live slug | Live version | verify_jwt | Repository source | Status / action |
|---|---:|---:|---|---|
| `send-email-verification` | 4 | false | `supabase/functions/send-email-verification/index.ts` | TRACKED. Custom Bearer/user verification exists in function; do not flip JWT mode blindly. |
| `provision_managed_creators` | 1 | true | `supabase/functions/provision_managed_creators/` | TRACKED in repository from verified live source snapshot. Admin role/status check exists. |
| `smooth-action` | 2 | true | none | LEGACY/UNMAPPED. Appears to contain older email-verification implementation. No repo caller found in 6 Sep audit. Do not delete until invocation evidence confirms unused. |
| `swift-endpoint` | 1 | true | none | LEGACY/UNMAPPED. Live source payload returned an empty entrypoint file in 6 Sep audit. No repo caller found. Do not delete until invocation evidence confirms unused. |
| `send-push-notification` | not live | n/a | `supabase/functions/send-push-notification/index.ts` | SOURCE-ONLY / NOT PRODUCTION READY. Current custom Web Push crypto must not be deployed until standards-compliant interoperability is proven. |

## Rules

1. A live production Edge Function should normally have auditable source in this repository.
2. Never delete a live function solely because repository search shows no caller. Confirm invocation/log/dependency evidence first.
3. Never deploy `send-push-notification` from its current source while the P0 rollout gate is disabled.
4. Treat secret/service credentials as backend-only. Do not commit actual secret values.
5. For authenticated functions, validate both identity and business authorization; platform JWT mode alone is not business authorization.
6. If live source differs from repository source, classify the drift before deploying either side.
7. After any Edge Function deployment, record:
   - slug
   - version
   - verify_jwt
   - repository commit SHA
   - caller
   - authorization checks
   - smoke/E2E result

## Current P0 follow-up

- Obtain invocation evidence for `smooth-action` and `swift-endpoint`.
- Retire only after confirmed unused and a rollback/recovery path exists.
- Keep push rollout disabled until DB migration, sender implementation, and real-device tests pass.
