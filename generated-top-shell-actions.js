(() => {
  'use strict';

  function bindDelegatedClick(containerId, selector, flag, handler) {
    const container = document.getElementById(containerId);
    if (!container || container.dataset[flag] === '1') return;

    container.addEventListener('click', event => {
      const target = event.target;
      const button = target instanceof Element ? target.closest(selector) : null;
      if (!button || !container.contains(button)) return;
      handler(button);
    });

    container.dataset[flag] = '1';
  }

  function bindGeneratedTopShellActions() {
    bindDelegatedClick(
      'top-nav-links',
      '[data-app-route]',
      'appRouteBound',
      button => {
        const route = button.dataset.appRoute || '';
        if (route) window.App.router.navigate(route);
      }
    );

    bindDelegatedClick(
      'mobile-nav-links',
      '[data-app-route]',
      'appRouteBound',
      button => {
        const route = button.dataset.appRoute || '';
        if (route) window.App.router.navigate(route);
      }
    );

    bindDelegatedClick(
      'top-auth-area',
      '[data-top-auth-action]',
      'topAuthActionBound',
      button => {
        const action = button.dataset.topAuthAction || '';
        if (action === 'logout') {
          window.App.auth.logout();
          return;
        }
        if (action === 'login') {
          window.App.ui.toggleModal('auth-modal', true);
        }
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGeneratedTopShellActions, { once: true });
  } else {
    bindGeneratedTopShellActions();
  }
})();
