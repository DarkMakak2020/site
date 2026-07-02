import ssl, sys, urllib.request
from pathlib import Path

url = sys.argv[1]
dest = Path(sys.argv[2])
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://vkvideo.ru/"})
data = urllib.request.urlopen(req, timeout=30, context=ctx).read()
dest.parent.mkdir(parents=True, exist_ok=True)
dest.write_bytes(data)
print(dest.name, len(data))
