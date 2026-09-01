/masterprompt

# MASTER HANDOFF PROMPT — STUDIHOME

Tanggal pembaruan: 1 September 2026  
Status: **AUDIT OPEN — 72% release-verified, 28% remaining**  
Repository: `studihome/studihome-frontend`  
Branch: `main`  
Functional baseline SHA: `6bfb0bd3dbf390dea479731d1d0189d27ce5e058`  
Commits setelah baseline tersebut pada 1 September 2026 hanya memperbarui dokumen handoff/state/checklist. Agen wajib membaca current `main` secara dinamis; jangan menyalin SHA dokumentasi sebagai authority. Vercel check terakhir: **SUCCESS**; production-alias SHA masih harus dikonfirmasi dari dashboard sebelum klaim rilis.

## 1. ROLE DAN GOAL

Bertindak sebagai Staff/Principal Full-Stack Engineer, Security Engineer, Release Engineer, dan UI/UX reviewer. Lanjutkan proyek secara evidence-first sampai seluruh release gate terverifikasi. Jangan mengukur selesai dari jumlah fitur; ukur dari source → database → deployment → HTTP → browser → authenticated E2E.

Prioritas mutlak:
1. Security dan data integrity.
2. Functional correctness.
3. Routing/runtime stability.
4. Compatibility dan accessibility.
5. Performance.
6. SEO/GEO factual integrity.
7. Visual fidelity.

## 2. AUTHORITY DAN URUTAN MEMBACA

1. GitHub `main` aktual.
2. Supabase schema/policies/functions/grants aktual.
3. Vercel deployment aktual.
4. `PROJECT_CONSTITUTION.md` untuk prinsip dan kontrak yang dikunci.
5. Dokumen ini dan `PROJECT_STATE_LATEST.md` untuk snapshot terkini.
6. `RELEASE_CHECKLIST_STUDIHOME.md` untuk status gate.

Jika status bertanggal di Constitution bertentangan dengan live source/schema, jangan mengubah prinsip Constitution; catat bagian status itu sebagai stale dan gunakan live evidence.

## 3. FIRST-RUN PROTOCOL UNTUK AGEN BARU

Sebelum menulis kode:
1. Verifikasi SHA `main` dan status deployment Vercel.
2. Baca seluruh Constitution, Handoff, State, dan Release Checklist.
3. Cari runtime owner serta semua caller sebelum mengubah file/object.
4. Untuk Supabase, audit `table → policy → function/RPC → grants → frontend caller`.
5. Tampilkan impact area, exact files/objects, dan regression risk.
6. Gunakan patch minimum, additive-first, reversible bila mungkin.
7. Uji syntax/config, static behavior, security, route, browser, mobile, dan edge cases yang relevan.
8. Jangan menyatakan PASS bila bukti belum ada.

## 4. ARSITEKTUR YANG DIKUNCI

- Frontend canonical: static HTML/CSS/Vanilla JS.
- Auth/data authority: Supabase Auth + RLS/functions.
- Hosting: Vercel.
- `/` = homepage.
- `/balkon` dan `/balkon/{slug}` = hub/detail artikel.
- `/studio-ai` = discovery Creator.
- `/{username}` dan `/{username}/portfolio/{slug}` = public Creator/Ambalan.
- `/dapur` dan `/dapur/{username}` = canonical Dapur editor via `dapur.html`.
- `/foyer` memakai internal route state `products`; jangan mengganti internal key menjadi `foyer`.
- Canonical Dapur owner: `dapur.html`, `dapur-entry.js`, `dapur-editor.js`, `supabase-config.js`, `vercel.json`.

Jangan:
- reset project, force-push, merge sembarangan, atau redesign architecture;
- mengubah checkout/payment tanpa audit khusus;
- mengubah RLS untuk memperbaiki UI;
- menyentuh Under Construction tanpa instruksi eksplisit;
- membuat customer, purchase, testimonial, rating, atau social proof fabricated;
- mengekspos service-role key atau private order/customer data;
- menghidupkan legacy Dapur runtime/renderer/decorator;
- mengganti seluruh `document.body` pada SPA transition.

## 5. PROGRESS SCORE

Skor ini adalah estimasi engineering berbobot, bukan angka otomatis:

| Area | Bobot | Terverifikasi |
|---|---:|---:|
| Source, deployment, routing foundation | 15 | 14 |
| Supabase security dan data integrity | 25 | 19 |
| Functional product surfaces | 20 | 18 |
| SEO/GEO infrastructure | 15 | 12 |
| Browser, accessibility, authenticated E2E, release evidence | 25 | 9 |
| **Total** | **100** | **72** |

Interpretasi: implementasi fitur diperkirakan sekitar 84%, tetapi readiness yang benar-benar release-verified baru 72%. Sisa 28% terutama audit security dan browser E2E, bukan pembangunan ulang fitur.

## 6. CONFIRMED CURRENT BASELINE

- Functional source baseline SHA: `6bfb0bd3dbf390dea479731d1d0189d27ce5e058`; current main harus diverifikasi saat agen mulai.
- Vercel status check terakhir: SUCCESS.
- `/dapur` merender `Dapur Creator Studihome` pada browser production.
- `/balkon` dan `/studio-ai` saat ini diarahkan ke halaman upgrade oleh Under Construction gate; verification keduanya **BLOCKED**, bukan FAIL.
- `vercel.json` memiliki urutan rewrite: sitemap → markdown → Dapur → SPA fallback.
- `index.html` memakai `/tailwind-compiled.css?v=20260825r6`; referensi `r3` di dokumen 26 Agustus adalah stale.
- Supabase migration history mencakup hardening sampai `optimize_creator_content_rls_initplans`.
- Target schema M10–M12 sudah ada live: `validate_creator_publish()` safe `search_path`, `creator_profiles.contact_email` nullable, `site_settings.hero_promo_modules` JSONB. Jangan menjalankan ulang migration lama hanya berdasarkan dokumen stale.
- Seluruh SECURITY DEFINER live yang diaudit memiliki `search_path` eksplisit (`""` atau `pg_catalog`). Grant/caller audit masih terbuka.
- `ai_links` telah dipensiunkan dari frontend/admin/database melalui migration live.
- IndexNow telah diberi auth, ownership validation, rate limit, canonical URL validation, dan timeout.
- Sitemap memiliki upstream timeout dan cache/fallback.
- RLS initplan Creator Profile, social graph, services, portfolios, dan categories sudah dioptimalkan melalui migrations 34–36.

## 7. OPEN WORK — PRIORITAS

### P0 — Release blockers

1. Audit seluruh SECURITY DEFINER yang executable oleh `anon`/`authenticated`: body, search_path, grants, caller, ownership/admin checks, output privacy, dan abuse controls.
2. Authenticated browser E2E: login/register, Premium entitlement, Dapur provisioning, owner isolation, username change, logout denial, admin authority.
3. Checkout/payment regression E2E read-only terhadap flow existing; jangan mengubah logic dalam audit.
4. Konfirmasi Vercel production-alias SHA sama dengan final `main` sebelum release claim.

### P1 — Security/correctness

1. Supabase Auth leaked-password protection dilaporkan disabled oleh Security Advisor; aktifkan dari dashboard setelah impact review.
2. Audit public RPC intentional: token consumption, trust summaries, social proof, AI-search logging, smart-demand logging.
3. Selesaikan sisa RLS initplan pada `site_settings`, `testimonials`, dan `modules` hanya setelah equivalence tests.
4. Audit foreign-key indexes tersisa dan duplicate indexes; jangan hapus index hanya karena `unused_index` belum mencatat penggunaan.
5. Audit pSEO/GEO copy agar tidak memuat klaim statistik atau rekomendasi fabricated.

### P2 — UI/SEO/accessibility

1. Browser verification desktop + mobile 375px untuk hero, Balkon, Studio AI, Creator, Dapur, Foyer, dan modal.
2. Auth autocomplete, keyboard focus, reduced motion, horizontal overflow, console/network errors.
3. Putuskan kontrak Tailwind Preflight dan sinkronkan versioned CSS secara eksplisit.
4. Verifikasi `sitemap.xml`, `llms.txt`, `openapi.yaml`, Markdown routes, canonical, metadata, dan JSON-LD dari jaringan produksi.

### P3 — Operability

1. Review Advisor performance setelah traffic representatif.
2. Dokumentasikan monitoring, rollback, dan incident response minimum.
3. Bersihkan file hanya setelah reference proof, runtime owner proof, replacement proof, dan rollback path lulus.

## 8. SECURITY DEFINER RAMBU-RAMBU

Jangan otomatis mencabut semua EXECUTE. Klasifikasikan tiap function:
- internal trigger only → tidak boleh callable dari API roles;
- authenticated user action → wajib self/ownership/entitlement check;
- admin action → wajib server-side `is_admin()` dan audit input;
- intentional public read → output allowlist, limit/cap, tidak ada PII;
- intentional public write/signal → input cap, rate/abuse controls, tidak mengembalikan private data.

Untuk setiap temuan tampilkan: exploitable/intentional, evidence, caller, blast radius, minimal fix, dan regression test.

## 9. DEFINITION OF DONE

Status hanya boleh PASS / FAIL / BLOCKED / NOT VERIFIED. `SIAP RILIS` dilarang sampai:
- source SHA = production SHA;
- build/deployment READY;
- route utama dan canonical assets verified;
- console/network bersih pada flow yang diuji;
- Auth/RLS/owner/admin/checkout/Dapur/Social Proof verified;
- desktop/mobile/accessibility gates verified;
- dokumen sesuai live evidence.

## 10. HANDOFF COMMAND UNTUK AGEN BERIKUTNYA

Salin prompt berikut:

> `/masterprompt /mission-control /verify /security /edgecase`  
> Lanjutkan `studihome/studihome-frontend` dari `main`. Baca penuh `PROJECT_CONSTITUTION.md`, `MASTER_HANDOFF_PROMPT_STUDIHOME.md`, `PROJECT_STATE_LATEST.md`, dan `RELEASE_CHECKLIST_STUDIHOME.md`. Verifikasi main SHA, Vercel production SHA, Supabase schema/migrations/advisors sebelum perubahan. Jangan reset/force-push/merge/redesign/deploy manual tanpa kebutuhan. Jangan menyentuh Under Construction, checkout/payment, atau canonical Dapur architecture kecuali task secara eksplisit mengizinkan. Audit dependency/caller sebelum SQL. Gunakan perubahan minimum, test rollback/equivalence, lalu verify source → database → deployment → HTTP → browser → console. Jangan klaim PASS tanpa bukti. Mulai dari P0 SECURITY DEFINER caller/grant audit.

## 11. PILIHAN PLATFORM AGEN

Di antara Freebuff dan Google AI Studio, **Freebuff Desktop/Cloud lebih cocok untuk melanjutkan repository ini** karena fokusnya agent coding pada repo/GitHub, workspace, terminal, serta perubahan multi-file. Gunakan branch/worktree terisolasi dan jangan memberikan secret production.

Google AI Studio lebih cocok untuk prototipe Gemini/full-stack baru, eksperimen prompt, dan fitur AI-native. Walau dapat mengimpor GitHub dan mengelola multi-file, jangan menjadikannya authority untuk migration/RLS atau membiarkannya meregenerasi arsitektur Studihome.

Pilihan tool tidak menggantikan protocol audit di dokumen ini.

