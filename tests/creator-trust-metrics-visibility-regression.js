'use strict';

const fs = require('fs');

const migrationPath = 'supabase/migrations/20260907004000_constrain_creator_trust_metrics_visibility.sql';
const migration = fs.readFileSync(migrationPath, 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const requiredMigrationMarkers = [
  'create or replace function public.get_creator_trust_metrics(p_creator_id uuid)',
  'security definer',
  "set search_path to ''",
  'cp.is_published = true',
  'public.is_admin() as is_admin',
  'cp.user_id = c.uid',
  'public.has_creator_workspace_access()',
  'from allowed_creator;'
];

for (const marker of requiredMigrationMarkers) {
  assert(
    migration.toLowerCase().includes(marker.toLowerCase()),
    `Creator trust visibility hardening marker missing: ${marker}`
  );
}

const forbiddenMigrationMarkers = [
  'alter table ',
  'create table ',
  'drop table ',
  'create policy ',
  'alter policy ',
  'drop policy ',
  'grant ',
  'revoke ',
  'security invoker'
];

for (const marker of forbiddenMigrationMarkers) {
  assert(
    !migration.toLowerCase().includes(marker),
    `Unexpected blast-radius expansion in trust metrics migration: ${marker}`
  );
}

const profileAction = index.indexOf("action === 'GET_CREATOR_PROFILE'");
assert(profileAction >= 0, 'GET_CREATOR_PROFILE action missing from index.html');

const profileBlockEnd = index.indexOf("} else if (action ===", profileAction + 1);
const profileBlock = index.slice(
  profileAction,
  profileBlockEnd >= 0 ? profileBlockEnd : profileAction + 18000
);

const publishGuard = profileBlock.indexOf("if (!creator || !creator.is_published)");
const trustRpc = profileBlock.indexOf("rpc('get_creator_trust_metrics'");
assert(publishGuard >= 0, 'Published Creator guard missing before trust metrics RPC');
assert(trustRpc >= 0, 'Trust metrics RPC missing from current public Creator profile flow');
assert(
  publishGuard < trustRpc,
  'Public Creator profile must reject unpublished Creator before trust metrics RPC'
);

assert(
  !index.includes("rpc('get_creator_like_count'"),
  'Legacy get_creator_like_count unexpectedly became a runtime caller'
);

console.log('Creator trust metrics visibility regression: PASS');
