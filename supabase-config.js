window.STUDIHOME_SUPABASE_URL =
  "https://hbfmhwwxbgidsnljupca.supabase.co";

// Public browser key. This project currently serves its REST API with the
// legacy anon key; keep service_role keys out of the frontend permanently.
window.STUDIHOME_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZm1od3d4YmdpZHNubGp1cGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjQ4NTAsImV4cCI6MjEwMjA0MDg1MH0.-yvhEk9TxbqWGCQZvP_VZt9iax-bADY1ZprzXokmrCU";

// Canonical Supabase singleton: every module reuses this same client.
(function bootstrapStudihomeSupabaseSingleton() {
  try {
    if (
      window.supabase?.createClient &&
      window.STUDIHOME_SUPABASE_URL &&
      window.STUDIHOME_SUPABASE_ANON_KEY &&
      !window.supabaseClient
    ) {
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
    }
  } catch (error) {
    console.error('[Studihome] Supabase singleton bootstrap failed:', error);
  }
})();

// Global navigation contract: Dapur is NEVER a top-level/global header item.
(function lockGlobalHeaderNavigation() {
  const blockedLabels = new Set(['dapur', 'dapur creator', 'creator']);

  function clean() {
    ['top-nav-links', 'mobile-nav-links'].forEach((id) => {
      const root = document.getElementById(id);
      if (!root) return;

      [...root.querySelectorAll('button, a')].forEach((item) => {
        const label = (item.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (blockedLabels.has(label)) item.remove();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clean, { once: false });
  } else {
    clean();
  }

  const observer = new MutationObserver(clean);
  const start = () => observer.observe(document.body, { childList: true, subtree: true });
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
