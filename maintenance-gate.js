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

  function loadMaintenanceRenderer() {
    if (document.querySelector('script[data-maintenance-renderer]')) return;
    const script = document.createElement('script');
    script.src = '/under-construction.js?v=6';
    script.dataset.maintenanceRenderer = 'true';
    script.defer = false;
    document.head.appendChild(script);
  }

  async function run() {
    try {
      const [{ data: settingsRow }, { data: userRow }] = await Promise.all([
        client.from('site_settings').select('under_construction').eq('id', 1).maybeSingle(),
        client.auth.getUser()
      ]);

      const settings = settingsRow?.under_construction || {};
      if (settings.enabled !== true) return;

      if (PUBLIC_ENTRY) {
        // Root is the canonical public maintenance experience.
        loadMaintenanceRenderer();
        return;
      }

      if (AUTH_ENTRY.has(PATH)) return;

      // Authenticated users retain access to protected application routes.
      if (userRow?.user) return;

      // Anonymous/public visitors cannot enter application routes while maintenance is active.
      location.replace('/');
    } catch (error) {
      // Fail open: a database/network failure must not lock users out of the app.
      console.warn('[Studihome] Maintenance gate unavailable; keeping current route.', error);
    }
  }

  run();
})();
