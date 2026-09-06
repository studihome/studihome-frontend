# STUDIHOME — VERCEL MANUAL DEPLOY PLAYBOOK

Updated: 7 September 2026, Asia/Jakarta

## Purpose

Use this only when the normal Git-triggered Vercel deployment is unavailable or missed. Manual deployment must preserve the same source-of-truth and verification discipline as the normal release flow.

## Current production source target

Repository: `studihome/studihome-frontend`

Production branch: `main`

Expected source SHA:

`49db8b39591752e6486506415bda42abb2096744`

Do **not** deploy PR #74 head or another branch as production. PR #74 is documentation-only and is not the production application source.

## Preferred manual method — Vercel Dashboard by Git SHA

1. Open Vercel Dashboard.
2. Open project `studihome-frontend`.
3. Open **Deployments**.
4. Use the deployment-header menu (**...**) and choose **Create Deployment**.
5. Choose targeted deployment / Git reference and enter the exact SHA:
   `49db8b39591752e6486506415bda42abb2096744`
6. If Vercel asks which branch configuration to use, choose **main** so Production-scoped branch/environment configuration is used.
7. Start the deployment.
8. Do not retry repeatedly if Vercel returns `api-deployments-free-per-day` / `build-rate-limit`; classify as **BLOCKED**.
9. When the deployment is **Ready**, inspect the deployment details and confirm the Git commit is the expected SHA.
10. If the deployment is staged/Preview rather than assigned to the production domain, use its deployment menu and choose **Promote to Production** only after the source SHA is confirmed.
11. Verify `https://studihome.id/api/version` reports:
    - `sha = 49db8b39591752e6486506415bda42abb2096744`
    - production environment.
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

## Current blocker

At this snapshot Vercel still reports `build-rate-limit` for the current release attempt. Manual deployment is therefore a recovery procedure for use after Vercel accepts new deployments; it is not a quota bypass.
