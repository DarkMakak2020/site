#!/usr/bin/env python3
"""Дополняет базовое SEO во всех публичных HTML и пересобирает sitemap.xml.

Запуск из корня site/:  python scripts/apply_seo.py
Перед деплоем замените siteUrl в content/site.json на реальный домен и перезапустите скрипт.
"""
from __future__ import annotations

import json
import re
from datetime import date
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / "content"
SITE_JSON = CONTENT / "site.json"

SKIP_HTML = {"admin/index.html"}

STATIC_PAGES = [
    ("index.html", "1.0", None),
    ("kod-mesta/index.html", "0.9", None),
    ("kod-mesta/excursions/index.html", "0.8", None),
    ("kod-mesta/podcast/index.html", "0.8", None),
    ("strateg/index.html", "0.9", None),
    ("coach/index.html", "0.9", None),
    ("praktikum-hr/index.html", "0.9", None),
    ("books/index.html", "0.8", None),
    ("about/index.html", "0.7", None),
    ("journal/index.html", "0.7", None),
    ("contacts/index.html", "0.7", None),
    ("privacy/index.html", "0.3", None),
]


def load_seo() -> dict:
    data = json.loads(SITE_JSON.read_text(encoding="utf-8"))
    seo = data.get("seo", {})
    site_url = seo.get("siteUrl", "https://example.com").rstrip("/")
    og_image = seo.get("defaultOgImage", "/assets/img/og-default.svg")
    if og_image.startswith("/"):
        og_image = site_url + og_image
    return {
        "siteUrl": site_url,
        "siteName": seo.get("siteName", "Елена Бочарова · КОД МЕСТА"),
        "defaultOgImage": og_image,
        "locale": seo.get("locale", "ru_RU"),
        "author": seo.get("author", "Елена Бочарова"),
        "themeColor": seo.get("themeColor", "#081f1b"),
    }


def page_url(seo: dict, rel: str) -> str:
    if rel == "journal/article.html":
        return seo["siteUrl"] + "/journal/article.html"
    parts = Path(rel).parts[:-1]
    if not parts:
        return seo["siteUrl"] + "/"
    return seo["siteUrl"] + "/" + "/".join(parts) + "/"


def extract_tag_content(html: str, name: str | None = None, prop: str | None = None) -> str:
    if prop:
        m = re.search(rf'<meta\s+property="{re.escape(prop)}"\s+content="([^"]*)"', html)
    else:
        m = re.search(rf'<meta\s+name="{re.escape(name)}"\s+content="([^"]*)"', html)
    if m:
        return m.group(1)
    if name == "description":
        m = re.search(r"<title>([^<]*)</title>", html)
        return m.group(1).strip() if m else ""
    return ""


def has_tag(html: str, needle: str) -> bool:
    return needle in html


def insert_before_assets(html: str, block: str) -> str:
    markers = (
        '<link rel="preconnect"',
        '<link href="https://api.fontshare',
        '<link rel="stylesheet"',
        '<script type="application/ld+json"',
    )
    for marker in markers:
        idx = html.find(marker)
        if idx != -1:
            return html[:idx] + block + html[idx:]
    return html.replace("</head>", block + "</head>", 1)


def fix_og_image(html: str, seo: dict) -> str:
    def repl(m: re.Match) -> str:
        val = m.group(1)
        if val.startswith("http"):
            return m.group(0)
        if val.startswith("/"):
            val = seo["siteUrl"] + val
        return f'<meta property="og:image" content="{val}"'

    return re.sub(r'<meta property="og:image" content="([^"]*)"', repl, html)


def ensure_meta(html: str, line: str, identifier: str) -> str:
    if identifier in html:
        return html
    return insert_before_assets(html, line + "\n")


def ensure_seo_script(html: str, depth: int) -> str:
    prefix = "../" * depth
    rel_src = f'{prefix}assets/js/seo.js'
    if f'src="{rel_src}"' in html or 'src="/assets/js/seo.js"' in html:
        return html
    pairs = [
        (f'<script src="{prefix}content/bundle.js"', f'<script src="{rel_src}" defer></script>\n  <script src="{prefix}content/bundle.js"'),
        ('<script src="/content/bundle.js"', f'<script src="{rel_src}" defer></script>\n  <script src="/content/bundle.js"'),
        (f'<script src="{prefix}assets/js/content.js"', f'<script src="{rel_src}" defer></script>\n  <script src="{prefix}assets/js/content.js"'),
        ('<script src="/assets/js/content.js"', f'<script src="{rel_src}" defer></script>\n  <script src="/assets/js/content.js"'),
    ]
    for old, new in pairs:
        if old in html:
            return html.replace(old, new, 1)
    return html


def extend_public_page(html: str, seo: dict, rel: str) -> str:
    url = page_url(seo, rel)
    title = re.search(r"<title>([^<]*)</title>", html)
    title_text = title.group(1).strip() if title else ""
    desc = extract_tag_content(html, name="description")
    og_title = extract_tag_content(html, prop="og:title") or title_text
    og_desc = extract_tag_content(html, prop="og:description") or desc
    image = seo["defaultOgImage"]

    html = fix_og_image(html, seo)

    if not has_tag(html, 'property="og:title"'):
        html = ensure_meta(html, f'  <meta property="og:title" content="{og_title}" />', 'property="og:title"')
    if not has_tag(html, 'property="og:description"'):
        html = ensure_meta(html, f'  <meta property="og:description" content="{og_desc}" />', 'property="og:description"')
    if not has_tag(html, 'property="og:type"'):
        html = ensure_meta(html, '  <meta property="og:type" content="website" />', 'property="og:type"')
    if not has_tag(html, 'property="og:url"'):
        html = ensure_meta(html, f'  <meta property="og:url" content="{url}" />', 'property="og:url"')
    if not has_tag(html, 'property="og:image"'):
        html = ensure_meta(html, f'  <meta property="og:image" content="{image}" />', 'property="og:image"')

    html = ensure_meta(html, '  <meta name="robots" content="index, follow" />', 'name="robots"')
    html = ensure_meta(html, f'  <meta name="author" content="{seo["author"]}" />', 'name="author"')
    html = ensure_meta(html, f'  <meta name="theme-color" content="{seo["themeColor"]}" />', 'name="theme-color"')
    html = ensure_meta(html, f'  <meta property="og:locale" content="{seo["locale"]}" />', 'property="og:locale"')
    html = ensure_meta(html, f'  <meta property="og:site_name" content="{seo["siteName"]}" />', 'property="og:site_name"')
    html = ensure_meta(html, '  <meta name="twitter:card" content="summary_large_image" />', 'name="twitter:card"')
    html = ensure_meta(html, f'  <meta name="twitter:title" content="{og_title}" />', 'name="twitter:title"')
    html = ensure_meta(html, f'  <meta name="twitter:description" content="{og_desc}" />', 'name="twitter:description"')
    html = ensure_meta(html, f'  <meta name="twitter:image" content="{image}" />', 'name="twitter:image"')

    if not has_tag(html, 'hreflang="ru"'):
        block = f'  <link rel="alternate" hreflang="ru" href="{url}" />\n  <link rel="alternate" hreflang="x-default" href="{url}" />\n'
        html = insert_before_assets(html, block)

    return html


def process_privacy(html: str, seo: dict) -> str:
    url = page_url(seo, "privacy/index.html")
    title = "Политика конфиденциальности · Елена Бочарова"
    desc = extract_tag_content(html, name="description")
    block = f"""  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="{seo['defaultOgImage']}" />
"""
    if 'property="og:title"' not in html:
        html = insert_before_assets(html, block)
    return extend_public_page(html, seo, "privacy/index.html")


def process_404(html: str, seo: dict) -> str:
    desc = "Страница не найдена на сайте Елены Бочарова. Вернитесь на главную или выберите направление: метод КОД МЕСТА, стратегия, коучинг, практикум HR."
    if 'name="description"' not in html:
        html = html.replace(
            '<meta name="robots" content="noindex" />',
            f'<meta name="description" content="{desc}" />\n  <meta name="robots" content="noindex, nofollow" />',
            1,
        )
    elif 'noindex, nofollow' not in html:
        html = html.replace(
            '<meta name="robots" content="noindex" />',
            '<meta name="robots" content="noindex, nofollow" />',
            1,
        )
    html = ensure_meta(html, f'  <meta name="theme-color" content="{seo["themeColor"]}" />', 'name="theme-color"')
    return html


def process_article(html: str, seo: dict) -> str:
    url = seo["siteUrl"] + "/journal/article.html"
    title = "Статья · Журнал · Елена Бочарова"
    desc = extract_tag_content(html, name="description")
    extras = f"""  <link rel="canonical" href="{url}" />
  <meta property="og:title" content="{title}" />
  <meta property="og:description" content="{desc}" />
  <meta property="og:url" content="{url}" />
"""
    if 'rel="canonical"' not in html:
        html = html.replace(
            '<meta property="og:type" content="article" />',
            extras + '  <meta property="og:type" content="article" />',
            1,
        )
    html = fix_og_image(html, seo)
    html = extend_public_page(html, seo, "journal/article.html")
    html = re.sub(
        r'<link rel="alternate" hreflang="ru" href="[^"]*" />',
        f'<link rel="alternate" hreflang="ru" href="{url}" />',
        html,
        count=1,
    )
    html = re.sub(
        r'<link rel="alternate" hreflang="x-default" href="[^"]*" />',
        f'<link rel="alternate" hreflang="x-default" href="{url}" />',
        html,
        count=1,
    )
    return html


def add_website_jsonld(html: str, seo: dict) -> str:
    if '"@type": "WebSite"' in html or '"@type":"WebSite"' in html:
        return html
    block = f"""
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "{seo['siteName']}",
    "url": "{seo['siteUrl']}/",
    "description": "Официальный сайт Елены Бочаровой — автор метода КОД МЕСТА. Стратегия, коучинг, HR, экскурсии, книги, журнал.",
    "inLanguage": "ru-RU",
    "publisher": {{ "@type": "Person", "name": "{seo['author']}" }}
  }}
  </script>
"""
    return html.replace("</head>", block + "</head>", 1)


def process_html(path: Path, seo: dict) -> None:
    rel = str(path.relative_to(ROOT)).replace("\\", "/")
    if rel in SKIP_HTML:
        return
    html = path.read_text(encoding="utf-8")
    depth = len(path.relative_to(ROOT).parts) - 1

    if rel == "404.html":
        html = process_404(html, seo)
    elif rel == "privacy/index.html":
        html = process_privacy(html, seo)
    elif rel == "journal/article.html":
        html = process_article(html, seo)
    elif "noindex" not in html or 'name="robots" content="noindex"' not in html:
        html = extend_public_page(html, seo, rel)
        if rel == "index.html":
            html = add_website_jsonld(html, seo)

    if rel != "404.html":
        html = ensure_seo_script(html, depth)
    path.write_text(html, encoding="utf-8")
    print(f"  SEO: {rel}")


def build_sitemap(seo: dict) -> None:
    journal_path = CONTENT / "journal.json"
    articles: list[dict] = []
    if journal_path.exists():
        jdata = json.loads(journal_path.read_text(encoding="utf-8"))
        articles = [i for i in jdata.get("items", []) if i.get("published", True)]

    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for rel, priority, lastmod in STATIC_PAGES:
        loc = page_url(seo, rel)
        url_el = ET.SubElement(urlset, "url")
        ET.SubElement(url_el, "loc").text = loc
        ET.SubElement(url_el, "priority").text = priority
        if lastmod:
            ET.SubElement(url_el, "lastmod").text = lastmod

    for item in articles:
        slug = item.get("slug")
        if not slug:
            continue
        loc = f'{seo["siteUrl"]}/journal/article.html?slug={slug}'
        url_el = ET.SubElement(urlset, "url")
        ET.SubElement(url_el, "loc").text = loc
        ET.SubElement(url_el, "priority").text = "0.6"
        if item.get("date"):
            ET.SubElement(url_el, "lastmod").text = item["date"]

    tree = ET.ElementTree(urlset)
    ET.indent(tree, space="  ")
    out = ROOT / "sitemap.xml"
    tree.write(out, encoding="UTF-8", xml_declaration=True)
    # ElementTree не ставит standalone — перечитаем и добавим комментарий
    text = out.read_text(encoding="utf-8")
    if "example.com" in seo["siteUrl"]:
        comment = "<!-- Замените example.com в content/site.json на реальный домен и перезапустите apply_seo.py -->\n"
        if comment.strip() not in text:
            text = text.replace(
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ' + comment.strip(),
                1,
            )
    out.write_text(text, encoding="utf-8")
    print(f"  sitemap.xml: {len(STATIC_PAGES) + len(articles)} URL")


def main() -> None:
    seo = load_seo()
    print(f"siteUrl: {seo['siteUrl']}")
    print("=== HTML ===")
    for hp in sorted(ROOT.rglob("*.html")):
        process_html(hp, seo)
    print("=== sitemap ===")
    build_sitemap(seo)
    print("Готово.")


if __name__ == "__main__":
    main()
