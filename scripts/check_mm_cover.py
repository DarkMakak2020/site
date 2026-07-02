import re
import struct
import urllib.request

def jpeg_size(data):
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            h = struct.unpack(">H", data[i + 5 : i + 7])[0]
            w = struct.unpack(">H", data[i + 7 : i + 9])[0]
            return w, h
        if marker in (0xD8, 0xD9):
            i += 2
            continue
        if marker == 0xDA:
            break
        seglen = struct.unpack(">H", data[i + 2 : i + 4])[0]
        i += 2 + seglen
    return None

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=20).read()

eid = "76003"
page = fetch(f"https://radio.mediametrics.ru/Kod%20mesta/{eid}/").decode("utf-8", "replace")
og = re.search(r'property="og:image" content="([^"]+)"', page)
archive = re.search(r"(https?://[^\"']*archive_ico[^\"']+)", page)
ico2 = "https://radio.mediametrics.ru/uploads/archive_ico2/2026/04/14/fff245a1b8398a3fe275be5c2988c8ee.jpeg"
print("og:image", og.group(1) if og else "—")
print("archive in page", archive.group(1) if archive else "—")
for label, url in [("archive_ico2", ico2), ("og:image", og.group(1) if og else None)]:
    if not url:
        continue
    data = fetch(url)
    sz = jpeg_size(data)
    print(label, url)
    print("  bytes", len(data), "size", sz)
