(() => {
  'use strict';

  function bindGeneratedUtilityActions() {
    const main = document.getElementById('main-content');
    if (!main || main.dataset.utilityActionsBound === '1') return;

    main.addEventListener('click', event => {
      const target = event.target;
      const element = target instanceof Element
        ? target.closest('[data-global-action]')
        : null;
      if (!element || !main.contains(element)) return;

      const action = element.dataset.globalAction || '';
      if (action === 'reload') {
        window.location.reload();
        return;
      }
      if (action === 'home') {
        window.App.router.navigate('home');
      }
    });

    main.dataset.utilityActionsBound = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindGeneratedUtilityActions, { once: true });
  } else {
    bindGeneratedUtilityActions();
  }
})();
