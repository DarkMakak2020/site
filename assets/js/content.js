// ============================================================
// content.js — слой контента (CMS-ready)
// Контент лежит в /content/*.json. Коллекции рендерятся из этих файлов,
// поэтому добавление материала = новая запись в JSON (или через админку Decap).
// ============================================================
(function () {
  'use strict';

  // Корень сайта, вычисленный от пути к base.css — работает и на сервере, и под file://
  function getRoot() {
    if (window.__ROOT__ != null) return window.__ROOT__;
    const l = document.querySelector('link[rel="stylesheet"][href$="assets/css/base.css"]');
    let r = '';
    if (l) r = l.getAttribute('href').replace(/assets\/css\/base\.css.*$/, '');
    window.__ROOT__ = r;
    return r;
  }
  // Преобразовать «серверный» путь (/about/, /assets/...) в относительный с index.html
  function R(p) {
    if (p == null) return p;
    if (/^(https?:|mailto:|tel:|data:|#)/.test(p)) return p;
    const root = getRoot();
    let hash = '';
    const hi = p.indexOf('#');
    if (hi >= 0) { hash = p.slice(hi); p = p.slice(0, hi); }
    if (p === '/' || p === '') return root + 'index.html' + hash;
    p = p.replace(/^\//, '');
    if (p.endsWith('/')) p += 'index.html';
    return root + p + hash;
  }
  window.SiteRoot = { get: getRoot, resolve: R };

  const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function formatDateRu(iso) {
    if (!iso || typeof iso !== 'string') return iso || '';
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return iso;
    const day = parseInt(m[3], 10);
    const month = MONTHS_RU[parseInt(m[2], 10) - 1];
    return day + ' ' + month + ' ' + m[1];
  }

  function rutubeIdFromUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const m = url.match(/rutube\.ru\/video(?:\/private)?\/([a-f0-9]+)/i);
    return m ? m[1] : '';
  }

  function coverSrc(cover) {
    if (!cover) return '';
    return /^(https?:|data:)/.test(cover) ? cover : R(cover);
  }

  function mountEmbedPlayer(container, embedUrl, title) {
    if (!container || !embedUrl) return;
    container.classList.add('is-playing');
    let iframe = container.querySelector('iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      container.appendChild(iframe);
    }
    const sep = embedUrl.includes('?') ? '&' : '?';
    iframe.src = embedUrl + sep + 'autoplay=1';
    iframe.title = title || 'Подкаст «КОД МЕСТА»';
  }

  function playPodcastEpisode(player, opts) {
    if (!player || !opts || !opts.embedUrl) return;
    player.dataset.embedUrl = opts.embedUrl;
    const title = opts.title || '';
    if (title) {
      player.setAttribute('aria-label', title);
      const tag = player.querySelector('.video-tag');
      if (tag) tag.textContent = title;
    }
    if (opts.cover) {
      const img = player.querySelector('img');
      if (img) {
        img.src = opts.cover;
        if (title) img.alt = title;
      }
    }
    mountEmbedPlayer(player, opts.embedUrl, title);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    player.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  }

  function setPodcastPlayerMeta(player, item) {
    if (!player || !item) return;
    if (item.embedUrl) player.dataset.embedUrl = item.embedUrl;
    if (item.title) {
      player.setAttribute('aria-label', item.title);
      const tag = player.querySelector('.video-tag');
      if (tag) tag.textContent = item.title;
    }
    if (item.cover) {
      const img = player.querySelector('img');
      if (img) {
        img.src = coverSrc(item.cover);
        img.alt = item.title || 'Подкаст «КОД МЕСТА»';
      }
    }
  }

  function initPodcastPlayer() {
    const player = document.getElementById('podcast-player');
    if (!player) return;

    const playCurrent = () => {
      const embedUrl = player.dataset.embedUrl;
      if (!embedUrl) return;
      mountEmbedPlayer(player, embedUrl, player.getAttribute('aria-label'));
    };

    player.addEventListener('click', (e) => {
      if (player.classList.contains('is-playing')) return;
      e.preventDefault();
      playCurrent();
    });
    player.addEventListener('keydown', (e) => {
      if (player.classList.contains('is-playing')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playCurrent();
      }
    });

    const list = document.getElementById('podcast');
    if (list) {
      list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-play-video]');
        if (!btn) return;
        e.preventDefault();
        playPodcastEpisode(player, {
          embedUrl: btn.dataset.embedUrl,
          title: btn.dataset.videoTitle,
          cover: btn.dataset.videoCover,
        });
      });
    }
  }

  const cache = {};
  async function loadJSON(path) {
    if (cache[path]) return cache[path];
    // Сначала пробуем встроенный бандл (content/bundle.js) — нужно для file://
    const key = path.split('/').pop().replace(/\.json$/, '');
    if (window.__CONTENT__ && window.__CONTENT__[key]) {
      cache[path] = window.__CONTENT__[key];
      return cache[path];
    }
    const res = await fetch(R(path), { cache: 'no-cache' });
    if (!res.ok) throw new Error('Не удалось загрузить ' + path);
    const data = await res.json();
    cache[path] = data;
    return data;
  }

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const arrowSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M7 17 L17 7M9 7h8v8"/></svg>';

  /* Глиф со шторки перехода — плейсхолдер обложки в журнале */
  const GLYPH_COVER_SVG =
    '<span class="cover-glyph" aria-hidden="true">' +
      '<svg class="pc-glyph pc-glyph--cover" viewBox="0 0 300 300" fill="none" aria-hidden="true">' +
        '<g stroke="currentColor" stroke-width="1">' +
          '<line class="pc-line" x1="150" y1="150" x2="150" y2="14"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="150" y2="286"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="14" y2="150"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="286" y2="150"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="244" y2="56"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="56" y2="56"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="244" y2="244"/>' +
          '<line class="pc-line" x1="150" y1="150" x2="56" y2="244"/>' +
          '<path class="pc-ring" d="M150 20 L280 150 L150 280 L20 150 Z"/>' +
          '<path class="pc-ring" d="M150 55 L245 150 L150 245 L55 150 Z"/>' +
          '<path class="pc-ring" d="M150 90 L210 150 L150 210 L90 150 Z"/>' +
        '</g>' +
        '<circle class="pc-dash" cx="150" cy="150" r="120" stroke="currentColor" stroke-width="0.7" stroke-dasharray="2 7"/>' +
        '<g class="pc-nodes" fill="currentColor">' +
          '<circle cx="150" cy="20" r="3.6"/>' +
          '<circle cx="280" cy="150" r="3.6"/>' +
          '<circle cx="150" cy="280" r="3.6"/>' +
          '<circle cx="20" cy="150" r="3.6"/>' +
        '</g>' +
        '<circle class="pc-core" cx="150" cy="150" r="6" fill="currentColor"/>' +
      '</svg>' +
    '</span>';

  function coverMarkup(item, opts) {
    opts = opts || {};
    if (item.cover) {
      const loading = opts.loading || 'lazy';
      const decoding = opts.decoding || 'async';
      return `<img src="${esc(coverSrc(item.cover))}" alt="${esc(item.title || '')}" loading="${loading}" decoding="${decoding}" />`;
    }
    const mono = (item.mono || (item.title || '').trim().charAt(0) || '✶');
    return `<span class="cover-mono">${esc(mono)}</span>`;
  }

  function journalCoverMarkup(item) {
    if (item.cover) return coverMarkup(item);
    return GLYPH_COVER_SVG;
  }

  function podcastCoverMarkup(item) {
    if (!item.cover) return coverMarkup(item);
    const src = coverSrc(item.cover);
    const ref = /^https?:/.test(src) ? ' referrerpolicy="no-referrer"' : '';
    return `<img src="${esc(src)}" alt="${esc(item.title || '')}" loading="lazy" decoding="async"${ref} />`;
  }

  function tagsMarkup(tags) {
    if (!tags || !tags.length) return '';
    return `<div class="ccard-tags">${tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`;
  }

  // ---- Шаблоны карточек ----
  const templates = {
    excursion(item) {
      const meta = [item.duration, item.format, item.audience].filter(Boolean)
        .map((m) => `<span>${esc(m)}</span>`).join('');
      const price = item.price ? `<span class="ccard-price">${esc(item.price)}</span>` : '<span></span>';
      const href = `${R('/kod-mesta/excursions/index.html')}?route=${encodeURIComponent(item.slug)}#excursion-request`;
      return `
      <article class="ccard ccard--archival ccard--excursion reveal">
        <a class="ccard-hit" href="${esc(href)}" data-route="${esc(item.slug)}" aria-label="Подобрать маршрут: ${esc(item.title)}"></a>
        <div class="ccard-cover">${coverMarkup(item)}</div>
        <div class="ccard-body">
          ${tagsMarkup(item.tags)}
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary)}</p>
          <div class="ccard-meta">${meta}</div>
          <div class="ccard-foot">
            ${price}
            <span class="link-arrow" aria-hidden="true">Подобрать маршрут ${arrowSvg}</span>
          </div>
        </div>
      </article>`;
    },
    podcast(item) {
      const meta = [item.guest ? 'Гость: ' + item.guest : '', item.date, item.platform]
        .filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
      const embedUrl = item.embedUrl || (rutubeIdFromUrl(item.videoUrl || item.url)
        ? 'https://rutube.ru/play/embed/' + rutubeIdFromUrl(item.videoUrl || item.url) + '/'
        : '');
      let hit = '';
      let footLink = '';
      let cardClass = 'ccard ccard--podcast reveal';
      if (embedUrl) {
        cardClass += ' ccard--podcast-playable';
        hit = `<button type="button" class="ccard-hit" data-play-video data-embed-url="${esc(embedUrl)}" data-video-title="${esc(item.title)}" data-video-cover="${esc(coverSrc(item.cover))}" aria-label="Смотреть: ${esc(item.title)}"></button>`;
        footLink = `<span class="link-arrow" aria-hidden="true">Смотреть ${arrowSvg}</span>`;
      } else if (item.url) {
        cardClass += ' ccard--podcast-playable';
        hit = `<a class="ccard-hit" href="${esc(item.url)}" target="_blank" rel="noopener" aria-label="Смотреть на MediaMetrics: ${esc(item.title)}"></a>`;
        footLink = `<span class="link-arrow" aria-hidden="true">На MediaMetrics ${arrowSvg}</span>`;
      } else {
        footLink = '<span class="ccard-price">Скоро</span>';
      }
      return `
      <article class="${cardClass}">
        ${hit}
        <div class="ccard-poster">${podcastCoverMarkup(item)}</div>
        <div class="ccard-body">
          ${tagsMarkup(item.tags)}
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary)}</p>
          <div class="ccard-meta">${meta}</div>
          <div class="ccard-foot"><span></span>${footLink}</div>
        </div>
      </article>`;
    },
    book(item) {
      const stores = (item.stores || [])
        .map((s) => `<a class="link-arrow" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ${arrowSvg}</a>`)
        .join('');
      const status = item.status ? `<span class="tag tag--status">${esc(item.status)}</span>` : '';
      return `
      <article class="ccard ccard--book reveal">
        <div class="ccard-cover">${coverMarkup(item, { loading: 'eager' })}</div>
        <div class="ccard-body">
          <div class="ccard-tags">${status}${(item.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary)}</p>
          <div class="ccard-meta"><span>${esc(item.year || '')}</span><span>${esc(item.genre || '')}</span></div>
          <div class="ccard-foot" style="flex-direction:column;align-items:flex-start;gap:.5rem">${stores}</div>
        </div>
      </article>`;
    },
    journal(item) {
      const href = `${R('/journal/article.html')}?slug=${encodeURIComponent(item.slug)}`;
      const meta = [item.category, formatDateRu(item.date)].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('');
      return `
      <article class="ccard ccard--journal reveal">
        <a href="${href}" class="ccard-cover" aria-label="${esc(item.title)}">${journalCoverMarkup(item)}</a>
        <div class="ccard-body">
          ${tagsMarkup(item.tags)}
          <h3><a href="${href}">${esc(item.title)}</a></h3>
          <p>${esc(item.summary)}</p>
          <div class="ccard-meta">${meta}</div>
          <div class="ccard-foot"><span></span><a class="link-arrow" href="${href}">Читать ${arrowSvg}</a></div>
        </div>
      </article>`;
    },
  };

  function shortenRouteLabel(title) {
    if (!title || title.length <= 52) return title;
    return title.slice(0, 49).trim() + '…';
  }

  function initExcursionRouteSelect(items) {
    const sel = document.getElementById('ex-route');
    if (!sel || !items || !items.length) return;
    if (sel.options.length > 1) {
      // HTML уже содержит маршруты — только синхронизируем из JSON, если списки различаются
      const slugs = items.map((it) => it.slug).filter(Boolean);
      const existing = Array.from(sel.options).slice(1).map((o) => o.value);
      if (slugs.length === existing.length && slugs.every((s, i) => s === existing[i])) {
        if (window.reEnhanceSelect) window.reEnhanceSelect(sel);
        return;
      }
    }
    const keep = sel.value || new URLSearchParams(location.search).get('route') || '';
    const opts = ['<option value="">Помогите выбрать</option>'];
    items.forEach((it) => {
      if (!it.slug) return;
      const short = shortenRouteLabel(it.title);
      opts.push(
        '<option value="' + esc(it.slug) + '" data-short="' + esc(short) + '" title="' + esc(it.title) + '">' + esc(it.title) + '</option>'
      );
    });
    sel.innerHTML = opts.join('');
    if (keep && sel.querySelector('option[value="' + keep.replace(/"/g, '\\"') + '"]')) sel.value = keep;
    if (window.reEnhanceSelect) window.reEnhanceSelect(sel);
    else sel.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function applyExcursionRoute(route) {
    if (!route) return;
    const sel = document.getElementById('ex-route');
    if (!sel) return;
    const opt = sel.querySelector('option[value="' + route.replace(/"/g, '\\"') + '"]');
    if (!opt) return;
    sel.value = route;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    const wrap = sel.closest('.cselect');
    if (wrap && !wrap.classList.contains('is-enhanced') && window.reEnhanceSelect) window.reEnhanceSelect(sel);
  }

  function scrollToExcursionForm() {
    const formSection = document.getElementById('excursion-request');
    if (!formSection) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  function initExcursionCardLinks(root) {
    const formSection = document.getElementById('excursion-request');
    if (!formSection) return;
    (root || document).querySelectorAll('.ccard--excursion .ccard-hit').forEach((link) => {
      link.addEventListener('click', (e) => {
        const route = link.dataset.route;
        if (!route) return;
        e.preventDefault();
        applyExcursionRoute(route);
        const url = new URL(location.href);
        url.searchParams.set('route', route);
        url.hash = 'excursion-request';
        history.pushState(null, '', url);
        scrollToExcursionForm();
      });
    });
  }

  async function renderCollection(opts) {
    const mount = document.querySelector(opts.mount);
    if (!mount) return;
    const tpl = templates[opts.type];
    try {
      const data = await loadJSON(opts.path);
      let items = Array.isArray(data) ? data : (data.items || []);
      items = items.filter((it) => it.published !== false);
      if (opts.limit) items = items.slice(0, opts.limit);
      if (!items.length) {
        mount.innerHTML = `<div class="empty-state">${esc(opts.emptyText || 'Материалы скоро появятся.')}</div>`;
        return;
      }
      mount.innerHTML = items.map(tpl).join('');
      if (opts.type === 'excursion') {
        initExcursionCardLinks(mount);
        initExcursionRouteSelect(items);
        const route = new URLSearchParams(location.search).get('route');
        if (route) applyExcursionRoute(route);
        if (window.refreshParallax) window.refreshParallax();
      }
      if (opts.type === 'podcast') {
        const player = document.getElementById('podcast-player');
        const featured = (data.featuredSlug && items.find((i) => i.slug === data.featuredSlug)) || items[0];
        if (player && featured) setPodcastPlayerMeta(player, featured);
        if (window.refreshParallax) window.refreshParallax();
      }
      if (window.revealNow) window.revealNow(mount);
    } catch (err) {
      mount.innerHTML = `<div class="empty-state">Не удалось загрузить контент.<br><small>${esc(err.message)}</small></div>`;
    }
  }

  async function renderArticle(opts) {
    const mount = document.querySelector(opts.mount);
    if (!mount) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    try {
      const data = await loadJSON(opts.path);
      const items = Array.isArray(data) ? data : (data.items || []);
      const item = items.find((i) => i.slug === slug) || items[0];
      if (!item) { mount.innerHTML = '<div class="empty-state">Материал не найден.</div>'; return; }
      if (window.SiteSeo && window.SiteSeo.applyArticle) {
        window.SiteSeo.applyArticle(item, R);
      } else {
        document.title = item.seoTitle || (item.title + ' · Журнал · Елена Бочарова');
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && (item.seoDescription || item.summary)) metaDesc.setAttribute('content', item.seoDescription || item.summary);
      }
      const bodyHtml = (item.body || '').split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join('');
      mount.innerHTML = `
        <p class="eyebrow">${esc(item.category || 'Журнал')}</p>
        <h1>${esc(item.title)}</h1>
        <p class="ccard-meta" style="border:0;padding:0;margin-top:.5rem">${[formatDateRu(item.date), esc(item.author || 'Елена Бочарова')].filter(Boolean).join(' · ')}</p>
        ${item.cover ? `<img src="${esc(R(item.cover))}" alt="${esc(item.title)}" />` : ''}
        ${item.lede ? `<blockquote>${esc(item.lede)}</blockquote>` : ''}
        ${bodyHtml}`;
    } catch (err) {
      mount.innerHTML = `<div class="empty-state">Не удалось загрузить статью.<br><small>${esc(err.message)}</small></div>`;
    }
  }

  function injectAnalytics(site) {
    const a = (site && site.analytics) || {};
    window.__PENDING_ANALYTICS__ = a;
    if (window.SiteCookies && window.SiteCookies.canUseAnalytics && window.SiteCookies.canUseAnalytics()) {
      loadAnalytics(a);
    }
  }

  function loadAnalytics(a) {
    if (window.__ANALYTICS_LOADED__ || !a) return;
    if (a.yandexMetrikaId) {
      window.__YM_ID__ = a.yandexMetrikaId;
      (function (m, e, t, r, i, k, s) {
        m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); }; m[i].l = 1 * new Date();
        k = e.createElement(t), s = e.getElementsByTagName(t)[0]; k.async = 1; k.src = r; s.parentNode.insertBefore(k, s);
      })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
      window.ym(a.yandexMetrikaId, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
    }
    if (a.vkPixelId) {
      window.__VK_PIXEL_ID__ = a.vkPixelId;
    }
    window.__ANALYTICS_LOADED__ = true;
  }

  window.SiteAnalytics = {
    enable() { loadAnalytics(window.__PENDING_ANALYTICS__); },
  };

  async function applyGlobals() {
    try {
      const site = await loadJSON('/content/site.json');
      window.__SITE__ = site;
      if (site.contacts && site.contacts.email) {
        document.querySelectorAll('#footerEmail').forEach((a) => {
          a.textContent = site.contacts.email;
          a.href = 'mailto:' + site.contacts.email;
        });
        if (window.SiteForms) window.SiteForms.config.fallbackEmail = site.contacts.email;
      }
      injectAnalytics(site);
    } catch (_e) { /* нет сервера — игнор */ }
  }

  window.SiteContent = {
    loadJSON, renderCollection, renderArticle, applyGlobals, initPodcastPlayer,
    applyExcursionRoute, scrollToExcursionForm, initExcursionCardLinks, initExcursionRouteSelect, playPodcastEpisode,
    templates, rutubeIdFromUrl,
  };
})();
