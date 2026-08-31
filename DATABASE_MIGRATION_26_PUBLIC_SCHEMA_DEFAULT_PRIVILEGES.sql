-- Migration 26: make Data API exposure opt-in for future public-schema objects.
-- Scope is the postgres owner used by all current Studihome application objects.
-- Existing object grants and service_role defaults are unchanged.

alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;