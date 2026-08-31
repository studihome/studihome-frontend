-- Migration 27: remove PostgreSQL's global PUBLIC EXECUTE default for future functions.
-- Schema-specific explicit grants (including service_role and storage defaults) remain unchanged.

alter default privileges for role postgres
  revoke execute on functions from public;