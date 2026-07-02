import json
import re
import urllib.request

BASE = "https://radio.mediametrics.ru"

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")

def vk_thumb(oid, vid):
    # VK get video page for og:image
    url = f"https://vk.com/video{oid}_{vid}"
    try:
        page = fetch(url)
        og = re.search(r'property="og:image" content="([^"]+)"', page)
        if og:
            return og.group(1)
    except Exception as e:
        return str(e)
    return None

page = fetch(f"{BASE}/Kod%20mesta/76003/")
emb = re.search(r'oid=(-?\d+)&id=(\d+)', page)
print("embed", emb.groups() if emb else None)
if emb:
    print("vk thumb", vk_thumb(emb.group(1), emb.group(2)))
