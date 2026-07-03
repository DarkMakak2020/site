#!/usr/bin/env python3
"""pc-cover на всех публичных страницах (не только index)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PC = (
    '  <style>html.pc-cover::before{content:"";position:fixed;inset:0;z-index:700;background:#081f1b}</style>\n'
    '  <script>try{if(sessionStorage.getItem(\'pc-transit\')===\'1\')document.documentElement.classList.add(\'pc-cover\')}catch(e){}</script>\n'
)

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    if "html.pc-cover::before" in text:
        continue
    needle = '  <meta charset="UTF-8" />\n'
    if needle not in text:
        continue
    text = text.replace(needle, needle + PC, 1)
    path.write_text(text, encoding="utf-8")
    print("pc-cover:", path.relative_to(ROOT))
