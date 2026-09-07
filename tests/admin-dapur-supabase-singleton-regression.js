'use strict';

const fs = require('fs');

const admin = fs.readFileSync('admin-dapur-creator-v5.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const forbidden = [
  'window.__studihomeAdminSupabase',
  'window.supabase.createClient(',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  "script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0'",
  'data-studihome-supabase-sdk'
];

for (const marker of forbidden) {
  assert(!admin.includes(marker), `Forbidden secondary Supabase path remains: ${marker}`);
}

const required = [
  "const CANONICAL_CLIENT_READY_EVENT = 'studihome:supabase-client-ready';",
  'const CANONICAL_CLIENT_WAIT_MS = 3000;',
  'const db = window.supabaseClient;',
  'window.addEventListener(CANONICAL_CLIENT_READY_EVENT, onReady);',
  'window.removeEventListener(CANONICAL_CLIENT_READY_EVENT, onReady);',
  "Koneksi data utama belum siap. Muat ulang halaman Admin lalu coba lagi."
];

for (const marker of required) {
  assert(admin.includes(marker), `Canonical singleton guard missing: ${marker}`);
}

const configPos = index.indexOf('/supabase-config.js?v=boot5');
const adminPos = index.indexOf('/admin-dapur-creator-v5.js?v=11');
assert(configPos >= 0, 'Canonical supabase-config loader missing from index.html');
assert(adminPos >= 0, 'Admin Dapur v11 loader missing from index.html');
assert(configPos < adminPos, 'supabase-config.js must load before Admin Dapur runtime');

console.log('Admin Dapur canonical Supabase singleton regression: PASS');
