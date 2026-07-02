import ssl, urllib.request
embed = "https://vkvideo.ru/video_ext.php?oid=-69171694&id=456256687&hash=2df0e3664f2d7847"
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
for ref in ["https://radio.mediametrics.ru/", "https://vkvideo.ru/", None]:
    h = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0"}
    if ref: h["Referer"] = ref
    try:
        req = urllib.request.Request(embed, headers=h)
        data = urllib.request.urlopen(req, timeout=20, context=ctx).read()
        print("ok ref", ref, "len", len(data))
    except Exception as e:
        print("fail ref", ref, e)
