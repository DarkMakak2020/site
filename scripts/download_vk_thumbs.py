"""Скачивает обложки type=video_thumb из VK embed (как в плеере MM)."""
import json
import re
import ssl
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PODCAST = ROOT / "content" / "podcast.json"
OUT = ROOT / "assets" / "img" / "podcast" / "episodes"
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"


def fetch_embed(embed: str) -> str:
    req = urllib.request.Request(embed, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, timeout=30, context=CTX).read().decode("utf-8", "replace")


def best_thumb(html: str) -> str | None:
    html = html.replace("\\/", "/")
    urls = re.findall(r"https://sun[^\"']+type=video_thumb", html)
    if not urls:
        return None

    def area(u: str) -> int:
        m = re.search(r"size=(\d+)x(\d+)", u)
        if m:
            return int(m.group(1)) * int(m.group(2))
        if "quality=90&proxy=1" in u:
            return 10**9
        return 0

    return max(urls, key=area)


def download(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": "https://vkvideo.ru/", "Origin": "https://vkvideo.ru"},
    )
    return urllib.request.urlopen(req, timeout=30, context=CTX).read()


def main():
    data = json.loads(PODCAST.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    ok = 0
    for item in data.get("items", []):
        slug = item.get("slug")
        embed = item.get("embedUrl")
        if not slug or not embed or item.get("published") is False:
            continue
        dest = OUT / f"{slug}.jpg"
        try:
            time.sleep(3)
            thumb = best_thumb(fetch_embed(embed))
            if not thumb:
                print("skip", slug, "no thumb")
                continue
            img = download(thumb)
            if len(img) < 5000:
                print("skip", slug, "small", len(img))
                continue
            dest.write_bytes(img)
            item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
            ok += 1
            print("ok", slug, len(img), thumb[:80])
        except Exception as err:
            print("fail", slug, err)
    PODCAST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("done", ok)


if __name__ == "__main__":
    main()
