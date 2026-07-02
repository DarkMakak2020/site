"""Скачивает полные VK-постеры (16:9 с нижней плашкой) для выпусков подкаста."""
import json
import re
import ssl
import struct
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PODCAST_JSON = ROOT / "content" / "podcast.json"
OUT_DIR = ROOT / "assets" / "img" / "podcast" / "episodes"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def jpeg_size(data: bytes):
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            i += 1
            continue
        m = data[i + 1]
        if m in (0xC0, 0xC1, 0xC2):
            h = struct.unpack(">H", data[i + 5 : i + 7])[0]
            w = struct.unpack(">H", data[i + 7 : i + 9])[0]
            return w, h
        if m in (0xD8, 0xD9):
            i += 2
            continue
        if m == 0xDA:
            break
        seg = struct.unpack(">H", data[i + 2 : i + 4])[0]
        i += 2 + seg
    return None


def fetch(url: str, referer: str | None = None) -> bytes:
    headers = {"User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9"}
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=30, context=CTX).read()


def poster_url(embed: str) -> str | None:
    html = fetch(embed).decode("utf-8", "replace")
    urls = [u.replace("\\/", "/") for u in re.findall(r"https:\\\\/\\\\/iv\.okcdn\.ru\\\\/getVideoPreview[^\"']+", html)]
    if not urls:
        urls = re.findall(r"https://iv\.okcdn\.ru/getVideoPreview[^\"']+", html)
    for pref in ("fn=vid_w", "fn=vid_md", "fn=vid_f"):
        for u in urls:
            if pref in u:
                return u
    return urls[0] if urls else None


def main():
    data = json.loads(PODCAST_JSON.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = 0

    for item in data.get("items", []):
        slug = item.get("slug")
        embed = item.get("embedUrl")
        if not slug or not embed or item.get("published") is False:
            continue
        dest = OUT_DIR / f"{slug}.jpg"
        try:
            time.sleep(4)
            url = poster_url(embed)
            if not url:
                print("skip (no url):", slug)
                continue
            time.sleep(1)
            img = fetch(url, referer="https://vkvideo.ru/")
            if len(img) < 5000:
                print("skip (small):", slug, len(img))
                continue
            sz = jpeg_size(img)
            dest.write_bytes(img)
            item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
            ok += 1
            print("ok", slug, sz, len(img))
        except Exception as err:
            print("fail", slug, err)

    PODCAST_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("saved", ok, "covers")


if __name__ == "__main__":
    main()
