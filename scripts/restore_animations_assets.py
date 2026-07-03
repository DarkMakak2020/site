#!/usr/bin/env python3
"""Вернуть pc-cover мост и неблокирующие шрифты во все публичные HTML."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PC_COVER = (
    '  <style>html.pc-cover::before{content:"";position:fixed;inset:0;z-index:700;background:#081f1b}</style>\n'
    '  <script>try{if(sessionStorage.getItem(\'pc-transit\')===\'1\')document.documentElement.classList.add(\'pc-cover\')}catch(e){}</script>\n'
)

FONTS = (
    '<link rel="preconnect" href="https://api.fontshare.com" crossorigin />\n'
    '  <link rel="preconnect" href="https://fonts.googleapis.com" />\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
    '  <link href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />\n'
    '  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cormorant:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />\n'
)

MARKER = '  <link rel="stylesheet" href="'
MARKER_ROOT = '  <link rel="stylesheet" href="assets/css/base.css" />'
MARKER_NESTED = '  <link rel="stylesheet" href="../assets/css/base.css" />'

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text

    if "html.pc-cover::before" not in text and "identity-invite-redirect.js" in text:
        text = text.replace(
            '  <script src="assets/js/identity-invite-redirect.js"></script>\n',
            '  <script src="assets/js/identity-invite-redirect.js"></script>\n' + PC_COVER,
        )
        text = text.replace(
            '  <script src="../assets/js/identity-invite-redirect.js"></script>\n',
            '  <script src="../assets/js/identity-invite-redirect.js"></script>\n' + PC_COVER.replace(
                'assets/js', '../assets/js'
            ),
        )

    if "api.fontshare.com" not in text:
        if MARKER_ROOT in text:
            text = text.replace(MARKER_ROOT, FONTS + MARKER_ROOT)
        elif MARKER_NESTED in text:
            nested_fonts = FONTS.replace('href="assets/', 'href="../assets/')  # no-op for fonts
            text = text.replace(MARKER_NESTED, nested_fonts + MARKER_NESTED)

    text = text.replace("style.css?v=20260704", "style.css?v=20260705")

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("restored:", path.relative_to(ROOT))
