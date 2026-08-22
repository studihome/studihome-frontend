window.STUDIHOME_SUPABASE_URL =
  "https://hbfmhwwxbgidsnljupca.supabase.co";

// Public browser key. Keep service_role keys out of the frontend permanently.
window.STUDIHOME_SUPABASE_ANON_KEY =
  "sb_publishable_134slHOJ_kcw5-kxDQDVaw_y1jFO4Lv";

(function bootstrapStudihomeSupabaseSingleton() {
  'use strict';
  let booted = false;
  let gateStarted = false;

  function startGate() {
    if (gateStarted) return;
    gateStarted = true;
    const gate = document.createElement('script');
    gate.src = '/maintenance-gate.js?v=1';
    gate.async = true;
    gate.onerror = () => console.warn('[Studihome] Maintenance gate failed to load.');
    document.head.appendChild(gate);
  }

  function createClientOnce() {
    if (booted || window.supabaseClient) {
      booted = true;
      startGate();
      return true;
    }
    if (!window.supabase?.createClient) return false;
    if (!window.STUDIHOME_SUPABASE_URL || !window.STUDIHOME_SUPABASE_ANON_KEY) return false;

    try {
      window.supabaseClient = window.supabase.createClient(
        window.STUDIHOME_SUPABASE_URL,
        window.STUDIHOME_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
      booted = true;
      startGate();
      window.dispatchEvent(new CustomEvent('studihome:supabase-client-ready'));
      return true;
    } catch (error) {
      console.error('[Studihome] Supabase singleton bootstrap failed:', error);
      return false;
    }
  }

  if (createClientOnce()) return;

  const retry = () => {
    if (!createClientOnce()) {
      window.setTimeout(retry, 50);
    }
  };

  window.addEventListener('studihome:supabase-sdk-ready', retry, { once: true });
  window.addEventListener('studihome:supabase-sdk-failed', () => {
    console.error('[Studihome] Supabase SDK could not be loaded from the configured CDNs.');
  }, { once: true });
})();