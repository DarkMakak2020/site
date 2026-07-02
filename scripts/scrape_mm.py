import json
import re
import urllib.request

BASE = "https://radio.mediametrics.ru"
EPISODES = [
    ("76292", "Пейзаж Запахов", "25.06.2026", "/img/radio-broadcast-media-not-photo.jpg"),
    ("76233", "Автор Сценария — Ваша Квартира", "11.06.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/06/23/05817480d8a7a1cf72fc1d32d1b65c30.jpg"),
    ("76179", "Привычки Красоты", "28.05.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/05/26/38356c1a6c7d26230e02c3f5cc21f73c.jpg"),
    ("76113", "Все Переработается", "14.05.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/05/12/1847429373edfb361f340e5b84f42fd4.jpg"),
    ("76066", "В Кадре", "30.04.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/04/29/d28bd88c1cfe9e96446ef21531502c87.jpg"),
    ("76003", "Музыка Питер's", "16.04.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/04/14/fff245a1b8398a3fe275be5c2988c8ee.jpeg"),
    ("75926", "Меню Города", "02.04.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/03/30/1d0fd0b745fd413b332086ea0ea18bb4.jpg"),
    ("75855", "Право на Розы", "19.03.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/03/12/9ada2c919e6b62fc16289279312a155c.jpeg"),
    ("75811", "Археология Будущего", "05.03.2026", "https://radio.mediametrics.ru/uploads/archive_ico2/2026/03/05/ddce924103b57406eb666fd2a4bb5c18.jpg"),
    ("75770", "Код места: психология города", "19.02.2026", ""),
    ("75707", "Саквояж горожанки", "05.02.2026", ""),
]

out = []
for eid, title, date, cover in EPISODES:
    url = f"{BASE}/Kod%20mesta/{eid}/"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    page = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "replace")
    emb = re.search(r'<iframe src="(https://vkvideo\.ru/video_ext\.php[^"]+)"', page)
    og = re.search(r'property="og:description" content="([^"]+)"', page)
    ogimg = re.search(r'property="og:image" content="([^"]+)"', page)
    if not cover and ogimg:
        cover = ogimg.group(1)
    if cover.startswith("/"):
        cover = BASE + cover
    cover = cover.replace("http://", "https://")
    out.append({
        "id": eid,
        "title": title.strip(),
        "date": date,
        "url": url,
        "cover": cover,
        "embedUrl": emb.group(1) if emb else None,
        "summary": og.group(1) if og else "",
    })

with open(r"C:\Users\Admin\Desktop\КОД МЕСТА 2\site\content\mm-scraped.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=2)
