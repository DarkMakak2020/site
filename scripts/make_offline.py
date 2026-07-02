#!/usr/bin/env python3
"""Сделать сайт открываемым двойным кликом (file://) и при этом сохранить работу на сервере.

Что делает:
1. Генерирует content/bundle.js — все JSON-данные в window.__CONTENT__ (обход блокировки fetch под file://).
2. Во все *.html: абсолютные пути (/assets, /about/ ...) -> относительные с учётом глубины,
   ссылки на папки получают явный index.html, и подключается bundle.js перед content.js.

Скрипт идемпотентный: повторный запуск не ломает уже сконвертированные файлы.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # .../site
CONTENT = ROOT / "content"

JSON_FILES = ["site", "excursions", "podcast", "books", "journal"]

ATTR_RE = re.compile(r'(?P<attr>\b(?:href|src))="/(?P<val>[^"]*)"')


def build_bundle() -> None:
    lines = ["// АВТОГЕНЕРАЦИЯ (scripts/make_offline.py). Не редактировать вручную.",
             "window.__CONTENT__ = window.__CONTENT__ || {};"]
    for stem in JSON_FILES:
        fp = CONTENT / f"{stem}.json"
        if not fp.exists():
            continue
        data = json.loads(fp.read_text(encoding="utf-8"))
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
        lines.append(f'window.__CONTENT__["{stem}"] = {payload};')
    out = CONTENT / "bundle.js"
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"bundle.js: {out.stat().st_size // 1024} KB ({len(JSON_FILES)} наборов)")


def depth_of(html_path: Path) -> int:
    rel = html_path.relative_to(ROOT)
    return len(rel.parts) - 1  # минус сам файл


def transform_value(val: str, prefix: str) -> str:
    # пропускаем протокол-относительные //host
    if val.startswith("/"):
        return None  # сигнал: не трогать (исходник был //...)
    # отделяем ?query / #hash
    m = re.search(r"[?#]", val)
    base, suffix = (val, "")
    if m:
        base, suffix = val[: m.start()], val[m.start():]
    if base == "":
        base = "index.html"
    elif base.endswith("/"):
        base = base + "index.html"
    return prefix + base + suffix


def convert_html(html_path: Path) -> None:
    text = html_path.read_text(encoding="utf-8")
    depth = depth_of(html_path)
    prefix = "../" * depth  # depth 0 -> ""

    # 1) подключить bundle.js перед content.js (один раз)
    if "content/bundle.js" not in text and "/assets/js/content.js" in text:
        text = text.replace(
            '<script src="/assets/js/content.js"',
            '<script src="/content/bundle.js" defer></script>\n  '
            '<script src="/assets/js/content.js"',
            1,
        )

    # 2) абсолютные href/src -> относительные
    def repl(mm: re.Match) -> str:
        attr, val = mm.group("attr"), mm.group("val")
        new = transform_value(val, prefix)
        if new is None:
            return mm.group(0)
        return f'{attr}="{new}"'

    text = ATTR_RE.sub(repl, text)
    html_path.write_text(text, encoding="utf-8")
    print(f"  {html_path.relative_to(ROOT)} (depth {depth})")


def main() -> None:
    print("=== bundle ===")
    build_bundle()
    print("=== seo ===")
    import subprocess
    import sys
    subprocess.run([sys.executable, str(ROOT / "scripts" / "apply_seo.py")], check=True)
    print("=== html ===")
    for hp in sorted(ROOT.rglob("*.html")):
        convert_html(hp)
    print("Готово.")


if __name__ == "__main__":
    main()
