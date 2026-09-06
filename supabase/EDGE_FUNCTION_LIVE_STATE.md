# Supabase Edge Function Source/Live Reconciliation

Snapshot: 6 September 2026  
Project: `hbfmhwwxbgidsnljupca`

This document is a reconciliation snapshot, not a deployment manifest. Always refresh live state before deploying or retiring a function.

| Live slug | Live version | verify_jwt | Repository source | Status / action |
|---|---:|---:|---|---|
| `send-email-verification` | 5 | false | `supabase/functions/send-email-verification/index.ts` | TRACKED + LIVE/REPO EXACT. SDK pinned `2.115.0`. Caller verified in `index.html`. Custom Bearer/user verification exists; do not flip JWT mode blindly. |
| `provision_managed_creators` | 2 | true | `supabase/functions/provision_managed_creators/` | TRACKED + LIVE/REPO EXACT. SDK pinned `2.115.0`. Admin role/status check exists. No browser caller was found in the 6 Sep repository audit; do not infer unused from that alone. |
| `smooth-action` | 2 | true | none | LEGACY/QUARANTINED. Older email-verification implementation with broader/older behavior and unpinned SDK. No repo runtime caller found in 6 Sep audit. CI blocks new runtime references. Do not delete until invocation evidence confirms unused. |
| `swift-endpoint` | 1 | true | none | LEGACY/QUARANTINED. Live source payload returned an empty entrypoint file in 6 Sep audit. No repo runtime caller found. CI blocks new runtime references. Do not delete until invocation evidence confirms unused. |
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

## Latest deployment verification

Production redeploy after dependency pin:

- repository main: `2f42dca7b5411f907131232e3fad5667148dd9e0`
- Vercel production status for that SHA: SUCCESS
- `send-email-verification`: live v5, `verify_jwt=false`, live source exactly matches repository source
- `provision_managed_creators`: live v2, `verify_jwt=true`, live `index.ts` and `deno.json` exactly match repository source
- `send-push-notification`: still not present in the live function list
- Security/Performance Advisor counts unchanged after Edge deployment
- direct HTTP POST smoke: **NOT VERIFIED** because the available connector has no Edge invoke/log action and the local shell environment cannot resolve the Supabase host; do not report this as PASS

## Current P0 follow-up

- Obtain invocation evidence for `smooth-action` and `swift-endpoint`.
- Retire only after confirmed unused and a rollback/recovery path exists.
- Keep push rollout disabled until DB migration, sender implementation, and real-device tests pass.
