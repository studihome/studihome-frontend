(() => {
  'use strict';

  /**
   * Canonical Kamar -> Dapur CTA synchronizer.
   *
   * Workspace URL is always /dapur. A Creator username is a public slug,
   * never the private workspace route. Supabase RPC/RLS remains the security boundary.
   */

  const SELECTOR = '#kamar-creator-entry';
  const BUTTON_SELECTOR = `${SELECTOR} button`;
  const LEGACY_LABELS = new Set(['Mulai di Dapur', 'Buka Dapur', 'Buat Dapur Gratis']);
  const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/i;
  const CHECK_DELAY = 180;

  let timer = 0;
  let inFlight = false;
  let observer = null;
  let authSubscription = null;

  const db = () => window.supabaseClient || null;
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safePublicPath(username) {
    const slug = String(username || '').trim().toLowerCase();
    return SLUG_RE.test(slug) ? `/${encodeURIComponent(slug)}` : null;
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

    const publicPath = safePublicPath(creator?.username);
    return {
      label: publicPath ? 'Kelola Dapur Kamu' : 'Mulai Membuat Dapur',
      path: '/dapur',
      publicPath
    };
  }

  function ensurePublicLink(publicPath) {
    const button = findButton();
    if (!button || !publicPath) return;
    const host = button.parentElement;
    if (!host) return;
    let link = host.querySelector('[data-kamar-public-dapur]');
    if (!link) {
      link = document.createElement('a');
      link.dataset.kamarPublicDapur = '1';
      link.className = 'text-[10px] sm:text-xs font-extrabold text-[#151c75] hover:underline';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Lihat Dapur Publik ↗';
      host.appendChild(link);
    }
    link.href = publicPath;
  }

  function applyTarget(target) {
    const button = findButton();
    if (!button || !target) return false;

    button.removeAttribute('onclick');
    button.type = 'button';
    button.textContent = target.label;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.removeAttribute('aria-disabled');
    button.dataset.dapurCtaManaged = '1';
    button.dataset.dapurTarget = '/dapur';

    ensurePublicLink(target.publicPath);

    if (button.dataset.dapurListenerBound !== '1') {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.assign('/dapur');
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
      const current = findButton();
      if (current) {
        current.textContent = 'Mulai Membuat Dapur';
        current.disabled = false;
        current.removeAttribute('aria-busy');
        current.dataset.dapurTarget = '/dapur';
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

    if (!authSubscription) {
      const { data } = db().auth.onAuthStateChange(() => schedule());
      authSubscription = data?.subscription || null;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
