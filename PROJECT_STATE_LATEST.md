# STUDIHOME — PROJECT STATE LATEST

Tanggal snapshot: 17 Agustus 2026

## Production
- Repository: `studihome/studihome-frontend`
- Branch: `main`
- Latest known Production deployment: `dpl_Bnfo4zFye4XkPoHtkDKRTzw8xszU`
- Production state: `READY`
- Production commit: `19a9ff7385cfb312521fd0d1b9a4dd634c333ece`
- Deployment message: `fix: remove Tailwind CDN warning and harden auth autocomplete`

## Canonical Dapur
- `/dapur` → `/dapur.html`
- `/dapur/{username}` → `/dapur.html`
- `/{username}` → public Creator profile via `/index.html`
- Canonical runtime: `dapur.html → dapur-entry.js → dapur-editor.js` (lazy)
- No canonical Dapur `MutationObserver`
- No second-stage Dapur decorator
- No Dapur access-gate/injector
- No Dapur section routes

## Security baseline
- Supabase/RLS is authority.
- Anonymous public-read policies are separated from authenticated-only authorization functions.
- Anonymous write to Creator data is closed.
- Authorization-only functions are not executable by `anon`.
- `validate_creator_username` has safe `search_path` and authenticated-only execution.
- No service-role key in frontend.

## Production CSS baseline
- Tailwind CDN removed from `index.html`.
- `index.html` loads `/tailwind-compiled.css?v=20260817r1`.
- Compiled CSS must not alter locked homepage visual contract.

## Verified closed items
- Vercel invalid inline-regex rewrite issue.
- Dapur canonical runtime consolidation.
- Dapur legacy runtime cleanup.
- Public Creator RLS 401 issue for the audited Creator read path.
- Anonymous Creator write hardening.
- Authorization function grant hardening.
- Tailwind CDN warning source removed.

## Open release gates
### 1. Homepage hero visual parity
User reports homepage hero changed. Restore exactly to agreed baseline. Do not redesign. Historical baseline: `7406c1fdb8e614e0e3907f2c082bf94811a4beef`.

### 2. Login email autocomplete
Latest member console still reported:
`[DOM] Input elements should have autocomplete attributes (suggested: "username")`
Target: `#login-email` → `autocomplete="username"`.

### 3. Authenticated browser E2E
Required with real sessions:
- public popup auth;
- Premium no Creator → create Dapur;
- Premium existing Creator → manage Dapur;
- username update + duplicate rejection;
- ownership isolation;
- logout → workspace denial.

### 4. Visual parity after compiled CSS
After hero restoration, compare homepage/member/admin desktop + mobile against agreed UI contract.

### 5. Performance
If long timer violations reappear, profile exact callbacks before changing polling/timers.

## Important release rule
Do not label the project `SIAP RILIS` solely because Vercel is `READY`. Release requires the gates above plus browser/console verification.
