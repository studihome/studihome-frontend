window.STUDIHOME_SUPABASE_URL =
  "https://hbfmhwwxbgidsnljupca.supabase.co";

// Public browser key. Keep service_role keys out of the frontend permanently.
window.STUDIHOME_SUPABASE_ANON_KEY =
  "sb_publishable_134slHOJ_kcw5-kxDQDVaw_y1jFO4Lv";

// Canonical Supabase singleton. This file must have one job only:
// bootstrap the shared client before application feature runtimes load.
(function bootstrapStudihomeSupabaseSingleton() {
  try {
    if (window.supabaseClient) return;
    if (!window.supabase?.createClient) return;
    if (!window.STUDIHOME_SUPABASE_URL || !window.STUDIHOME_SUPABASE_ANON_KEY) return;

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
  } catch (error) {
    console.error('[Studihome] Supabase singleton bootstrap failed:', error);
  }

  const gate = document.createElement('script');
  gate.src = '/maintenance-gate.js?v=1';
  gate.async = true;
  gate.onerror = () => console.warn('[Studihome] Maintenance gate failed to load.');
  document.head.appendChild(gate);
})();
