#!/usr/bin/env python3
"""Вернуть обычную (блокирующую) загрузку шрифтов — как в оригинале."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = ' rel="stylesheet" media="print" onload="this.media=\'all\'" />'
NEW = ' rel="stylesheet" />'

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    if OLD not in text:
        continue
    text = text.replace(OLD, NEW)
    text = text.replace("style.css?v=20260705", "style.css?v=20260706")
    path.write_text(text, encoding="utf-8")
    print("fonts:", path.relative_to(ROOT))
