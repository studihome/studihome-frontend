(() => {
  'use strict';

  const PATH = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (PATH !== '/studio-ai' && !PATH.startsWith('/studio-ai/')) return;
  if (window.__STUDIO_AI_SEARCH_V3__) return;
  window.__STUDIO_AI_SEARCH_V3__ = true;

  const normalize = value => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const visible