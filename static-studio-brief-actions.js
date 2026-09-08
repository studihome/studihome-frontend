(() => {
  'use strict';

  function bindStaticStudioBriefActions() {
    const closeIcon = document.getElementById('studio-smart-close-icon');
    const closeSecondary = document.getElementById('studio-smart-close-secondary');
    const submit = document.getElementById('studio-smart-submit');

    if (closeIcon) {
      closeIcon.addEventListener('click', () => window.App.studioAI.closeSmartBrief());
    }
    if (closeSecondary) {
      closeSecondary.addEventListener('click', () => window.App.studioAI.closeSmartBrief());
    }

    document.querySelectorAll('[data-studio-refinement]').forEach(button => {
      button.addEventListener('click', () => {
        window.App.studioAI._applyConversationalRefinement(
          button.dataset.studioRefinement || ''
        );
      });
    });

    if (submit) {
      submit.addEventListener('click', () => {
        window.App.studioAI.submitSmartBrief(submit);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindStaticStudioBriefActions, { once: true });
  } else {
    bindStaticStudioBriefActions();
  }
})();
