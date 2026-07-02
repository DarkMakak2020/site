import re
import ssl
import urllib.request

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=20, context=ctx).read().decode("utf-8", "replace")

page = fetch("https://radio.mediametrics.ru/Kod%20mesta/76003/")
for pat in [
    r'property="og:image" content="([^"]+)"',
    r'(https?://[^"\']+\.(?:jpg|jpeg|png|webp))',
    r'poster[^"\']*["\']([^"\']+)["\']',
    r'getVideoPreview[^"\']+',
]:
    found = re.findall(pat, page, re.I)
    if found:
        print("===", pat[:40])
        for x in sorted(set(found))[:15]:
            print(x)

emb = re.search(r'iframe src="(https://vkvideo\.ru/video_ext\.php[^"]+)"', page)
if emb:
    iframe_url = emb.group(1)
    print("\niframe page")
    ip = fetch(iframe_url)
    imgs = re.findall(r'(https?://[^"\']+\.(?:jpg|jpeg|png|webp))', ip)
    for x in sorted(set(imgs))[:20]:
        print(x)
