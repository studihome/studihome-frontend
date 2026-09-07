# STUDIHOME — VERCEL MANUAL DEPLOY PLAYBOOK

Updated: 7 September 2026, Asia/Jakarta

## Purpose

Use this only when the normal Git-triggered Vercel deployment is unavailable or missed. Manual deployment must preserve the same source-of-truth and verification discipline as the normal release flow.

## Current release evidence

Repository: `studihome/studihome-frontend`

Production branch: `main`

Current source main at the start of this recovery:

`db7c47adc4c365d32b7a79bdc4cdb8c6ba811baa`

Last production-verified deployed runtime:

`2809811790ab12511886355f8a0cc42717a82745`

Current source status:
- PR #102 merged into `db7c47a...`;
- main Release Gate #672: PASS;
- Vercel Production for `db7c47a...`: BLOCKED / `build-rate-limit`;
- Production Smoke #17 / `34092938276`: FAIL because 36/36 alias checks still returned `2809811...`.

Do not deploy a stale historical SHA merely because it appears earlier in this file. The approved deployment target is always the exact current protected `main` SHA at the time recovery is performed. If a docs-only recovery PR is merged, use that resulting merge SHA, because it contains the same application runtime plus the recovery documentation commit.

## Preferred manual method — Vercel Dashboard by Git SHA

1. Open Vercel Dashboard.
2. Open project `studihome-frontend`.
3. Open **Deployments**.
4. Use the deployment-header menu (**...**) and choose **Create Deployment**.
5. Choose targeted deployment / Git reference and enter the **exact current protected `main` SHA**. Confirm it from GitHub immediately before deployment; do not reuse an older SHA copied from historical notes.
6. If Vercel asks which branch configuration to use, choose **main** so Production-scoped branch/environment configuration is used.
7. Start the deployment.
8. Do not retry repeatedly if Vercel returns `api-deployments-free-per-day` / `build-rate-limit`; classify as **BLOCKED**.
9. When the deployment is **Ready**, inspect the deployment details and confirm the Git commit is the expected SHA.
10. If the deployment is staged/Preview rather than assigned to the production domain, use its deployment menu and choose **Promote to Production** only after the source SHA is confirmed.
11. Verify `https://studihome.id/api/version` reports the exact SHA you just deployed and `environment = production`.
12. Run/observe the production smoke workflow against the same SHA.
13. Call production **PASS** only when SHA reconciliation and production smoke both pass.

## Why not upload a ZIP manually?

Studihome production verification relies on Vercel Git metadata, especially the deployment Git commit SHA exposed through `/api/version`. A source upload that is detached from the Git commit can remove or weaken that provenance. Prefer a Git SHA deployment from the connected repository.

## Manual deploy does not bypass Hobby quota

Creating a manual deployment still creates a Vercel deployment. If the account is blocked by the Hobby deployment/day limit, manual deployment can fail with the same rate-limit. Wait for the quota window to reset or change the account plan; do not spam retries.

## Safety checks before promotion

- expected Git SHA exactly matches current approved `main`;
- deployment status is **Ready**;
- no build/runtime error in Vercel logs;
- Production environment configuration is selected;
- `/api/version` matches expected SHA after promotion;
- security headers remain present;
- sitemap has unique URLs;
- private routes remain noindex;
- Agent Search and Markdown smoke remain healthy;
- unauthenticated boundaries of active Edge Functions remain correct.

## Rollback

If the new production deployment fails verification:
1. classify production as **FAIL** or **NOT VERIFIED**;
2. use Vercel deployment history to promote the last known deployable production deployment;
3. do not alter database/RLS merely to make the frontend deployment pass;
4. record the observed deployment SHA and failing smoke assertion;
5. fix through branch -> PR -> release-gate -> Preview before another production attempt.

## Current blocker — 7 September 2026

Current source main at recovery start:
`db7c47adc4c365d32b7a79bdc4cdb8c6ba811baa`

Observed blocker:
- Vercel production Git-triggered deployment returned `build-rate-limit`;
- Production Smoke #17 checked the alias 36 times and always received `2809811790ab12511886355f8a0cc42717a82745`;
- therefore source `db7c47a...` is **NOT PRODUCTION VERIFIED**.

Recovery discipline:
1. first use a docs-only protected PR as a low-risk capacity probe/retrigger;
2. require exact-head Release Gate PASS + Vercel Preview SUCCESS before merge;
3. after merge, require Vercel Production SUCCESS;
4. require `/api/version` to match the resulting merge SHA;
5. require Production Smoke PASS;
6. if quota remains blocked, do not spam retries and do not merge additional runtime changes.

The last production-verified deployed runtime remains `2809811790ab12511886355f8a0cc42717a82745` until all recovery checks pass.
