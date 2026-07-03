#!/usr/bin/env python3
"""Сделать внешние шрифты неблокирующими (media=print onload)."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPLACEMENTS = [
    (
        'href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap" rel="stylesheet" />',
        'href="https://api.fontshare.com/v2/css?f[]=switzer@300,400,500,600&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />',
    ),
    (
        'family=Cormorant:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />',
        'family=Cormorant:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />',
    ),
    (
        'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" />',
        'family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet" media="print" onload="this.media=\'all\'" />',
    ),
]

for path in ROOT.rglob("*.html"):
    if "admin" in path.parts:
        continue
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("patched", path.relative_to(ROOT))
