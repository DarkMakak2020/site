#!/usr/bin/env python3
"""Убрать pc-cover заглушку из <head> — без JS она блокирует весь экран."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLE = '  <style>html.pc-cover::before{content:"";position:fixed;inset:0;z-index:700;background:#081f1b}</style>\n'
SCRIPT = '  <script>try{if(sessionStorage.getItem(\'pc-transit\')===\'1\')document.documentElement.classList.add(\'pc-cover\')}catch(e){}</script>\n'

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    text = text.replace(STYLE, "")
    text = text.replace(SCRIPT, "")
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("pc-cover removed:", path.relative_to(ROOT))
