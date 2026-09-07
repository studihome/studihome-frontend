'use strict';

const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const migration = fs.readFileSync(
  'supabase/migrations/20260907040000_reconcile_creator_portfolio_media_policy.sql',
  'utf8'
);
const rollback = fs.readFileSync(
  'supabase/rollbacks/20260907040000_restore_creator_portfolio_media_policy.sql',
  'utf8'
);
const preflight = fs.readFileSync(
  'supabase/tests/creator_portfolio_media_policy_preflight.sql',
  'utf8'
);
const verification = fs.readFileSync(
  'supabase/tests/creator_portfolio_media_policy_verification.sql',
  'utf8'
);
const index = fs.readFileSync('index.html', 'utf8');

const requiredMigration = [
  'creator_portfolios_media_policy_v2',
  'validate constraint creator_portfolios_media_policy_v2',
  "when 'video' then media_url ~* '^https://'",
  "when 'youtube' then media_url ~* '^https://(www\\.)?(youtube\\.com|youtu\\.be)/'",
  'drop constraint creator_portfolios_external_media_policy',
  'drop constraint creator_portfolios_media_type_check',
  'drop constraint creator_portfolios_media_url_https_check',
  'drop constraint creator_portfolios_supported_media_check',
  'v_bad_rows',
  'Preflight failed'
];

for (const marker of requiredMigration) {
  assert(
    migration.includes(marker),
    `Creator portfolio media migration marker missing: ${marker}`
  );
}

for (const marker of [
  ' grant ',
  '\ngrant ',
  ' revoke ',
  '\nrevoke ',
  'create policy',
  'drop policy',
  'alter policy',
  'enable row level security',
  'disable row level security'
]) {
  assert(
    !migration.toLowerCase().includes(marker),
    `Unexpected permission/RLS blast radius in media policy migration: ${marker}`
  );
}

const requiredRollback = [
  'creator_portfolios_external_media_policy',
  'creator_portfolios_media_type_check',
  'creator_portfolios_media_url_https_check',
  'creator_portfolios_supported_media_check',
  ') not valid;',
  'drop constraint creator_portfolios_media_policy_v2'
];

for (const marker of requiredRollback) {
  assert(
    rollback.includes(marker),
    `Creator portfolio media rollback marker missing: ${marker}`
  );
}

const requiredPreflight = [
  'creator_portfolio_media_policy_preflight',
  'expected 4 legacy media constraints',
  'v2 policy already exists',
  'current rows violate target policy'
];

for (const marker of requiredPreflight) {
  assert(
    preflight.includes(marker),
    `Creator portfolio media preflight marker missing: ${marker}`
  );
}

const requiredVerification = [
  'allow_link',
  'allow_image',
  'allow_video',
  'allow_youtube',
  'allow_drive',
  'allow_tiktok',
  'allow_instagram',
  'deny_http',
  'deny_wrong_youtube_host',
  'deny_unknown_type',
  'rollback;'
];

for (const marker of requiredVerification) {
  assert(
    verification.includes(marker),
    `Creator portfolio media verification marker missing: ${marker}`
  );
}

for (const marker of [
  'alter table public.creator_profiles',
  'alter table public.creator_services',
  'grant ',
  'revoke ',
  'create policy',
  'drop policy'
]) {
  assert(
    !rollback.toLowerCase().includes(marker),
    `Unexpected rollback blast radius: ${marker}`
  );
}

assert(
  /mediaType === 'video'|type === 'video'/.test(index),
  'Main runtime must retain native video rendering support before enabling DB video policy'
);
assert(
  /<video/.test(index),
  'Main runtime must still contain a native video renderer'
);

console.log('Creator portfolio media policy regression: PASS');
