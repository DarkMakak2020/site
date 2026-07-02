import subprocess, re, json
from pathlib import Path

ROOT = Path(r"C:\Users\Admin\Desktop\КОД МЕСТА 2\site")
data = json.loads((ROOT / "content/podcast.json").read_text(encoding="utf-8"))
OUT = ROOT / "assets/img/podcast/episodes"
OUT.mkdir(parents=True, exist_ok=True)

def curl(url):
    p = subprocess.run(["curl.exe", "-sL", "-k", "-A", "Mozilla/5.0", url], capture_output=True, timeout=40)
    if p.returncode != 0:
        raise RuntimeError(f"curl rc={p.returncode} stderr={p.stderr.decode(errors='replace')[:300]}")
    return p.stdout

def poster_url(embed):
    html = curl(embed).decode("utf-8", "replace")
    urls = [u.replace("\\/", "/") for u in re.findall(r"https:\\\\/\\\\/iv\.okcdn\.ru\\\\/getVideoPreview[^\"']+", html)]
    for pref in ("fn=vid_w", "fn=vid_md", "fn=vid_f"):
        for u in urls:
            if pref in u:
                return u
    return urls[0] if urls else None

for item in data["items"]:
    embed = item.get("embedUrl")
    slug = item.get("slug")
    if not embed or not slug:
        continue
    try:
        url = poster_url(embed)
        if not url:
            print("no url", slug); continue
        img = curl(url)
        dest = OUT / f"{slug}.jpg"
        dest.write_bytes(img)
        item["cover"] = f"/assets/img/podcast/episodes/{slug}.jpg"
        print("ok", slug, len(img))
    except Exception as e:
        print("fail", slug, e)

(ROOT / "content/podcast.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
