import json
import re
import ssl
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PODCAST_JSON = ROOT / "content" / "podcast.json"
OUT_DIR = ROOT / "assets" / "img" / "podcast" / "episodes"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "ru-RU,ru;q=0.9",
}


def get(url: str, referer: str | None = None) -> bytes:
    headers = dict(HEADERS)
    if referer:
        headers["Referer"] = referer
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=30, context=CTX).read()


def poster_from_embed(embed_url: str) -> str | None:
    html = get(embed_url).decode("utf-8", "replace")
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
        if not slug or not embed:
            continue
        try:
            time.sleep(1.5)
            poster = poster_from_embed(embed)
            if not poster:
                print("no poster", slug)
                continue
            time.sleep(0.5)
            img = get(poster, referer="https://vkvideo.ru/")
            dest = OUT_DIR / f"{slug}.jpg"
            dest.write_bytes(img)
            item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
            ok += 1
            print("ok", slug, len(img))
        except Exception as err:
            print("fail", slug, err)
    PODCAST_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("done", ok)


if __name__ == "__main__":
    main()
