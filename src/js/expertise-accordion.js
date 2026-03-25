/**
 * Our Expertise Section - Mobile Accordion Functionality
 *
 * Enables accordion/collapsible behavior on mobile devices (<=768px).
 * Automatically opens first item, allows user to expand/collapse sections.
 * Desktop layout is unaffected.
 */

(function () {
  'use strict';

  let accordionController = null;

  function isMobile() {
    return window.innerWidth <= 768;
  }

  function initAccordion() {
    // Abort previous accordion listeners before re-initializing
    if (accordionController) {
      accordionController.abort();
    }
    accordionController = new AbortController();
    const signal = accordionController.signal;

    if (!isMobile()) {
      // Strip accordion classes on desktop so layout stays 3-column
      const cards = document.querySelectorAll(
        'section[aria-labelledby="expertise-detail-heading"] .slds-col'
      );
      cards.forEach(function (card) {
        card.classList.remove('accordion-expanded');
        var h = card.querySelector('h3.slds-text-heading_medium');
        if (h) {
          h.removeAttribute('role');
          h.removeAttribute('tabindex');
          h.removeAttribute('aria-expanded');
        }
      });
      return;
    }

    var expertiseSection = document.querySelector(
      'section[aria-labelledby="expertise-detail-heading"]'
    );
    if (!expertiseSection) return;

    var cards = expertiseSection.querySelectorAll('.slds-col.slds-size_1-of-1');
    if (!cards.length) return;

    // Open first card by default
    cards[0].classList.add('accordion-expanded');

    cards.forEach(function (card, index) {
      var header = card.querySelector('h3.slds-text-heading_medium');
      var list = card.querySelector('ul.expertise-list');
      if (!header) return;

      // Accessibility: link header to controlled panel
      var listId = 'expertise-list-' + index;
      if (list) {
        list.id = listId;
        header.setAttribute('aria-controls', listId);
      }

      header.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var isExpanded = card.classList.contains('accordion-expanded');

        // Close all
        cards.forEach(function (c) {
          c.classList.remove('accordion-expanded');
          var h = c.querySelector('h3.slds-text-heading_medium');
          if (h) h.setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked
        if (!isExpanded) {
          card.classList.add('accordion-expanded');
          header.setAttribute('aria-expanded', 'true');
        }
      }, { signal });

      // Accessibility
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', card.classList.contains('accordion-expanded'));

      header.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          header.click();
        }
      }, { signal });
    });
  }

  // Global listeners use a separate controller (never aborted — lives for page lifetime)
  const globalController = new AbortController();
  const globalSignal = globalController.signal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion, { signal: globalSignal });
  } else {
    initAccordion();
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initAccordion, 250);
  }, { signal: globalSignal });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      initAccordion();
    }
  }, { signal: globalSignal });
})();
