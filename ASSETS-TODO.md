# Ассеты (фото, обложки, логотипы, документы)

Сейчас на сайте подключены реальные изображения с Яндекс.Диска (обработаны скриптом `scripts/fetch_assets.py`:
единый стиль «тихая роскошь» — лёгкая десатурация, изумрудно-бордовый overlay, webp).

Чтобы обновить ассеты повторно: `python site/scripts/fetch_assets.py`

## Куда класть (структура папок)

```
site/assets/img/
├── elena/        — портреты Елены
├── excursions/   — обложки и галереи маршрутов
├── podcast/      — обложки подкаста
├── books/        — обложки книг
├── logos/        — логотипы клиентов
└── documents/    — дипломы, сертификаты, отзывы
```

После добавления файла пропишите путь в соответствующем JSON (`site/content/*.json`, поле `cover`)
или прямо в HTML. Имена файлов в JSON уже можно заполнять заранее.

---

## elena/ — портреты  ·  источник: https://disk.yandex.ru/d/0Yrcn5bt8FaGDA
- `Елена.jpeg` — главный портрет для hero / блока личного бренда (оформить в премиальной рамке, затемнение, изумрудно-бордовый слой).
- `ЕленаГид.jpeg` — альтернатива для КОД МЕСТА и экскурсий (не в главный hero).
- `ЕленаГид_Бейдж.png` — доказательство аттестации, на /about или /kod-mesta/excursions (не в hero).

## excursions/ — маршруты  ·  источник: https://disk.yandex.ru/d/0Yrcn5bt8FaGDA
Обложки карточек (slug → файл):
- `biznes-kod-faberge-nobeli-putilov` → `БизнесКод.jpeg`
- `brilliantovaya-ulica-pervyy-biznes-hab` → `БМорская.webp` (предпочтительно) или `БМорская.jpeg`
- `ot-sennoy-do-senatskoy` → `Сенная.jpeg`
- `semeynyy-kod` → `СемейныйКод.jpeg`
- `petr-pervyy-lider-predprinimatelstva` → `Петр1.jpeg` (для карточки; `Петр.jpeg` — в галерею)

Галерея / внутренние страницы:
`БизнесКод2.jpeg`, `БизнесКод3.jpeg`, `БизнесКод4.jpeg`, `Петр2.jpeg`, `Петр3.jpeg`,
`СемейныйКод2..5.jpeg`, `Сенная2.jpeg`, `Сенная3.jpeg`, `Сенная5.jpeg`, `Сенная8.jpeg`.

Осторожно:
- `Петр4.jpeg` — может выглядеть менее премиально.
- `Сенная4.jpeg` — ярко-жёлтые цветы, конфликт с запретом жёлтого/оранжевого. Не использовать или сильно приглушить/кадрировать.

## podcast/ — обложки  ·  источник: https://disk.yandex.ru/d/0Yrcn5bt8FaGDA
- `КодМеста_Обложка1.jpeg`, `КодМеста_Обложка2.jpeg`, `КодМеста_Обложка3.png`
Ссылки на каналы уже подключены: VK https://vk.ru/kodmesta · Rutube https://rutube.ru/channel/73837855/ · MediaMetrics https://radio.mediametrics.ru/Kod%20mesta/

## books/ — обложки  ·  источник: см. фото-папку
- `russkiy-tramp-gosha-rudakov` → `КНИГА_Гоша Рудаков.png`
- `ya-zhenshchina-mission-itpossible` → `КНИГА_Я - Женщина.jpeg`
Ссылки: OZON https://ozon.ru/t/csQLFN6 · Wildberries (см. site.json).

## logos/ — клиенты  ·  источник: https://disk.yandex.ru/d/CuCiJ8S7v4kgY
Набор для первого trust-блока: L’Oréal, Air France, KLM, Parallels, Сбербанк / Сбербанк Страхование, РЖД, Открытие Страхование.
Файлы: `Logo_AF.jpg` (Air France), `Logo_parallelslogoRGBtagline.jpg` (Parallels), `Loreal.gif` (L’Oréal),
`Otkritie_strahovanie.jpg`, `RL_life.gif` (Raiffeisen Life), `ergo.jpg` (ERGO), `fitcurves.gif` (FitCurves),
`klm_head@2x.png` (KLM), `logo_RZD.jpg` (РЖД), `logo_Sberbank.png` (Сбербанк), `сбербанк страхование.jpg`.
Правила: grayscale/monochrome, opacity 55–70%, цвет только на hover, без белых подложек, не крупно.
ВАЖНО про GE: `logo_GE.png` отображается как синий квадрат — НЕ использовать; добавить GE только при корректном лого, иначе исключить.

## documents/ — дипломы и отзывы  ·  источник: https://disk.yandex.ru/d/VERRTUVLcZMwOQ
`Bocharova_Coach.pdf`, `Bocharova_MBA1.pdf`, `Bocharova_MBA2.pdf`, `Bocharova_RGPU.pdf`,
`Bocharova_Trainer.pdf`, `Рекомендация_L'Oreal.jpg`, `Бочарова_отзывы.docx`.
Использовать на /about как карточки «Смотреть подтверждения» (не выкладывать крупными картинками на главную).

---

## Арт-дирекшен (единый для всех ассетов)
Концепция «Тихая роскошь»: мягкое затемнение, изумрудно-бордовый overlay, выровненный контраст,
без ярко-жёлтых/оранжевых пятен, минимум визуального шума. Фото должны поддерживать смысл раздела.
