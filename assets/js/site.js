// ============================================================
// site.js — общий слой: шапка/подвал, навигация, reveal, формы
// Сайт статический, обслуживается с корня (например python -m http.server).
// Поэтому используются корне-относительные ссылки вида "/kod-mesta/".
// ============================================================
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // Ссылка «К содержанию»: убираем inline left:-9999px (даёт горизонтальный скролл на iOS).
  function fixSkipLinks() {
    document.querySelectorAll('a[href="#main"]').forEach((a) => {
      a.removeAttribute('style');
      a.removeAttribute('onfocus');
      a.removeAttribute('onblur');
      a.classList.add('skip-link');
    });
  }
  if (document.body) fixSkipLinks();
  document.addEventListener('DOMContentLoaded', fixSkipLinks);

  // --- Глобальная навигация (единый источник правды) ---
  const NAV = [
    { href: '/kod-mesta/', label: 'КОД МЕСТА' },
    { href: '/strateg/', label: 'Стратег' },
    { href: '/coach/', label: 'Коуч' },
    { href: '/praktikum-hr/', label: 'Практикум HR' },
    { href: '/kod-mesta/excursions/', label: 'Экскурсии' },
    { href: '/books/', label: 'Книги' },
    { href: '/kod-mesta/podcast/', label: 'Подкаст' },
    { href: '/about/', label: 'Обо мне' },
    { href: '/contacts/', label: 'Контакты' },
  ];

  const LOGO_PATHS =
      '<path d="M24 3 L45 24 L24 45 L3 24 Z" stroke="currentColor" stroke-width="1.3" opacity="0.55"/>' +
      '<path d="M24 11 L37 24 L24 37 L11 24 Z" stroke="currentColor" stroke-width="1"/>' +
      '<circle cx="24" cy="24" r="2.4" fill="currentColor"/>' +
      '<path d="M24 13.5 V20" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M24 28 V34.5" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M13.5 24 H20" stroke="currentColor" stroke-width="1"/>' +
      '<path d="M28 24 H34.5" stroke="currentColor" stroke-width="1"/>';

  const CONSENT_LOGO_PATHS =
      '<path d="M24 0 L48 24 L24 48 L0 24 Z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" opacity="0.9"/>' +
      '<path d="M24 9 L39 24 L24 39 L9 24 Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="24" cy="24" r="3.6" fill="currentColor"/>' +
      '<path d="M24 7 V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M24 27 V41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M7 24 H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M27 24 H41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';

  const LOGO_SVG =
    '<svg class="logo-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      LOGO_PATHS +
    '</svg>';

  const NAV_CLOSE_GLYPH_SVG =
    '<svg class="nav-close-glyph" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      LOGO_PATHS +
    '</svg>';

  const CONSENT_MARK_SVG =
    '<svg viewBox="-1.2 -1.2 50.4 50.4" fill="none" aria-hidden="true" overflow="visible">' +
      CONSENT_LOGO_PATHS +
    '</svg>';

  // Корень сайта (общий помощник из content.js, либо локальная копия)
  function getRoot() {
    if (window.SiteRoot) return window.SiteRoot.get();
    if (window.__ROOT__ != null) return window.__ROOT__;
    const l = document.querySelector('link[rel="stylesheet"][href$="assets/css/base.css"]');
    let r = '';
    if (l) r = l.getAttribute('href').replace(/assets\/css\/base\.css.*$/, '');
    window.__ROOT__ = r;
    return r;
  }

  /* Invite из письма Netlify ведёт на главную — перекидываем в /admin/, где есть форма пароля */
  (function redirectIdentityHashToAdmin() {
    var path = location.pathname || '';
    if (/\/admin\/?$/i.test(path) || /\/admin\/index\.html$/i.test(path)) return;
    var hash = location.hash || '';
    if (!/(invite_token|confirmation_token|recovery_token)=/i.test(hash)) return;
    var root = getRoot();
    location.replace(root + 'admin/index.html' + hash);
  })();

  function R(p) {
    if (window.SiteRoot) return window.SiteRoot.resolve(p);
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

  // Текущий путь (нормализуем без index.html и с финальным слешем)
  const here = (function () {
    let p = location.pathname.replace(/index\.html$/, '');
    if (!p.endsWith('/')) p += '/';
    return p;
  })();

  function navMarkup() {
    return NAV.map((n) => {
      const active = here.endsWith(n.href);
      return `<a href="${R(n.href)}"${active ? ' aria-current="page"' : ''}>${n.label}</a>`;
    }).join('');
  }

  function renderHeader() {
    const mount = document.querySelector('[data-header]');
    if (!mount) return;
    mount.outerHTML = `
    <header class="site-header" id="header">
      <div class="wrap header-inner">
        <a class="brand" href="${R('/')}" aria-label="Елена Бочарова — на главную">
          ${LOGO_SVG}
          <span>
            <span class="brand-name">Елена Бочарова</span>
            <span class="brand-sub">КОД МЕСТА</span>
          </span>
        </a>
        <nav class="nav" id="nav" aria-label="Основная навигация">
          <button type="button" class="nav-close" id="navClose" aria-label="Закрыть меню">
            <span class="nav-close-label">Закрыть</span>
            ${NAV_CLOSE_GLYPH_SVG}
          </button>
          ${navMarkup()}
          <button type="button" class="nav-dismiss-zone" id="navDismissZone" aria-label="Закрыть меню"></button>
          <div class="nav-mobile-cta">
            <a href="${R('/strateg/#contact')}" class="btn btn-primary">Диагностическая сессия</a>
          </div>
        </nav>
        <div class="header-cta">
          <a href="${R('/strateg/#contact')}" class="btn btn-primary">Диагностическая сессия</a>
        </div>
        <button class="nav-toggle" id="navToggle" aria-label="Открыть меню" aria-expanded="false" aria-controls="nav">
          <span class="nav-toggle-box" aria-hidden="true">
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
            <span class="nav-toggle-line"></span>
          </span>
        </button>
      </div>
      <div class="nav-backdrop" id="navBackdrop" aria-hidden="true"></div>
    </header>`;
  }

  function renderFooter() {
    const mount = document.querySelector('[data-footer]');
    if (!mount) return;
    const year = new Date().getFullYear();
    mount.outerHTML = `
    <footer class="site-footer">
      <div class="wrap">
        <div class="footer-grid">
          <a class="brand" href="${R('/')}" aria-label="Елена Бочарова — на главную">
            ${LOGO_SVG}
            <span>
              <span class="brand-name" style="font-size:1.1rem">Елена Бочарова</span>
              <span class="brand-sub">Автор метода КОД МЕСТА</span>
            </span>
          </a>
          <div class="footer-cols">
            <div class="footer-col">
              <h4>Направления</h4>
              <nav class="footer-links" aria-label="Направления">
                <a href="${R('/kod-mesta/')}">КОД МЕСТА</a>
                <a href="${R('/strateg/')}">Стратег</a>
                <a href="${R('/coach/')}">Коуч</a>
                <a href="${R('/praktikum-hr/')}">Практикум HR</a>
              </nav>
            </div>
            <div class="footer-col">
              <h4>Контент</h4>
              <nav class="footer-links" aria-label="Контент">
                <a href="${R('/kod-mesta/excursions/')}">Экскурсии</a>
                <a href="${R('/kod-mesta/podcast/')}">Подкаст</a>
                <a href="${R('/books/')}">Книги</a>
                <a href="${R('/journal/')}">Журнал</a>
              </nav>
            </div>
            <div class="footer-col">
              <h4>Подкаст</h4>
              <nav class="footer-links" aria-label="Подкаст">
                <a href="https://vk.ru/kodmesta" target="_blank" rel="noopener">VK Видео</a>
                <a href="https://rutube.ru/channel/73837855/" target="_blank" rel="noopener">Rutube</a>
                <a href="https://radio.mediametrics.ru/Kod%20mesta/" target="_blank" rel="noopener">MediaMetrics</a>
              </nav>
            </div>
            <div class="footer-col">
              <h4>Контакт</h4>
              <nav class="footer-links" aria-label="Контакт">
                <a href="tel:+79653407481">+7 965 340-74-81</a>
                <a href="mailto:Elenabbocharova@yandex.ru">Elenabbocharova@yandex.ru</a>
                <a href="https://t.me/ElenaBBo" target="_blank" rel="noopener">Telegram @ElenaBBo</a>
                <a href="${R('/contacts/')}">Все контакты</a>
              </nav>
            </div>
          </div>
        </div>
        <div class="footer-fine">
          <span>© ${year} Елена Бочарова. Стратег · Коуч · HR-директор · Гид · Писательница.</span>
          <span><a href="${R('/privacy/')}">Политика конфиденциальности</a></span>
          <span class="footer-credit">Разработка сайта — <a href="https://strelforge.ru" target="_blank" rel="noopener noreferrer">StrelForge</a></span>
        </div>
      </div>
    </footer>`;
  }

  function initConsentLinks() {
    document.querySelectorAll('.consent label a').forEach(function (a) {
      var t = (a.textContent || '').toLowerCase();
      if (t.indexOf('политик') !== -1) a.href = R('/privacy/index.html');
      else if (t.indexOf('обработк') !== -1) a.href = R('/privacy/index.html') + '#consent';
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      // Клик по ссылке внутри label не должен дёргать чекбокс (двойное срабатывание).
      a.addEventListener('click', function (e) { e.stopPropagation(); });
    });
  }

  function initConsentCheckboxes() {
    document.querySelectorAll('.consent input[type="checkbox"]').forEach(function (cb) {
      var box = cb.closest('.consent');
      if (!box || box.querySelector('.consent-mark')) return;
      var mark = document.createElement('span');
      mark.className = 'consent-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = CONSENT_MARK_SVG;
      cb.insertAdjacentElement('afterend', mark);
      function sync() { mark.classList.toggle('is-on', cb.checked); }
      cb.addEventListener('change', sync);
      sync();
    });
  }

  // --- Шапка: фон при скролле + мобильное меню ---
  function initHeaderBehaviour() {
    const header = document.getElementById('header');
    if (header) {
      const onScroll = () => {
        if (window.scrollY > 24) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('nav');
    const backdrop = document.getElementById('navBackdrop');
    const closeBtn = document.getElementById('navClose');
    const dismissZone = document.getElementById('navDismissZone');
    if (toggle && nav) {
      const setNavOpen = (open) => {
        nav.classList.toggle('open', open);
        toggle.classList.toggle('is-active', open);
        document.documentElement.classList.toggle('is-nav-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        if (backdrop) backdrop.setAttribute('aria-hidden', String(!open));
      };
      toggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('open')));
      if (closeBtn) closeBtn.addEventListener('click', () => setNavOpen(false));
      if (dismissZone) dismissZone.addEventListener('click', () => setNavOpen(false));
      if (backdrop) backdrop.addEventListener('click', () => setNavOpen(false));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && nav.classList.contains('open')) setNavOpen(false);
      });
      nav.querySelectorAll('a').forEach((a) =>
        a.addEventListener('click', () => setNavOpen(false))
      );
    }
  }

  // --- Reveal on scroll ---
  function assignStagger(root) {
    root = root || document;
    const groups = [];
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute('data-stagger')) groups.push(root);
    if (root.querySelectorAll) root.querySelectorAll('[data-stagger]').forEach((g) => groups.push(g));
    groups.forEach((group) => {
      const step = parseInt(group.dataset.stagger, 10) || 90;
      let idx = 0;
      group.querySelectorAll('.reveal').forEach((el) => {
        if (el.dataset.delay == null) { el.dataset.delay = String(idx * step); idx += 1; }
      });
    });
  }

  // Единая хореография hero/subhero — без правок в каждом HTML.
  function initHeroChoreography() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.querySelectorAll('.subhero .crumbs').forEach((el) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-down');
        if (el.dataset.delay == null) el.dataset.delay = '0';
      }
    });

    document.querySelectorAll('.subhero-inner h1, .subhero.wrap--narrow > h1').forEach((el) => {
      if (el.hasAttribute('data-split')) return;
      if (!el.classList.contains('reveal-mask')) el.classList.add('reveal-mask');
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
      if (el.dataset.delay == null) el.dataset.delay = '120';
    });

    document.querySelectorAll('.subhero > p.lede:not(.reveal)').forEach((el) => {
      el.classList.add('reveal', 'reveal-blur');
      if (el.dataset.delay == null) el.dataset.delay = '280';
    });

    document.querySelectorAll('.platform-links').forEach((el) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal', 'reveal-soft');
        if (el.dataset.delay == null) el.dataset.delay = '480';
      }
    });
  }

  // Touch-отклик на устройствах без hover (iOS/Android).
  function initTouchFeedback() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

    const sel = '.ccard, .btn, .door, .platform-links a, .video-frame[role="button"], .link-arrow';
    let active = null;

    document.addEventListener('touchstart', (e) => {
      const el = e.target.closest(sel);
      if (!el) return;
      if (active && active !== el) active.classList.remove('is-touch');
      active = el;
      el.classList.add('is-touch');
    }, { passive: true });

    const clear = () => {
      if (!active) return;
      active.classList.remove('is-touch');
      active = null;
    };
    document.addEventListener('touchend', clear, { passive: true });
    document.addEventListener('touchcancel', clear, { passive: true });
  }

  function initReveal() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Каскад: элементам внутри [data-stagger] раздаём пошаговую задержку.
    assignStagger(document);
    const items = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }

    const reveal = (el) => {
      if (el.classList.contains('in') || el.dataset.revealQueued) return;
      el.dataset.revealQueued = '1';
      const delay = parseInt(el.dataset.delay, 10) || 0;
      setTimeout(() => el.classList.add('in'), delay);
    };

    const mobile = window.matchMedia('(max-width: 900px)').matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
        });
      },
      // На мобильных — мягче: формы внизу страницы не должны «залипать» невидимыми.
      mobile
        ? { threshold: 0.06, rootMargin: '0px 0px 4% 0px' }
        : { threshold: 0.1, rootMargin: '0px 0px -8% 0px' }
    );

    // Только элементы первого экрана проигрываем как «вход» сразу (через два
    // кадра — чтобы исходное состояние успело отрисоваться и анимация пошла).
    // Всё, что ниже сгиба, появляется ИСКЛЮЧИТЕЛЬНО при прокрутке.
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const above = [];
    items.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.85) above.push(el);
      else io.observe(el);
    });
    if (_arriving) {
      // Пришли из-под шторы: верхний экран сразу в финал, без въезда.
      above.forEach((el) => el.classList.add('in'));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => { above.forEach(reveal); }));
    }

    // Страховка ТОЛЬКО для первого экрана: если вход почему-то не проиграл
    // (ошибка JS, фоновая вкладка) — верхние блоки не останутся пустыми.
    // Контент ниже сгиба намеренно ждёт скролла и здесь не трогается.
    setTimeout(() => {
      above.forEach((el) => el.classList.add('in'));
    }, 1400);

    let revealTicking = false;
    function revealInViewport() {
      revealTicking = false;
      const vh = window.innerHeight || document.documentElement.clientHeight;
      document.querySelectorAll('.reveal:not(.in)').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > vh * 0.04) reveal(el);
      });
    }
    window.addEventListener('scroll', () => {
      if (!revealTicking) {
        revealTicking = true;
        requestAnimationFrame(revealInViewport);
      }
    }, { passive: true });

    // Якорные ссылки (#contact, #prereg) и поздний layout на iOS:
    // один раз проверяем видимость после загрузки.
    setTimeout(revealInViewport, 200);
    if (location.hash) setTimeout(revealInViewport, 600);
    window.addEventListener('hashchange', () => setTimeout(revealInViewport, 120), { passive: true });
  }

  // Публичный помощник: пометить динамически добавленные .reveal как видимые
  window.revealNow = function (root) {
    assignStagger(root || document);
    (root || document).querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
      const delay = parseInt(el.dataset.delay, 10);
      setTimeout(() => el.classList.add('in'), isNaN(delay) ? (i % 6) * 80 : delay);
    });
    if (window.refreshParallax) window.refreshParallax();
  };

  // ============================================================
  // WOW-слой: премиальные микро-анимации
  // ============================================================
  const prefersReduced = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = () =>
    window.matchMedia('(pointer: fine)').matches;

  // 1. Полоса прогресса скролла
  function initScrollProgress() {
    if (prefersReduced()) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const update = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const y = window.scrollY || h.scrollTop || 0;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Кнопка «В начало» — появляется при прокрутке вниз.
  function initBackToTop() {
    if (document.querySelector('.back-top')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-top';
    btn.setAttribute('aria-label', 'В начало страницы');
    btn.innerHTML =
      '<span class="back-top__mark" aria-hidden="true">' +
        '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2">' +
          '<path d="M16 4 L28 16 L16 28 L4 16 Z" opacity="0.45"/>' +
          '<path d="M16 10 L22 16 L16 22 L10 16 Z"/>' +
          '<path d="M16 22 V10" stroke-linecap="round"/>' +
          '<path d="M12 14 L16 10 L20 14" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</span>' +
      '<span class="back-top__label">В начало</span>';
    document.body.appendChild(btn);

    let visible = false;
    let ticking = false;
    const threshold = () => Math.max(280, (window.innerHeight || 640) * 0.42);
    const pageScrollable = () => {
      const h = document.documentElement;
      return h.scrollHeight > h.clientHeight + 120;
    };

    const update = () => {
      ticking = false;
      if (!pageScrollable()) {
        if (visible) { visible = false; btn.classList.remove('is-visible'); }
        return;
      }
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const show = y > threshold();
      if (show === visible) return;
      visible = show;
      btn.classList.toggle('is-visible', show);
    };

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced() ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // 2. Split-text: разбиваем showpiece-заголовки на слова, сохраняя
  //    вложенную разметку (<em>, <span>, <br>).
  function buildSplit(node, words) {
    const frag = document.createDocumentFragment();
    Array.prototype.forEach.call(node.childNodes, (child) => {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        parts.forEach((part) => {
          if (part === '') return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const outer = document.createElement('span'); outer.className = 'w';
          const inner = document.createElement('span'); inner.className = 'w-i';
          inner.textContent = part;
          outer.appendChild(inner);
          frag.appendChild(outer);
          words.push(inner);
        });
      } else if (child.nodeType === 1) {
        if (child.tagName === 'BR') { frag.appendChild(child.cloneNode(false)); return; }
        const clone = child.cloneNode(false);
        clone.appendChild(buildSplit(child, words));
        frag.appendChild(clone);
      }
    });
    return frag;
  }

  function initSplitText() {
    const targets = Array.prototype.slice.call(document.querySelectorAll('[data-split]'));
    if (!targets.length) return;
    targets.forEach((el) => {
      if (el.dataset.splitDone) return;
      const words = [];
      const frag = buildSplit(el, words);
      el.textContent = '';
      el.appendChild(frag);
      el.dataset.splitDone = '1';
      el.classList.add('split-ready');
      el._words = words;
    });
    if (prefersReduced()) { targets.forEach((el) => el.classList.add('split-in')); return; }
    const play = (el) => {
      const inHero = el.closest('.subhero-inner, .subhero, .hero-grid > div, .hero > div');
      const baseDelay = inHero ? 140 : 0;
      (el._words || []).forEach((w, i) => { w.style.transitionDelay = (baseDelay + i * 55) + 'ms'; });
      el.classList.add('split-in');
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { play(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });
    const vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < vh * 0.92) {
        if (_arriving) play(el); // из-под шторы — мгновенно, без анимации
        else requestAnimationFrame(() => requestAnimationFrame(() => play(el)));
      } else { io.observe(el); }
    });
  }

  // 3. Line-draw: фирменный глиф «прорисовывается» штрихом при появлении.
  function initGlyphDraw() {
    const glyphs = Array.prototype.slice.call(document.querySelectorAll('.glyph-svg'));
    if (!glyphs.length) return;
    const shapesOf = (svg) => svg.querySelectorAll('path, line, circle, rect, polygon, polyline');
    glyphs.forEach((svg) => {
      shapesOf(svg).forEach((s) => {
        s.setAttribute('pathLength', '1');
        s.style.strokeDasharray = '1';
        s.style.strokeDashoffset = '1';
      });
    });
    if (prefersReduced()) {
      glyphs.forEach((svg) => shapesOf(svg).forEach((s) => {
        s.style.strokeDashoffset = '0'; s.style.strokeDasharray = 'none';
      }));
      return;
    }
    const draw = (svg) => {
      shapesOf(svg).forEach((s, i) => {
        s.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
        s.style.transitionDelay = (i * 110) + 'ms';
        requestAnimationFrame(() => { s.style.strokeDashoffset = '0'; });
      });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { draw(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.3 });
    glyphs.forEach((svg) => io.observe(svg));
  }

  // 4. Кастомный курсор (золотая аура) + магнитные элементы.
  function initCustomCursor() {
    if (prefersReduced() || !finePointer()) return;
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring);
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my, raf;
    const loop = () => {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const sel = 'a, button, input, textarea, select, label, .door, .btn, [role="button"]';
    const syncRingActive = () => {
      const hit = document.elementFromPoint(mx, my);
      // Чекбокс согласия — без увеличенного кольца (mix-blend-mode даёт «мигание» внизу формы).
      if (hit && hit.closest && hit.closest('.consent input[type="checkbox"]')) {
        ring.classList.remove('is-active');
        return;
      }
      if (hit && hit.closest && hit.closest(sel)) ring.classList.add('is-active');
      else ring.classList.remove('is-active');
    };
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      syncRingActive();
    });
    document.addEventListener('mouseover', syncRingActive);
    document.addEventListener('mousedown', () => ring.classList.add('is-down'));
    document.addEventListener('mouseup', () => ring.classList.remove('is-down'));
    document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { ring.style.opacity = ''; });
  }

  function initMagnetic() {
    if (prefersReduced() || !finePointer()) return;
    document.querySelectorAll('.btn, .door').forEach((el) => {
      const isDoor = el.classList.contains('door');
      const strength = isDoor ? 0.12 : 0.22;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.setProperty('--mag-x', (dx * strength).toFixed(1) + 'px');
        el.style.setProperty('--mag-y', (dy * strength).toFixed(1) + 'px');
      });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--mag-x', '0px');
        el.style.setProperty('--mag-y', '0px');
      });
    });
  }

  // 5. Параллакс: портреты (translate напрямую) и обложки (через --py).
  const _portraits = [];
  const _covers = [];
  let _parallaxBound = false;
  function collectParallax() {
    document.querySelectorAll('.portrait--photo img').forEach((img) => {
      if (img.dataset.pllx) return;
      img.dataset.pllx = 'p';
      img.style.transform = 'translate3d(0,0,0) scale(1.08)';
      _portraits.push(img);
    });
    document.querySelectorAll('.ccard-cover img, .ccard-poster img, .video-frame img').forEach((img) => {
      if (img.dataset.pllx) return;
      if (img.closest('.ccard--book')) return;
      if (img.closest('.video-frame--poster, #podcast-player')) return;
      img.dataset.pllx = 'c';
      img.classList.add('has-parallax');
      _covers.push(img);
    });
  }
  function updateParallax() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    _portraits.forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = 'translate3d(0,' + (off * -24).toFixed(1) + 'px,0) scale(1.08)';
    });
    _covers.forEach((img) => {
      const r = img.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      const off = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.setProperty('--py', (off * -14).toFixed(1) + 'px');
    });
  }
  function initParallax() {
    if (prefersReduced()) return;
    collectParallax();
    if (!_parallaxBound) {
      _parallaxBound = true;
      let ticking = false;
      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateParallax(); ticking = false; });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', updateParallax);
    }
    updateParallax();
    // Динамические карточки (content.js) подключаются через refresh.
    window.refreshParallax = function () {
      if (prefersReduced()) return;
      collectParallax();
      updateParallax();
    };
  }

  // 7. Бегущая строка клиентов (infinite marquee).
  function initMarquee() {
    if (prefersReduced()) return;
    const walls = Array.prototype.slice.call(document.querySelectorAll('[data-marquee]'));
    walls.forEach((wall) => {
      const lis = Array.prototype.slice.call(wall.querySelectorAll('li'));
      if (lis.length < 2) return;
      const names = lis.map((li) => {
        const nm = li.querySelector('.cw-name');
        return (nm ? nm.textContent : li.textContent).trim();
      }).filter(Boolean);
      const makeTrack = (hidden) => {
        const track = document.createElement('div');
        track.className = 'marquee-track';
        if (hidden) track.setAttribute('aria-hidden', 'true');
        names.forEach((name) => {
          const item = document.createElement('span');
          item.className = 'mq-item';
          const nm = document.createElement('span');
          nm.className = 'cw-name';
          nm.textContent = name;
          const dia = document.createElement('span');
          dia.className = 'mq-diamond';
          dia.setAttribute('aria-hidden', 'true');
          item.appendChild(nm);
          item.appendChild(dia);
          track.appendChild(item);
        });
        return track;
      };
      const viewport = document.createElement('div');
      viewport.className = 'marquee-viewport';
      const dur = Math.max(20, names.length * 3.4);
      const t1 = makeTrack(false);
      const t2 = makeTrack(true);
      t1.style.animationDuration = dur + 's';
      t2.style.animationDuration = dur + 's';
      viewport.appendChild(t1);
      viewport.appendChild(t2);
      wall.classList.add('client-wall--marquee');
      wall.setAttribute('role', 'list');
      wall.innerHTML = '';
      wall.appendChild(viewport);
    });
  }

  // 8. Переход между страницами: фирменная «схема путей», прорисовка штрихом.
  let _curtain = null;
  // Признак «пришли по внутреннему переходу» — в этом случае контент первого
  // экрана нужно поставить на места без вступительной анимации (она всё равно
  // под шторой), иначе при растворении шторы видно «сырую» страницу.
  let _arriving = false;
  var CURTAIN_SVG =
    '<div class="pc-inner">' +
      '<svg class="pc-glyph" viewBox="0 0 300 300" fill="none" aria-hidden="true">' +
        '<g stroke="currentColor" stroke-width="0.9">' +
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
        '<circle class="pc-dash" cx="150" cy="150" r="120" stroke="currentColor" stroke-width="0.6" stroke-dasharray="2 7"/>' +
        '<g class="pc-nodes" fill="currentColor">' +
          '<circle cx="150" cy="20" r="3.6"/>' +
          '<circle cx="280" cy="150" r="3.6"/>' +
          '<circle cx="150" cy="280" r="3.6"/>' +
          '<circle cx="20" cy="150" r="3.6"/>' +
        '</g>' +
        '<circle class="pc-core" cx="150" cy="150" r="6" fill="currentColor"/>' +
      '</svg>' +
      '<span class="pc-word">\u041a\u041e\u0414 \u041c\u0415\u0421\u0422\u0410</span>' +
    '</div>';

  function curtainSetStrokes(curtain, hidden) {
    const strokes = curtain.querySelectorAll('.pc-line, .pc-ring');
    strokes.forEach((s) => {
      s.setAttribute('pathLength', '1');
      s.style.transition = 'none';
      s.style.transitionDelay = '0s';
      s.style.strokeDasharray = '1';
      s.style.strokeDashoffset = hidden ? '1' : '0';
    });
    return strokes;
  }
  function curtainDraw(curtain) {
    const strokes = curtainSetStrokes(curtain, true);
    void curtain.offsetWidth; // reflow, чтобы скрытое состояние применилось
    strokes.forEach((s, i) => {
      s.style.transition = 'stroke-dashoffset .55s cubic-bezier(0.16,1,0.3,1)';
      s.style.transitionDelay = (i * 36) + 'ms';
      s.style.strokeDashoffset = '0';
    });
    curtain.classList.add('is-drawn');
  }
  function curtainInstant(curtain) {
    curtainSetStrokes(curtain, false);
    curtain.classList.add('is-drawn');
  }
  function injectCurtain() {
    if (prefersReduced() || _curtain || !document.body) return;
    try { _arriving = sessionStorage.getItem('pc-transit') === '1'; } catch (_) {}
    // Пока штора держит — отключаем вступительные анимации reveal/split,
    // чтобы контент под ней встал на места мгновенно (без «сырого» кадра).
    if (_arriving) document.documentElement.classList.add('pc-arriving');
    _curtain = document.createElement('div');
    _curtain.className = 'page-curtain';
    _curtain.setAttribute('aria-hidden', 'true');
    _curtain.innerHTML = CURTAIN_SVG;
    document.body.appendChild(_curtain);
    if (_arriving) {
      // Пришли по переходу — глиф уже был «собран» на уходящей странице.
      // Показываем его СРАЗУ, с первого кадра новой страницы, иначе между
      // ранним injectCurtain (прячет линии) и поздним initPageTransition
      // (показывает их) мелькает пустая плотная штора без лого.
      curtainSetStrokes(_curtain, false);
      _curtain.classList.add('is-drawn');
    } else {
      curtainSetStrokes(_curtain, true);
    }
    document.body.classList.add('curtain-active'); // накрываем сразу — без вспышки
    // Настоящая штора на месте — снимаем ранний CSS-«мост» (заглушку из <head>),
    // под которым прятался «сырой» кадр новой страницы. Фон у них одинаковый.
    document.documentElement.classList.remove('pc-cover');
  }
  function initModulesList() {
    const list = document.querySelector('.modules');
    if (!list || list.dataset.expandReady) return;
    const items = list.querySelectorAll('li');
    if (items.length <= 6) return;
    list.dataset.expandReady = '1';
    if (!window.matchMedia('(max-width: 720px)').matches) return;
    list.classList.add('modules--collapsed');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'modules-expand reveal';
    const hidden = items.length - 6;
    btn.textContent = 'Показать ещё ' + hidden + ' модулей';
    btn.addEventListener('click', () => {
      const collapsed = list.classList.toggle('modules--collapsed');
      btn.textContent = collapsed ? ('Показать ещё ' + hidden + ' модулей') : 'Свернуть список';
    });
    list.after(btn);
    if (window.revealNow) window.revealNow(list.parentElement);
  }

  function initPageTransition() {
    if (prefersReduced() || !_curtain) return;
    const curtain = _curtain;
    let navigating = false;

    // Все отложенные операции шторы держим в одном месте, чтобы можно было их
    // отменить. Иначе «уборка» глифа из прибытия может сработать посреди
    // следующего ухода и стереть уже нарисованную схему (пустой кадр-мерцание).
    let dissolveTimer = null;
    let resetTimer = null;
    const clearCurtainTimers = () => {
      if (dissolveTimer) { clearTimeout(dissolveTimer); dissolveTimer = null; }
      if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
    };

    // Прибытие: если пришли по внутреннему переходу — схема уже «собрана»,
    // быстро растворяем; если свежий вход — рисуем, затем растворяем.
    let transit = false;
    try { transit = sessionStorage.getItem('pc-transit') === '1'; } catch (_) {}
    const dissolve = () => {
      curtain.classList.add('is-leaving');
      document.body.classList.remove('curtain-active');
      // Верхний экран уже на местах — возвращаем анимации для блоков ниже сгиба,
      // которые должны появляться при прокрутке как обычно.
      document.documentElement.classList.remove('pc-arriving');
      // После полного затухания фона — чистый сброс: гасим штрихи схемы,
      // чтобы на экране не оставалось ни одной нарисованной линии/ромба.
      resetTimer = setTimeout(() => {
        resetTimer = null;
        curtain.classList.remove('is-drawn', 'is-leaving');
        curtainSetStrokes(curtain, true);
      }, 1200);
    };
    if (transit) {
      try { sessionStorage.removeItem('pc-transit'); } catch (_) {}
      // Глиф уже показан целиком в injectCurtain (с первого кадра) — здесь
      // ничего не перерисовываем, просто растворяем. Иначе повторная «сборка»
      // может дать мелькание лого.
      requestAnimationFrame(() => requestAnimationFrame(dissolve));
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => curtainDraw(curtain)));
      dissolveTimer = setTimeout(dissolve, 820);
    }

    // Уход: рисуем схему, затем переходим.
    document.addEventListener('click', (e) => {
      if (navigating || e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href[0] === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
      let url;
      try { url = new URL(href, window.location.href); } catch (_) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.hash) return;
      e.preventDefault();
      navigating = true;
      // Гасим подвешенные таймеры прибытия — иначе их «уборка» сработает
      // посреди отрисовки ухода и на миг стирает глиф.
      clearCurtainTimers();
      try { sessionStorage.setItem('pc-transit', '1'); } catch (_) {}
      curtain.classList.remove('is-leaving');
      document.body.classList.add('curtain-active');
      curtainDraw(curtain);
      setTimeout(() => { window.location.href = url.href; }, 700);
    });

    window.addEventListener('pageshow', (ev) => {
      if (ev.persisted) {
        navigating = false;
        curtain.classList.remove('is-drawn', 'is-leaving');
        document.body.classList.remove('curtain-active');
      }
    });
  }

  // 9. Плёночное зерно + свечение за курсором в hero.
  function initGrain() {
    if (prefersReduced() || document.querySelector('.grain')) return;
    const g = document.createElement('div');
    g.className = 'grain';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
  }
  function initHeroGlow() {
    if (prefersReduced() || !finePointer()) return;
    document.querySelectorAll('.hero, .subhero').forEach((hero) => {
      if (hero.querySelector(':scope > .hero-glow')) return;
      const glow = document.createElement('div');
      glow.className = 'hero-glow';
      glow.setAttribute('aria-hidden', 'true');
      hero.insertBefore(glow, hero.firstChild);
      hero.addEventListener('mousemove', (e) => {
        const r = hero.getBoundingClientRect();
        glow.style.setProperty('--gx', (e.clientX - r.left) + 'px');
        glow.style.setProperty('--gy', (e.clientY - r.top) + 'px');
      });
    });
  }

  // 6. Count-up чисел в статистике при попадании в экран.
  function initCountUp() {
    const nums = Array.prototype.slice.call(document.querySelectorAll('.stat b, [data-count]'));
    if (!nums.length) return;
    const re = /(\d[\d\s]*\d|\d)/;
    const animate = (el) => {
      const raw = (el.textContent || '').trim();
      const m = raw.match(re);
      if (!m) return;
      const digits = m[1].replace(/\s/g, '');
      const target = parseInt(digits, 10);
      if (isNaN(target) || target === 0) return;
      const before = raw.slice(0, m.index);
      const after = raw.slice(m.index + m[1].length);
      const grouped = m[1].indexOf(' ') !== -1 || target >= 1000;
      const fmt = (n) => grouped ? n.toLocaleString('ru-RU').replace(/,/g, ' ') : String(n);
      const dur = 1300, start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = before + fmt(Math.round(target * eased)) + after;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = before + fmt(target) + after;
      };
      requestAnimationFrame(tick);
    };
    if (prefersReduced()) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  // Кастомный дропдаун: прячем нативный <select> и рисуем список своими
  // элементами, чтобы убрать системный синий хайлайт <option>.
  function enhanceSelect(select) {
    if (!select || select.closest('.cselect')) return;
    var wrap = document.createElement('div');
    wrap.className = 'cselect';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'cselect-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    var labelEl = select.id ? document.querySelector('label[for="' + select.id + '"]') : null;
    if (labelEl) trigger.setAttribute('aria-label', labelEl.textContent.trim());

    var valueEl = document.createElement('span');
    valueEl.className = 'cselect-value';
    trigger.appendChild(valueEl);

    var list = document.createElement('ul');
    list.className = 'cselect-list';
    list.setAttribute('role', 'listbox');

    var items = [];
    Array.prototype.forEach.call(select.options, function (opt, idx) {
      var li = document.createElement('li');
      li.className = 'cselect-opt';
      li.setAttribute('role', 'option');
      li.textContent = opt.textContent;
      li.addEventListener('click', function () {
        select.selectedIndex = idx;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close();
        trigger.focus();
      });
      list.appendChild(li);
      items.push(li);
    });

    wrap.appendChild(trigger);
    wrap.appendChild(list);
    wrap.classList.add('is-enhanced');

    var active = -1;

    function syncFromNative() {
      var sel = select.options[select.selectedIndex];
      valueEl.textContent = sel ? sel.textContent : '';
      valueEl.title = sel && sel.value ? sel.textContent : '';
      valueEl.classList.toggle('is-placeholder', !sel || sel.value === '');
      items.forEach(function (li, i) {
        li.setAttribute('aria-selected', i === select.selectedIndex ? 'true' : 'false');
      });
    }

    function setActive(i) {
      active = i;
      items.forEach(function (li, idx) { li.classList.toggle('is-active', idx === i); });
      if (items[i]) items[i].scrollIntoView({ block: 'nearest' });
    }

    function onDoc(e) { if (!wrap.contains(e.target)) close(); }

    function open() {
      if (wrap.classList.contains('is-open')) return;
      wrap.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      setActive(select.selectedIndex);
      document.addEventListener('click', onDoc);
    }
    function close() {
      if (!wrap.classList.contains('is-open')) return;
      wrap.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('click', onDoc);
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      wrap.classList.contains('is-open') ? close() : open();
    });
    trigger.addEventListener('keydown', function (e) {
      var open_ = wrap.classList.contains('is-open');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!open_) { open(); return; }
      }
      if (e.key === 'ArrowDown') setActive(Math.min(items.length - 1, active + 1));
      else if (e.key === 'ArrowUp') setActive(Math.max(0, active - 1));
      else if (e.key === 'Home') setActive(0);
      else if (e.key === 'End') setActive(items.length - 1);
      else if (e.key === 'Enter' || e.key === ' ') {
        if (active >= 0) { select.selectedIndex = active; select.dispatchEvent(new Event('change', { bubbles: true })); close(); }
      } else if (e.key === 'Escape') { close(); }
    });

    select.addEventListener('change', syncFromNative);
    var form = select.closest('form');
    if (form) form.addEventListener('reset', function () { setTimeout(syncFromNative, 0); });

    syncFromNative();
  }

  function initSelects(root) {
    var scope = root || document;
    scope.querySelectorAll('.field select').forEach(enhanceSelect);
  }
  window.initSelects = initSelects;

  function initWowEffects() {
    initScrollProgress();
    initBackToTop();
    initSplitText();
    initGlyphDraw();
    initParallax();
    initCountUp();
    initMagnetic();
    initMarquee();
    initGrain();
    initTouchFeedback();
    initPageTransition();
  }

  // Подключаем cookies.js на всех страницах (баннер + согласия).
  (function bootCookies() {
    if (window.SiteCookies || document.querySelector('script[src*="cookies.js"]')) return;
    var link = document.querySelector('link[href*="base.css"]');
    if (!link) return;
    var root = (link.getAttribute('href') || '').replace(/assets\/css\/base\.css.*$/, '');
    var s = document.createElement('script');
    s.src = root + 'assets/js/cookies.js';
    document.head.appendChild(s);
  })();

  // Штору впрыскиваем максимально рано (скрипт стоит в конце body),
  // чтобы избежать вспышки контента до «открытия».
  injectCurtain();

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('meta[name="theme-color"]')) {
      var theme = document.createElement('meta');
      theme.name = 'theme-color';
      theme.content = '#081f1b';
      document.head.appendChild(theme);
    }
    // Подстраховка: снимаем ранний тёмный «мост» в любом случае (в т.ч. при
    // prefers-reduced-motion, когда injectCurtain выходит раньше) — иначе экран
    // может остаться под тёмной заглушкой.
    try { document.documentElement.classList.remove('pc-cover'); } catch (_) {}
    renderHeader();
    renderFooter();
    initHeaderBehaviour();
    if (window.SiteContent && window.SiteContent.applyGlobals) {
      window.SiteContent.applyGlobals();
    }
    if (window.SiteForms && window.SiteForms.init) {
      window.SiteForms.init();
    }
    initConsentLinks();
    initConsentCheckboxes();
    initSelects();
    initHeroChoreography();
    initReveal();
    initWowEffects();
    initModulesList();
  });
})();
