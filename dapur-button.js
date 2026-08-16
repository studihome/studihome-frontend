(() => {
  'use strict';

  /**
   * Canonical Kamar -> Dapur CTA synchronizer.
   *
   * The Kamar panel is rendered by index.html. This small controller only
   * synchronizes its label + destination from the authenticated user's
   * server-backed Creator access and own creator profile.
   *
   * Security boundary: Supabase RPC/RLS. The button is UX/navigation only.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const LEGACY_LABELS = new Set(['Mulai di Dapur', 'Buka Dapur']);
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{2,39}$/i;
  const CHECK_DELAY = 180;

  let timer = 0;
  let inFlight = false;
  let observer = null;

  const db = () => window.supabaseClient || null;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeCreatorPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/dapur/${encodeURIComponent(slug)}` : null;
  }

  function findButton() {
    return document.querySelector(BUTTON_SELECTOR);
  }

  function normalizeLegacyState() {
    const button = findButton();
    if (!button) return;

    const label = String(button.textContent || '').trim();
    if (LEGACY_LABELS.has(label)) {
      button.textContent = 'Memuat Dapur...';
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
    }
  }

  async function resolveTarget() {
    const client = db();
    if (!client?.auth) return null;

    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;

    const user = userData?.user;
    if (!user?.id) return null;

    // Single authoritative access decision for Creator workspace.
    const { data: access, error: accessError } = await client.rpc('has_creator_workspace_access');
    if (accessError) throw accessError;
    if (access !== true) return null;

    const { data: creator, error: creatorError } = await client
      .from('creator_profiles')
      .select('username')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (creatorError) throw creatorError;

    const creatorPath = safeCreatorPath(creator?.username);

    return {
      label: creatorPath ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: creatorPath || '/dapur'
    };
  }

  function applyTarget(target) {
    const button = findButton();
    if (!button || !target) return false;

    button.removeAttribute('onclick');
    button.type = 'button';
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-disabled');
    button.textContent = target.label;
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = target.path;

    if (button.dataset.dapurListenerBound !== '1') {
      button.addEventListener('click', (event) => {
        event.preventDefault();

        const rawPath = button.dataset.dapurTarget || '/dapur';
        const safePath = rawPath === '/dapur'
          ? '/dapur'
          : safeCreatorPath(rawPath.replace(/^\/dapur\//, ''));

        if (!safePath) return;
        window.location.assign(safePath);
      }, { passive: false });

      button.dataset.dapurListenerBound = '1';
    }

    return true;
  }

  async function sync() {
    const button = findButton();
    if (!button || inFlight) return;

    inFlight = true;
    try {
      normalizeLegacyState();
      const target = await resolveTarget();
      if (target) applyTarget(target);
    } catch (error) {
      console.warn('[Studihome Dapur CTA]', error?.message || error);
      // Keep the Kamar panel functional; never expose a guessed Creator URL.
      const current = findButton();
      if (current && current.dataset.dapurCtaManaged !== '1') {
        current.disabled = false;
        current.removeAttribute('aria-busy');
      }
    } finally {
      inFlight = false;
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = window.setTimeout(() => void sync(), CHECK_DELAY);
  }

  async function boot() {
    for (let i = 0; i < 120; i += 1) {
      if (db()?.auth) break;
      await sleep(50);
    }
    if (!db()?.auth) return;

    schedule();

    if (!observer && document.body) {
      observer = new MutationObserver(() => {
        if (document.querySelector(SELECTOR)) schedule();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    db().auth.onAuthStateChange(() => schedule());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
