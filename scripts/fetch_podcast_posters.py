"""Скачивает VK-превью (16:9, как в плеере MediaMetrics) для выпусков подкаста."""
import json
import re
import ssl
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PODCAST_JSON = ROOT / "content" / "podcast.json"
OUT_DIR = ROOT / "assets" / "img" / "podcast" / "episodes"

CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def fetch_embed_html(embed_url: str) -> str:
    try:
        proc = subprocess.run(
            ["curl.exe", "-sL", "-A", "Mozilla/5.0", embed_url],
            capture_output=True,
            timeout=30,
            check=True,
        )
        return proc.stdout.decode("utf-8", "replace")
    except (FileNotFoundError, subprocess.CalledProcessError):
        req = urllib.request.Request(embed_url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://radio.mediametrics.ru/"})
        return urllib.request.urlopen(req, timeout=25, context=CTX).read().decode("utf-8", "replace")


def fetch_bytes(url: str) -> bytes:
    try:
        proc = subprocess.run(
            ["curl.exe", "-sL", "-A", "Mozilla/5.0", url],
            capture_output=True,
            timeout=30,
            check=True,
        )
        return proc.stdout
    except (FileNotFoundError, subprocess.CalledProcessError):
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        return urllib.request.urlopen(req, timeout=25, context=CTX).read()


def vk_poster(embed_url: str) -> str | None:
    html = fetch_embed_html(embed_url)
    urls = re.findall(r"https:\\\\/\\\\/iv\.okcdn\.ru\\\\/getVideoPreview[^\"']+", html)
    if not urls:
        urls = re.findall(r"https://iv\.okcdn\.ru/getVideoPreview[^\"']+", html)
    if not urls:
        return None
    # Предпочитаем широкое превью (vid_w) или среднее (vid_md)
    for pref in ("fn=vid_w", "fn=vid_md", "fn=vid_f"):
        for u in urls:
            raw = u.replace("\\/", "/")
            if pref in raw:
                return raw
    return urls[0].replace("\\/", "/")


def ext_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path
    if path.endswith(".jpeg"):
        return ".jpeg"
    if path.endswith(".png"):
        return ".png"
    return ".jpg"


def main():
    data = json.loads(PODCAST_JSON.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    updated = 0

    for item in data.get("items", []):
        embed = item.get("embedUrl")
        slug = item.get("slug")
        if not embed or not slug:
            continue
        try:
            poster = vk_poster(embed)
        except Exception as err:
            print(f"[skip] {slug}: {err}")
            continue
        if not poster:
            print(f"[skip] {slug}: poster not found")
            continue
        ext = ext_from_url(poster)
        dest = OUT_DIR / f"{slug}{ext}"
        try:
            dest.write_bytes(fetch_bytes(poster))
        except Exception as err:
            print(f"[skip] {slug}: download {err}")
            continue
        item["cover"] = f"/assets/img/podcast/episodes/{slug}{ext}"
        updated += 1
        print(f"[ok] {slug} -> {dest.name}")

    PODCAST_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {updated} covers in {PODCAST_JSON.name}")


if __name__ == "__main__":
    main()
