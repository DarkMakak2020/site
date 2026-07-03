#!/usr/bin/env python3
"""Убрать внешние шрифты Fontshare/Google — сайт не должен от них зависеть."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = [
    re.compile(r'\s*<link rel="preconnect" href="https://api\.fontshare\.com" crossorigin />\n?', re.I),
    re.compile(r'\s*<link rel="preconnect" href="https://fonts\.googleapis\.com" />\n?', re.I),
    re.compile(r'\s*<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin />\n?', re.I),
    re.compile(
        r'\s*<link href="https://api\.fontshare\.com/v2/css\?[^"]+" rel="stylesheet"[^/]*/>\n?',
        re.I,
    ),
    re.compile(
        r'\s*<link href="https://fonts\.googleapis\.com/css2[^"]+" rel="stylesheet"[^/]*/>\n?',
        re.I,
    ),
]

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    for pat in PATTERNS:
        text = pat.sub("", text)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("fonts removed:", path.relative_to(ROOT))
