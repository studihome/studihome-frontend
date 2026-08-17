(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  const PUBLIC_ENTRY = PATH === '/';
  const AUTH_ENTRY = new Set(['/login', '/register', '/auth/callback']);
  const SUPABASE_URL = window.STUDIHOME_SUPABASE_URL;
  const ANON_KEY = window.STUDIHOME_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !ANON_KEY) return;

  const client = window.supabaseClient;
  if (!client?.from || !client?.auth) return;

  const routeNeedsGate = !PUBLIC_ENTRY && !AUTH_ENTRY.has(PATH);

  async function run() {
    try {
      const [{ data: settingsRow }, { data: userRow }] = await Promise.all([
        client.from('site_settings').select('under_construction').eq('id', 1).maybeSingle(),
        client.auth.getUser()
      ]);

      const settings = settingsRow?.under_construction || {};
      if (settings.enabled !== true || !routeNeedsGate) return;

      // Authenticated users retain access to protected application routes.
      // Anonymous visitors are sent to the public maintenance experience.
      if (userRow?.user) return;

      if (location.pathname !== '/') {
        location.replace('/');
      }
    } catch (error) {
      // Fail open: a database/network failure must not lock users out of the app.
      console.warn('[Studihome] Maintenance gate unavailable; keeping current route.', error);
    }
  }

  run();
})();
