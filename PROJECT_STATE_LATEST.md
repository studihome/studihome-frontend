# STUDIHOME — PROJECT STATE LATEST

Tanggal snapshot: 20 Agustus 2026

## Production / Source
- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Frontend: static HTML/CSS/Vanilla JS
- Hosting: Vercel
- Database/Auth: Supabase
- Backend authority: Supabase Auth + RLS/functions
- Latest audited source commit: `7d0bfdf9a27880a1f5a12316cec022b5013ec389`
- Latest verified syntax hotfix: `36479c28600d350361e606ceb53bf30cbb2bcd49`

## Current verified finding — Admin console syntax
The reported `admin:4171 Uncaught SyntaxError: Unexpected token '}'` was traced to three malformed return-object closures inside the large inline `index.html` runtime. The malformed closures used `},` where the returned object required `};` before the enclosing function/property separator.

Verified fixes were applied only to the three affected return-object closures:
1. `smartQualityEngine._qualityProfile()`
2. `smartQualityEngine.apply()`
3. `smartEngine.analyze()`

No surrounding business logic, DOM structure, routing, data model, or styling was intentionally changed by this hotfix.

## Syntax verification
- The repair was performed by a scoped GitHub Actions hotfix runner.
- The runner was self-removed after the repair, so no permanent hotfix automation was left in the repository.
- The repaired source was independently syntax-checked against the latest uploaded HTML source with Node.js: 20 executable inline JavaScript blocks passed after the three verified corrections.
- JSON-LD was excluded from JavaScript syntax validation because it is structured data, not executable JavaScript.

## Security baseline
- Supabase/RLS is authority.
- Anonymous public-read policies are separated from authenticated-only authorization functions.
- Anonymous write to Creator data is closed.
- Authorization-only functions must not be executable by `anon`.
- No service-role key in frontend.
- Do not trust DOM/querystring/role text for authorization.

## Live Supabase audit — 20 Aug 2026
Project: `studihome` (`hbfmhwwxbgidsnljupca`), status `ACTIVE_HEALTHY`.

### Security advisor findings requiring follow-up
- `email_verification_tokens`: RLS enabled without policies.
- Multiple `SECURITY DEFINER` RPCs remain executable by `anon` or `authenticated`, including email-token consumption and Creator metrics/public summary functions, plus several Admin/member authorization/mutation functions.
- Leaked-password protection is disabled in Supabase Auth.

These are database-level findings and must be remediated with explicit SQL/RLS/grant review. Do not solve them by weakening frontend checks.

### Performance advisor findings requiring follow-up
- Several foreign keys lack covering indexes.
- Multiple RLS policies repeatedly evaluate `auth.*()` and should use `(select auth.*())` where appropriate.
- Multiple permissive policies exist on several tables and should be consolidated only after policy semantics are proven equivalent.
- Several duplicate indexes exist and should be reduced only after query/index usage review.
- Several indexes are currently unused; do not drop them blindly because some may support future or low-volume paths.

## Production CSS baseline
- Tailwind CDN removed from `index.html`.
- `index.html` loads `/tailwind-compiled.css?v=20260817r2`.
- Compiled CSS must not alter locked homepage visual contract.

## Canonical Dapur
- `/dapur` → `/dapur.html`
- `/dapur/{username}` → `/dapur.html`
- `/{username}` → public Creator profile via `/index.html`
- Canonical runtime: `dapur.html → dapur-entry.js → dapur-editor.js` (lazy)
- No canonical Dapur MutationObserver, second-stage decorator, access-gate/injector, or section routes.

## Verified closed items
- Vercel invalid inline-regex rewrite issue.
- Dapur canonical runtime consolidation.
- Dapur legacy runtime cleanup.
- Public Creator RLS 401 issue for the audited Creator read path.
- Anonymous Creator write hardening.
- Authorization function grant hardening where previously verified.
- Tailwind CDN warning source removed.
- Admin inline JavaScript syntax regression identified and corrected.

## Open release gates
### 1. Homepage hero visual parity
Restore/verify exactly against the agreed baseline. Do not redesign locked areas without an explicit request.

### 2. Authenticated browser E2E
Required with real sessions:
- public popup auth;
- Premium no Creator → create Dapur;
- Premium existing Creator → manage Dapur;
- username update + duplicate rejection;
- ownership isolation;
- logout → workspace denial.

### 3. Visual parity
Compare homepage/member/admin desktop + mobile against the agreed UI contract after every scoped visual change.

### 4. Studio AI runtime
Verify Hero search, Enter-key submission, Creator result rendering, smooth result scroll, and live Creator/visitor activity in a real browser.

### 5. Supabase security remediation
Review the current advisor findings before release. In particular, audit `SECURITY DEFINER` execution grants and the RLS-less `email_verification_tokens` table.

### 6. Performance remediation
Prioritize RLS init-plan warnings, duplicate indexes, and missing FK indexes only after query/policy semantics are verified.

## Release rule
Do not label the project `SIAP RILIS` solely because Vercel is `READY`. Release requires the applicable security gates, functional checks, production deployment verification, and browser/console verification.
