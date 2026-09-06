# FREEBUFF — PERINTAH AWAL STUDIHOME

Gunakan prompt ini sebagai pesan pertama pada sesi Freebuff baru setelah skill project tersedia di:

`.claude/skills/managing-studihome/SKILL.md`

Jika host mendukung invocation skill eksplisit, panggil:

`/managing-studihome`

Lalu kirim instruksi berikut:

```text
Gunakan skill managing-studihome.

Repository:
studihome/studihome-frontend

Mulai dengan CURRENT STATE DISCOVERY dan jangan menulis kode sebelum discovery selesai.

Wajib:
1. Refresh current main SHA dan commit terbaru.
2. Periksa open PR/issues yang relevan.
3. Periksa GitHub Actions, required checks, branch protection, dan repository rulesets.
4. Cocokkan GitHub SHA dengan Vercel Preview/production deployment.
5. Jika task menyentuh backend, audit live Supabase:
   - schema;
   - RLS;
   - grants;
   - RPC/functions;
   - Auth settings;
   - Storage jika relevan;
   - Security Advisor;
   - Performance Advisor;
   - live Edge Functions.
6. Baca current:
   - MASTER_HANDOFF_PROMPT_STUDIHOME.md
   - PROJECT_STATE_LATEST.md
   - PROJECT_CONSTITUTION.md
   - FREEBUFF_MASTER_PROMPT_STUDIHOME.md
7. Revalidasi semua P0 berdasarkan evidence terbaru.
8. Laporkan drift antara GitHub, Supabase, Vercel, dan dokumentasi.
9. Susun P0/P1/P2 baru berdasarkan bukti.
10. Pilih P0 tertinggi yang aman untuk ditangani.

Untuk implementasi:
- cari root cause dan canonical owner;
- audit semua caller/reference;
- hitung blast radius dan regression risk;
- tentukan rollback;
- gunakan patch minimum;
- buat branch terpisah;
- jalankan mandatory tests;
- buat PR;
- validasi Vercel Preview;
- jalankan applicable browser/E2E/security/backend checks;
- merge/deploy hanya jika semua mandatory gates PASS;
- sesudah production, pastikan production SHA = intended SHA dan lakukan smoke verification.

Jangan:
- direct push ke main sebagai shortcut;
- force-push/reset unrelated work;
- menjalankan SQL production secara blind;
- menjalankan DATABASE_MIGRATION_46_PUSH_SUBSCRIPTIONS.sql apa adanya;
- expose service-role/secret;
- menganggap frontend sebagai authorization boundary;
- membuat fake testimonial/rating/purchase/customer/social proof;
- mematikan test supaya CI hijau;
- mengklaim zero bug atau 100% secure.

Gunakan Bahasa Indonesia.

Gunakan status:
PASS / FAIL / BLOCKED / NOT VERIFIED / NOT APPLICABLE.

Mulai sekarang dengan CURRENT STATE DISCOVERY.
```

## Perintah lanjutan umum

```text
Gunakan skill managing-studihome.

Lanjutkan P0 tertinggi yang sudah terverifikasi dari discovery terbaru.
Ikuti root-cause-first, minimum-safe-patch, branch + PR + Preview + applicable E2E.
Jangan merge/deploy bila mandatory gate gagal.
Update PROJECT_STATE_LATEST.md jika state proyek benar-benar berubah dan sudah terverifikasi.
```

## Perintah task spesifik

```text
Gunakan skill managing-studihome.

Kerjakan hanya scope berikut:
<TULIS TASK>

Refresh state sebelum patch.
Audit root cause, canonical owner, caller/reference, security impact, regression risk, rollback, dan SEO/GEO impact terlebih dahulu.
Gunakan branch + PR + Preview + tests.
Jika documentation bertentangan dengan live evidence, prioritaskan live evidence dan tandai dokumentasi stale.
```
