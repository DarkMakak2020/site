// ============================================================
// cookies.js — баннер согласия на cookie и управление аналитикой
// Соответствует требованиям 152-ФЗ и практике информирования о cookie.
// ============================================================
(function () {
  'use strict';

  var STORAGE_KEY = 'eb-cookie-consent';
  var VERSION = 1;

  function getRoot() {
    var link = document.querySelector('link[href*="base.css"]');
    if (!link) return '';
    var href = link.getAttribute('href') || '';
    return href.replace(/assets\/css\/base\.css.*$/, '');
  }

  function readConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.v !== VERSION) return null;
      return data;
    } catch (_e) {
      return null;
    }
  }

  function saveConsent(analytics) {
    var data = {
      v: VERSION,
      necessary: true,
      analytics: !!analytics,
      ts: new Date().toISOString(),
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_e) {}
    document.documentElement.classList.add('cookie-consent-set');
    document.documentElement.classList.remove('cookie-banner-open');
    document.documentElement.classList.toggle('cookie-analytics-ok', !!analytics);
    var banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.classList.add('is-hidden');
      setTimeout(function () { banner.remove(); }, 500);
    }
    if (analytics && window.SiteAnalytics && window.SiteAnalytics.enable) {
      window.SiteAnalytics.enable();
    }
  }

  function injectBanner() {
    if (document.getElementById('cookie-banner')) return;
    var root = getRoot();
    var privacyUrl = root + 'privacy/index.html';
    var el = document.createElement('div');
    el.id = 'cookie-banner';
    el.className = 'cookie-banner';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.setAttribute('aria-labelledby', 'cookie-banner-title');
    el.setAttribute('aria-describedby', 'cookie-banner-desc');
    el.innerHTML =
      '<div class="cookie-banner__inner wrap">' +
        '<div class="cookie-banner__text">' +
          '<p class="cookie-banner__eyebrow" id="cookie-banner-title">Файлы cookie</p>' +
          '<p class="cookie-banner__desc" id="cookie-banner-desc">' +
            'Мы используем необходимые cookie для работы сайта и запоминания вашего выбора. ' +
            'Аналитические cookie (Яндекс.Метрика и аналоги) подключаются только с вашего согласия. ' +
            'Подробнее — в <a href="' + privacyUrl + '#cookies">политике конфиденциальности</a>.' +
          '</p>' +
        '</div>' +
        '<div class="cookie-banner__actions">' +
          '<button type="button" class="btn btn-ghost cookie-banner__btn" data-cookie="necessary">Только необходимые</button>' +
          '<button type="button" class="btn btn-primary cookie-banner__btn" data-cookie="all">Принять все</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    document.documentElement.classList.add('cookie-banner-open');
    requestAnimationFrame(function () { el.classList.add('is-visible'); });

    el.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cookie]');
      if (!btn) return;
      saveConsent(btn.getAttribute('data-cookie') === 'all');
    });
  }

  function initConsentLinks() {
    var root = getRoot();
    var privacy = root + 'privacy/index.html';
    document.querySelectorAll('.consent label').forEach(function (label) {
      var links = label.querySelectorAll('a');
      links.forEach(function (a) {
        var t = (a.textContent || '').toLowerCase();
        if (t.indexOf('политик') !== -1) {
          a.href = privacy;
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        } else if (t.indexOf('обработк') !== -1 || t.indexOf('персональн') !== -1) {
          a.href = privacy + '#consent';
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        }
        a.addEventListener('click', function (e) { e.stopPropagation(); });
      });
      if (links.length === 1) {
        links[0].href = privacy;
        links[0].setAttribute('target', '_blank');
        links[0].setAttribute('rel', 'noopener');
      }
    });
  }

  function init() {
    var existing = readConsent();
    if (existing) {
      document.documentElement.classList.add('cookie-consent-set');
      document.documentElement.classList.toggle('cookie-analytics-ok', !!existing.analytics);
      if (existing.analytics && window.SiteAnalytics && window.SiteAnalytics.enable) {
        window.SiteAnalytics.enable();
      }
      initConsentLinks();
      return;
    }
    injectBanner();
    initConsentLinks();
  }

  window.SiteCookies = {
    read: readConsent,
    canUseAnalytics: function () {
      var c = readConsent();
      return !!(c && c.analytics);
    },
    reset: function () {
      try { localStorage.removeItem(STORAGE_KEY); } catch (_e) {}
      location.reload();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
