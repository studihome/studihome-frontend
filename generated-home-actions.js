(() => {
  'use strict';

  function bindGeneratedHomeActions() {
    const main = document.getElementById('main-content');
    if (!main || main.dataset.homeActionsBound === '1') return;

    main.addEventListener('click', event => {
      const target = event.target;
      const element = target instanceof Element
        ? target.closest('[data-home-cta-url], [data-home-route]')
        : null;
      if (!element || !main.contains(element)) return;

      const ctaUrl = element.dataset.homeCtaUrl;
      if (ctaUrl !== undefined) {
        window.App.home.handleCtaClick(ctaUrl);
        return;
      }

      const route = element.dataset.homeRoute || '';
      if (route) {
        window.App.router.navigate(route);
      }
    });

    main.dataset.homeActionsBound = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGeneratedHomeActions, { once: true });
  } else {
    bindGeneratedHomeActions();
  }
})();
