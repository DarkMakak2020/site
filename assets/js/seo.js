/**
 * Базовое SEO: дополняет head на публичных страницах и обновляет мета для статей журнала.
 * Конфигурация — content/site.json → seo (через bundle.js).
 */
(function () {
  'use strict';

  var FALLBACK = {
    siteUrl: 'https://example.com',
    siteName: 'Елена Бочарова · КОД МЕСТА',
    defaultOgImage: '/assets/img/og-default.svg',
    locale: 'ru_RU',
    author: 'Елена Бочарова',
    themeColor: '#081f1b'
  };

  function getConfig() {
    var site = window.__CONTENT__ && window.__CONTENT__.site;
    var seo = (site && site.seo) || {};
    return {
      siteUrl: seo.siteUrl || FALLBACK.siteUrl,
      siteName: seo.siteName || FALLBACK.siteName,
      defaultOgImage: seo.defaultOgImage || FALLBACK.defaultOgImage,
      locale: seo.locale || FALLBACK.locale,
      author: seo.author || FALLBACK.author,
      themeColor: seo.themeColor || FALLBACK.themeColor,
      twitterSite: seo.twitterSite || ''
    };
  }

  function absUrl(path, cfg) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    var base = (cfg.siteUrl || '').replace(/\/$/, '');
    return base + (path.charAt(0) === '/' ? path : '/' + path);
  }

  function readMeta(name, prop) {
    var sel = prop
      ? 'meta[property="' + prop + '"]'
      : 'meta[name="' + name + '"]';
    var el = document.querySelector(sel);
    return el ? (el.getAttribute('content') || '') : '';
  }

  function upsertMeta(opts) {
    if (!opts.content) return;
    var sel = opts.property
      ? 'meta[property="' + opts.property + '"]'
      : 'meta[name="' + opts.name + '"]';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('meta');
      if (opts.property) el.setAttribute('property', opts.property);
      else el.setAttribute('name', opts.name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', opts.content);
  }

  function upsertLink(rel, href, hreflang) {
    if (!href) return;
    var sel = hreflang
      ? 'link[rel="' + rel + '"][hreflang="' + hreflang + '"]'
      : 'link[rel="' + rel + '"]:not([hreflang])';
    var el = document.querySelector(sel);
    if (!el) {
      el = document.createElement('link');
      el.rel = rel;
      if (hreflang) el.hreflang = hreflang;
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function upsertCanonical(href) {
    var el = document.querySelector('link[rel="canonical"]');
    if (!el) {
      el = document.createElement('link');
      el.rel = 'canonical';
      document.head.appendChild(el);
    }
    el.href = href;
  }

  function injectJsonLd(data, id) {
    var el = document.getElementById(id || 'site-jsonld-dynamic');
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id || 'site-jsonld-dynamic';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }

  function isNoindex() {
    var robots = readMeta('robots');
    return /noindex/i.test(robots);
  }

  function apply(opts) {
    opts = opts || {};
    var cfg = getConfig();
    var title = opts.title || document.title;
    var desc = opts.description || readMeta('description') || '';
    var canonical = document.querySelector('link[rel="canonical"]');
    var url = opts.url || (canonical && canonical.href) || cfg.siteUrl;
    var image = opts.image || readMeta(null, 'og:image') || cfg.defaultOgImage;
    image = absUrl(image, cfg);

    if (!opts.skipRobots && !isNoindex()) {
      upsertMeta({ name: 'robots', content: 'index, follow' });
    }
    upsertMeta({ name: 'author', content: cfg.author });
    upsertMeta({ name: 'theme-color', content: cfg.themeColor });

    upsertMeta({ property: 'og:locale', content: cfg.locale });
    upsertMeta({ property: 'og:site_name', content: cfg.siteName });
    if (title) upsertMeta({ property: 'og:title', content: opts.ogTitle || readMeta(null, 'og:title') || title });
    if (desc) upsertMeta({ property: 'og:description', content: opts.ogDescription || readMeta(null, 'og:description') || desc });
    if (url) upsertMeta({ property: 'og:url', content: url });
    upsertMeta({ property: 'og:image', content: image });

    upsertMeta({ name: 'twitter:card', content: 'summary_large_image' });
    if (cfg.twitterSite) upsertMeta({ name: 'twitter:site', content: cfg.twitterSite });
    if (title) upsertMeta({ name: 'twitter:title', content: title });
    if (desc) upsertMeta({ name: 'twitter:description', content: desc });
    upsertMeta({ name: 'twitter:image', content: image });

    if (url && !isNoindex()) {
      upsertLink('alternate', url, 'ru');
      upsertLink('alternate', url, 'x-default');
    }
  }

  function applyArticle(item, resolveAsset) {
    if (!item) return;
    var cfg = getConfig();
    var slug = item.slug || new URLSearchParams(location.search).get('slug') || '';
    var path = '/journal/article.html' + (slug ? '?slug=' + encodeURIComponent(slug) : '');
    var url = absUrl(path, cfg);
    var title = item.seoTitle || (item.title + ' · Журнал · Елена Бочарова');
    var desc = item.seoDescription || item.summary || '';
    var R = typeof resolveAsset === 'function' ? resolveAsset : function (p) { return p; };
    var image = item.cover ? absUrl(R(item.cover), cfg) : absUrl(cfg.defaultOgImage, cfg);

    document.title = title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    upsertCanonical(url);

    apply({
      title: title,
      description: desc,
      url: url,
      image: image,
      ogTitle: title,
      ogDescription: desc
    });

    upsertMeta({ property: 'og:type', content: 'article' });
    if (item.date) upsertMeta({ property: 'article:published_time', content: item.date });
    if (item.author) upsertMeta({ property: 'article:author', content: item.author });

    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      description: desc,
      datePublished: item.date || undefined,
      author: { '@type': 'Person', name: item.author || cfg.author },
      image: image,
      publisher: { '@type': 'Person', name: cfg.author },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      inLanguage: 'ru-RU'
    }, 'site-jsonld-article');
  }

  window.SiteSeo = {
    getConfig: getConfig,
    absUrl: function (path) { return absUrl(path, getConfig()); },
    apply: apply,
    applyArticle: applyArticle
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (isNoindex()) return;
    apply();
  });
})();
