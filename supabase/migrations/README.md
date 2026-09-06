# Supabase migrations

This directory tracks production database migrations that were applied through
the Supabase migration API and are not represented by the older root-level
manual `DATABASE_MIGRATION_*.sql` files.

Rules:
- Never edit an already-applied migration to change production history.
- Add a new migration for every subsequent DDL change.
- Keep the timestamp/name aligned with Supabase migration history.
- Run Security and Performance Advisors after DDL.
- Do not apply the pending Web Push M46 until its Edge Function and real-device
  interoperability tests are production-ready.
