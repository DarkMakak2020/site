import re, ssl, urllib.request
embed = "https://vkvideo.ru/video_ext.php?oid=-69171694&id=456256687&hash=2df0e3664f2d7847"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
h = urllib.request.urlopen(
    urllib.request.Request(embed, headers={"User-Agent": "Mozilla/5.0"}),
    context=ctx,
    timeout=20,
).read().decode("utf-8", "replace")
h2 = h.replace("\\/", "/")
for pat in [
    r"https://sun[^\"']+\.(?:jpg|jpeg|png|webp)",
    r"getVideoPreview\?[^\"']+",
    r'"thumb[^"]*"\s*:\s*"([^"]+)"',
    r"cover[^\"']{0,20}https://[^\"']+",
]:
    found = re.findall(pat, h2, re.I)
    if found:
        print("===", pat[:40])
        for x in sorted(set(found))[:8]:
            print(x[:140])

for idx in range(0, 8):
    if f"idx={idx}" in h2:
        print("has idx", idx)
