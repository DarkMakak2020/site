#!/usr/bin/env python3
"""Скачать ассеты с публичных папок Яндекс.Диска и привести фото к единому стилю."""
from __future__ import annotations

import json
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / "assets" / "img"
DOCS = ROOT / "assets" / "documents"

PHOTOS_KEY = "https://disk.yandex.ru/d/0Yrcn5bt8FaGDA"
LOGOS_KEY = "https://disk.yandex.ru/d/CuCiJ8S7v4kgY"
DOCS_KEY = "https://disk.yandex.ru/d/VERRTUVLcZMwOQ"


def api_list(public_key: str) -> list[dict]:
    url = (
        "https://cloud-api.yandex.net/v1/disk/public/resources?"
        f"public_key={urllib.parse.quote(public_key)}&limit=200"
    )
    with urllib.request.urlopen(url) as resp:
        data = json.load(resp)
    return data.get("_embedded", {}).get("items", [])


def download_href(public_key: str, remote_path: str) -> str:
    url = (
        "https://cloud-api.yandex.net/v1/disk/public/resources/download?"
        f"public_key={urllib.parse.quote(public_key)}&path={urllib.parse.quote(remote_path)}"
    )
    with urllib.request.urlopen(url) as resp:
        return json.load(resp)["href"]


def fetch_bytes(public_key: str, name: str) -> bytes:
    href = download_href(public_key, f"/{name}")
    with urllib.request.urlopen(href) as resp:
        return resp.read()


def to_rgb(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
        if img.mode == "P":
            img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, (8, 31, 27))
        bg.paste(img, mask=img.split()[-1])
        return bg
    if img.mode != "RGB":
        return img.convert("RGB")
    return img


def apply_overlay(img: Image.Image, strength: float = 1.0) -> Image.Image:
    """Изумрудно-бордовый градиент — «тихая роскошь»."""
    w, h = img.size
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grad)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(28 + t * 44)
        g = int(82 - t * 50)
        b = int(71 - t * 40)
        alpha = int((22 + t * 38) * strength)
        draw.line([(0, y), (w, y)], fill=(r, g, b, alpha))
    return Image.alpha_composite(img.convert("RGBA"), grad).convert("RGB")


def process_photo(
    raw: bytes,
    dest: Path,
    *,
    max_w: int,
    overlay: float = 1.0,
    fmt: str = "webp",
    quality: int = 82,
) -> None:
    img = to_rgb(Image.open(BytesIO(raw)))
    w, h = img.size
    if w > max_w:
        nh = max(1, int(h * max_w / w))
        img = img.resize((max_w, nh), Image.Resampling.LANCZOS)

    img = ImageEnhance.Color(img).enhance(0.9)
    img = ImageEnhance.Contrast(img).enhance(1.03)
    img = ImageEnhance.Brightness(img).enhance(0.97)

    if overlay > 0:
        img = apply_overlay(img, overlay)

    dest.parent.mkdir(parents=True, exist_ok=True)
    if fmt == "webp":
        img.save(dest, "WEBP", quality=quality, method=6)
    else:
        img.save(dest, "PNG", optimize=True)
    kb = dest.stat().st_size // 1024
    print(f"  ok {dest.relative_to(ROOT)} ({kb} KB)")


def save_raw(raw: bytes, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(raw)
    kb = dest.stat().st_size // 1024
    print(f"  ok {dest.relative_to(ROOT)} ({kb} KB)")


def main() -> None:
    # dest relative path -> (remote name, max_w, overlay strength 0..1, format)
    jobs: list[tuple[str, str, int, float, str]] = [
        ("elena/elena-hero.webp", "Елена.jpeg", 960, 0.85, "webp"),
        ("elena/elena-guide.webp", "ЕленаГид.jpeg", 960, 0.75, "webp"),
        ("excursions/biznes-kod-faberge-nobeli-putilov.webp", "БизнесКод.jpeg", 1280, 0.9, "webp"),
        ("excursions/brilliantovaya-ulica-pervyy-biznes-hab.webp", "БМорская.webp", 1280, 0.85, "webp"),
        ("excursions/ot-sennoy-do-senatskoy.webp", "Сенная.jpeg", 1280, 0.9, "webp"),
        ("excursions/semeynyy-kod.webp", "СемейныйКод.jpeg", 1280, 0.85, "webp"),
        ("excursions/petr-pervyy-lider-predprinimatelstva.webp", "Петр1.jpeg", 1280, 0.9, "webp"),
        ("podcast/kod-mesta-cover-1.webp", "КодМеста_Обложка1.jpeg", 960, 0.55, "webp"),
        ("podcast/kod-mesta-cover-2.webp", "КодМеста_Обложка2.jpeg", 960, 0.55, "webp"),
        ("podcast/kod-mesta-cover-3.webp", "КодМеста_Обложка3.png", 960, 0.45, "webp"),
        ("books/russkiy-tramp-gosha-rudakov.webp", "КНИГА_Гоша Рудаков.png", 720, 0.0, "webp"),
        ("books/ya-zhenshchina-mission-itpossible.webp", "КНИГА_Я - Женщина.jpeg", 720, 0.0, "webp"),
    ]

    print("=== Photos & covers ===")
    for rel, remote, max_w, overlay, fmt in jobs:
        print(remote, "->", rel)
        raw = fetch_bytes(PHOTOS_KEY, remote)
        process_photo(raw, IMG / rel, max_w=max_w, overlay=overlay, fmt=fmt)

    print("\n=== Badge (PNG) ===")
    raw = fetch_bytes(PHOTOS_KEY, "ЕленаГид_Бейдж.png")
    img = Image.open(BytesIO(raw))
    if img.mode == "RGBA":
        img.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
        save_dest = IMG / "elena/elena-badge.png"
        save_dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(save_dest, "PNG", optimize=True)
        print(f"  ok {save_dest.relative_to(ROOT)} ({save_dest.stat().st_size // 1024} KB)")
    else:
        save_raw(raw, IMG / "elena/elena-badge.png")

    print("\n=== Logos ===")
    logo_map = {
        "logo-af.jpg": "Logo_AF.jpg",
        "logo-parallels.jpg": "Logo_parallelslogoRGBtagline.jpg",
        "logo-loreal.gif": "Loreal.gif",
        "logo-otkritie.jpg": "Otkritie_strahovanie.jpg",
        "logo-raiffeisen-life.gif": "RL_life.gif",
        "logo-ergo.jpg": "ergo.jpg",
        "logo-fitcurves.gif": "fitcurves.gif",
        "logo-klm.png": "klm_head@2x.png",
        "logo-rzd.jpg": "logo_RZD.jpg",
        "logo-sberbank.png": "logo_Sberbank.png",
        "logo-sber-insurance.jpg": "сбербанк страхование.jpg",
    }
    for dest_name, remote in logo_map.items():
        print(remote, "->", dest_name)
        save_raw(fetch_bytes(LOGOS_KEY, remote), IMG / "logos" / dest_name)

    print("\n=== Documents ===")
    doc_files = [
        "Bocharova_Coach.pdf",
        "Bocharova_MBA1.pdf",
        "Bocharova_MBA2.pdf",
        "Bocharova_RGPU.pdf",
        "Bocharova_Trainer.pdf",
        "Рекомендация_L'Oreal.jpg",
    ]
    for name in doc_files:
        print(name)
        save_raw(fetch_bytes(DOCS_KEY, name), DOCS / name)

    print("\nDone.")


if __name__ == "__main__":
    main()
