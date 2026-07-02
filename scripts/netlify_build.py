#!/usr/bin/env python3
"""Сборка на Netlify после правок контента в админке.

Обновляет content/bundle.js из JSON и пересобирает SEO/sitemap.
HTML не трогаем — на хостинге работают текущие относительные пути.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from make_offline import build_bundle  # noqa: E402


def main() -> None:
    print("=== Netlify build: bundle.js ===")
    build_bundle()
    seo = ROOT / "scripts" / "apply_seo.py"
    if seo.exists():
        print("=== Netlify build: SEO / sitemap ===")
        subprocess.run([sys.executable, str(seo)], check=True)
    print("Netlify build: готово.")


if __name__ == "__main__":
    main()
