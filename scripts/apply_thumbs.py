import json, ssl, urllib.request, time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTERS = Path(__file__).resolve().parent / "posters_thumbs.json"
OUT = ROOT / "assets/img/podcast/episodes"
PODCAST = ROOT / "content/podcast.json"
CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"

def dl(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://vkvideo.ru/", "Origin": "https://vkvideo.ru"})
    dest.write_bytes(urllib.request.urlopen(req, timeout=30, context=CTX).read())

posters = json.loads(POSTERS.read_text(encoding="utf-8"))
data = json.loads(PODCAST.read_text(encoding="utf-8"))
OUT.mkdir(parents=True, exist_ok=True)
for p in posters:
    dest = OUT / f"{p['slug']}.jpg"
    dl(p["url"], dest)
    for item in data["items"]:
        if item.get("slug") == p["slug"]:
            item["cover"] = f"/assets/img/podcast/episodes/{p['slug']}.jpg"
    print("ok", p["slug"])
PODCAST.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
