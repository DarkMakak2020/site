"""Скачивает постеры из scripts/posters.json и обновляет podcast.json."""
import json
import ssl
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "img" / "podcast" / "episodes"
POSTERS = Path(__file__).resolve().parent / "posters.json"
PODCAST = ROOT / "content" / "podcast.json"
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def download(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0", "Referer": "https://vkvideo.ru/"},
    )
    return urllib.request.urlopen(req, timeout=30, context=CTX).read()


def main():
    posters = json.loads(POSTERS.read_text(encoding="utf-8"))
    data = json.loads(PODCAST.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    by_slug = {p["slug"]: p["url"] for p in posters}

    for item in data.get("items", []):
        slug = item.get("slug")
        if slug not in by_slug or item.get("published") is False:
            continue
        dest = OUT / f"{slug}.jpg"
        img = download(by_slug[slug])
        dest.write_bytes(img)
        item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
        print("ok", slug, len(img))

    PODCAST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
