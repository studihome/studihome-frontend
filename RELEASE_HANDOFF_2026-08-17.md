# STUDIHOME — RELEASE HANDOFF

Tanggal asli: 17 Agustus 2026  
Tanggal pembaruan: 26 Agustus 2026  
Repository: `studihome/studihome-frontend`  
Branch: `main`  
Hosting: Vercel  
Auth/Database: Supabase  
Frontend: static HTML + CSS + Vanilla JS

## ⚠ CATATAN RECONCILIASI (26 Agustus 2026)

Handoff asli 17 Agustus berisi beberapa klaim yang tidak terverifikasi sumbernya. Dokumen ini sekarang merupakan versi reconciled yang memperbaiki inkonsistensi. Lihat `PROJECT_STATE_LATEST.md` untuk status source truth terkini.

Klaim yang diperbarui:
- Production SHA → **VERIFIED `f9c6d51`** (Vercel dashboard, 26 Aug 2026)
- Security headers → **HSTS dan X-Content-Type-Options ditambahkan** (sebelumnya missing)
- RC15/RC16 → **KONTRADIKSI DIPERBAIKI** (RC15 diupdate ke PASS)
- CSS version → **?v=20260825r3** (bukan ?v=20260817r2)
- Migrations → **12 total** (9 complete + 3 pending, bukan 9/9)

---

## 1. RELEASE OBJECTIVE
Menjaga Studihome tetap fungsional, aman, minimalis-profesional, responsive, dan mudah digunakan dengan risiko regresi seminimal mungkin.

Prioritas tetap:
1. Security & data integrity
2. Functional correctness
3. Routing/runtime stability
4. Accessibility
5. Performance
6. Maintainability
7. Visual polish
8. Animation

## 2. CANONICAL DAPUR
Route canonical:
- `/dapur` → `dapur.html`
- `/dapur/:username` → `dapur.html`
- `/:username` → public Creator profile melalui `index.html`

Runtime canonical:
- `dapur.html` = minimal shell
- `dapur-entry.js` = satu renderer + auth/route/UX orchestration
- `dapur-editor.js` = lazy standalone editor
- `supabase-config.js` = Supabase singleton

Dilarang mengembalikan:
- global `MutationObserver` pada Dapur runtime;
- second-stage DOM decorator;
- legacy Dapur script injector;
- renderer kedua;
- route section `/dapur/foyer`, `/dapur/menu`, `/dapur/hidangan`, `/dapur/ambalan`.

## 3. DAPUR ACCESS CONTRACT
Publik:
- dapat melihat landing Dapur;
- CTA `Masuk / Daftar` membuka auth canonical;
- tidak mendapatkan workspace tanpa authorization backend.

Member Premium tanpa Creator:
- CTA `Mulai Membuat Dapur`;
- provisioning harus server-authoritative;
- hasil canonical `/dapur/{username}`.

Member Premium dengan Creator:
- CTA kelola Creator → `/dapur/{username}`.

Member non-Premium:
- workspace tetap terkunci;
- tidak boleh bypass dengan URL manual.

Owner Creator:
- hanya dapat mengelola Creator miliknya.

Admin:
- dapat mengelola Creator sesuai authority backend.

## 4. PUBLIC CREATOR
Public Creator URL tetap:
`https://studihome.id/{username}`

Workspace Creator tetap:
`https://studihome.id/dapur/{username}`

Foyer/Menu/Hidangan/Ambalan adalah section editor, bukan route.

## 5. HOMEPAGE VISUAL LOCK
Homepage hero **tidak didesain ulang**.

Hero lock menggunakan gradient brand Studihome dan tidak mengubah struktur/copy/layout hero.

**Status (26 Aug):** Gate A **OPEN** — hero visual parity requires browser verification.

## 6. PRODUCTION CSS / ACCESSIBILITY
Tailwind CDN sudah tidak digunakan pada `index.html`.

Current production source:
`/tailwind-compiled.css?v=20260825r3`

**⚠ Known issue:** Compiled CSS uses Tailwind v3.4.17 WITH Preflight. Constitution Art IV states "tanpa Preflight". This is a contract violation that needs resolution.

Auth form accessibility:
- `#login-email` → `autocomplete="username"`
- `#login-password` → `autocomplete="current-password"`
- `#reg-name` → `autocomplete="name"`
- `#reg-email` → `autocomplete="email"`
- `#reg-phone` → `autocomplete="tel"`
- `#reg-password` → `autocomplete="new-password"`

**Status (26 Aug):** Gate B **OPEN** — browser verification required (Constitution says OPEN, old Handoff said CLOSED).

## 7. SECURITY HEADERS (UPDATED 26 Aug)
`vercel.json` sekarang mengandung:
- `X-Frame-Options: SAMEORIGIN` ✅
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` ✅ (added 26 Aug)
- `X-Content-Type-Options: nosniff` ✅ (added 26 Aug)
- CSP meta tag di `index.html` ✅
- Dead reference `/dapur-button.js` removed ✅ (26 Aug)

## 8. BACKEND SECURITY STATE
Public-read Creator data dipisahkan dari authorization-only functions.

Anonymous role tidak digunakan untuk authorization function sensitif seperti:
- `is_admin()`
- `has_creator_workspace_access()`
- `has_premium_creator_access()`
- `is_creator_eligible()`
- `can_publish_creator()`

`validate_creator_username(text)` memakai hardened `search_path`.

**Status (26 Aug):** RC15/RC16 contradiction **RESOLVED** — RC15 updated to PASS, aligned with RC16 owner evidence. Fresh live verification recommended.

### Pending Database Migrations (HARDENED — 26 Aug 2026)
- **Migration 10** — `validate_creator_publish()` trigger fix ✅ **HARDENED** (search_path, REVOKE, idempotent, verification, rollback)
- **Migration 11** — `contact_email DROP NOT NULL` ✅ **HARDENED** (Constitution alignment, CHECK verification, rollback)
- **Migration 12** — `hero_promo_modules JSONB` ✅ **HARDENED** (RLS pre-check, policy verification, rollback)
- **Status:** Files in repo, all 3 hardened, **NOT yet run to production**
- **Execution order:** M10 → M11 → M12 via Supabase SQL Editor

## 9. ROUTING CONTRACT
`vercel.json` wajib tetap memakai rewrite canonical sederhana:
- `/dapur` → `/dapur.html`
- `/dapur/:username` → `/dapur.html`
- `/:username/portfolio/:slug*` → `/index.html`
- `/:username` → `/index.html`

Jangan memakai inline regex parameter di `rewrites.source`.

## 10. CURRENT PRODUCTION VERIFICATION (26 Aug 2026)
**Production SHA: `f9c6d51`** ✅ VERIFIED via Vercel dashboard (Status: Ready, Environment: Production).

Local HEAD matches production SHA. Remaining verifications:
- HTTP route checks (requires browser)
- Runtime log check
- Browser console check

## 11. RELEASE VERIFICATION LIMITATION
HTTP/deployment/runtime checks perlu diverifikasi ulang.

Browser evidence dari user sebelumnya:
- public console sudah bersih;
- member/admin warning sebelumnya berasal dari autocomplete.

Authenticated browser E2E penuh tetap harus diperlakukan sebagai manual smoke test final.

## 12. DO NOT REGRESS
Jangan:
- mengubah `/dapur` menjadi admin dashboard;
- mengubah public Creator URL `/{username}` menjadi `/dapur/{username}`;
- membuat route section Dapur;
- menambah renderer/decorator/observer baru;
- memasukkan service-role key ke frontend;
- mengubah payment/order logic tanpa audit khusus;
- menyatakan release verified tanpa cocokkan commit SHA dan deployment SHA.

## 13. NEXT CHAT PROTOCOL
Jika percakapan terputus, baca file berikut terlebih dahulu:
1. `MASTER_HANDOFF_PROMPT_STUDIHOME.md`
2. `PROJECT_CONSTITUTION.md`
3. `PROJECT_STATE_LATEST.md`

Kemudian:
1. audit `main` HEAD;
2. cocokkan Production deployment SHA;
3. baca `index.html`, `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `vercel.json`;
4. cari references sebelum menghapus file;
5. jangan reset proyek;
6. perubahan kecil, canonical, dan reversible;
7. deploy;
8. verify production;
9. baru laporkan status.

## 14. RELEASE STATUS (26 Aug 2026)

```
STATUS: AUDIT OPEN — Production SHA Verified
```

- Source final: **RECONCILED** (docs aligned 26 Aug)
- Production deployment: **VERIFIED `f9c6d51`** (Vercel dashboard, 26 Aug 2026)
- Runtime errors: **UNKNOWN** (requires fresh verification)
- UI/UX contract: **GATE A OPEN** (hero parity needs browser check)
- Homepage hero: **GATE A OPEN**
- Auth accessibility: **GATE B OPEN**
- Security headers: **COMPLETE** ✅ (added 26 Aug)
- RC15/RC16 contradiction: **RESOLVED** ✅ (26 Aug)
- Migrations 10-12: **READY TO RUN** (all 3 hardened 26 Aug, not yet run to production)
- Tailwind CDN: **REMOVED** ✅
- Documentation: **RECONCILED** ✅ (26 Aug)

**Jangan meng-upgrade status menjadi `SIAP RILIS` sebelum:**
1. ~~Production SHA terverifikasi via Vercel dashboard~~ ✅ DONE (26 Aug — `f9c6d51`)
2. Migrations 10-12 di-run ke production
3. Browser E2E untuk Gate A, B, C, D selesai
4. ~~Semua 3 dokumen cite SHA yang sama~~ ✅ DONE (26 Aug — all docs cite `f9c6d51`)
