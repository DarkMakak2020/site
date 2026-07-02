import json, re, ssl, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "content/podcast.json").read_text(encoding="utf-8"))
OUT = ROOT / "assets/img/podcast/episodes"
OUT.mkdir(parents=True, exist_ok=True)
CTX = ssl.create_default_context(); CTX.check_hostname=False; CTX.verify_mode=ssl.CERT_NONE
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"

def get(url, referer=None):
    h = {"User-Agent": UA, "Accept-Language": "ru-RU,ru;q=0.9"}
    if referer: h["Referer"] = referer
    return urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=30, context=CTX).read()

def poster(embed):
    html = get(embed).decode("utf-8", "replace")
    urls = [u.replace("\\/", "/") for u in re.findall(r"https:\\\\/\\\\/iv\.okcdn\.ru\\\\/getVideoPreview[^\"']+", html)]
    for pref in ("fn=vid_w", "fn=vid_md", "fn=vid_f"):
        for u in urls:
            if pref in u: return u
    return urls[0] if urls else None

ok = 0
for item in data["items"]:
    slug, embed = item.get("slug"), item.get("embedUrl")
    if not slug or not embed or item.get("published") is False:
        continue
    dest = OUT / f"{slug}.jpg"
    if dest.exists() and dest.stat().st_size > 1000:
        item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
        ok += 1
        print("keep", slug)
        continue
    for attempt in range(3):
        try:
            time.sleep(2 + attempt)
            url = poster(embed)
            if not url:
                raise RuntimeError("no poster url")
            time.sleep(1)
            img = get(url, referer="https://vkvideo.ru/")
            if len(img) < 1000:
                raise RuntimeError(f"small file {len(img)}")
            dest.write_bytes(img)
            item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
            ok += 1
            print("ok", slug, len(img))
            break
        except Exception as e:
            print("try", attempt + 1, slug, e)
    else:
        print("FAIL", slug)

(ROOT / "content/podcast.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("saved", ok)
