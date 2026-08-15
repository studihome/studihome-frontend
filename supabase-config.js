window.STUDIHOME_SUPABASE_URL =
  "https://hbfmhwwxbgidsnljupca.supabase.co";

// Public browser key. Keep service_role keys out of the frontend permanently.
window.STUDIHOME_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm1od3d4YmdpZHNubGp1cGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjQ4NTAsImV4cCI6MjEwMjA0MDg1MH0.-yvhEk9TxbqWGCQZvP_VZt9iax-bADY1ZprzXokmrCU";

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
})();
