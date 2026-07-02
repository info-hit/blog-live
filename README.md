# Blog Live

Standalone Vite-песочница для live preview HTML-верстки статей блога InfoHit.

Цель: верстальщик редактирует HTML-файл в `articles/`, браузер сразу показывает результат внутри полного HTML snapshot production-страницы блога.

Без Dify, без Bitrix API, без записи в базу. HTML страницы, header/footer и CSS/картинки берутся из production snapshot.

## Быстрый старт

```bash
pnpm install
pnpm dev
```

Открыть:

```text
http://localhost:5177/
```

В рабочем окружении InfoHit удобнее открыть:

```text
http://sm.info-hit.ru:5177/
```

## Статьи

Все статьи лежат в `articles/`:

```text
articles/main-example.html
articles/my-new-article.html
articles/drafts/longread.html
```

Создать новую статью:

```bash
pnpm article:new my-new-article
pnpm article:new drafts/longread
```

После создания/сохранения файла Vite обновит preview.

## Как пользоваться

1. Запустить `pnpm dev`.
2. Открыть preview страницу.
3. На начальной странице выбрать статью.
4. Откроется preview на всю ширину экрана с верхней панелью навигации.
5. Редактировать соответствующий файл в `articles/`.
6. Сохранять файл и смотреть live reload.

## Production snapshot

Preview строится из файла:

```text
src/snapshot/blog-page.html
```

Это скачанный HTML реальной страницы блога с production. В preview он открывается внутри `iframe srcdoc`.

В dev-режиме ресурсы страницы (`/bitrix`, `/local`, `/upload`, `/include`) проксируются Vite-сервером на:

```text
https://info-hit.ru/
```

Так шрифты, CSS, картинки и SVG остаются теми же, но для браузера грузятся с текущего dev-origin. Это важно для webfont: при прямой загрузке font-файлов с `https://info-hit.ru` внутри `srcdoc` браузер может заблокировать их по CORS и показать системный шрифт.

Обновить snapshot с любой статьи блога:

```bash
pnpm snapshot:pull https://info-hit.ru/blog/some-article-code/
```

Для безопасности runtime `<script>`/`<noscript>` из snapshot удаляются в браузере: нам нужны HTML/CSS/assets, но не production-аналитика и не пользовательские скрипты в dev-preview.

## Серверные маркеры

Маркеры вроде:

```text
#IMG1#
#COURSE_123#
#COURSES_N#
#GALLERY#
```

не рендерятся настоящими Bitrix-блоками. Песочница только подсвечивает их как заглушки.

Финальную проверку статьи с настоящими курсами, картинками, галереями и `result_modifier.php` нужно делать в реальном Bitrix preview/draft.

## Стили сайта

`src/styles/page-blog-new.snapshot.css` — snapshot текущего compiled CSS блога из монорепозитория:

```text
local/templates/info_hit_amp/css/page-blog-new.css
```

В монорепозитории InfoHit обновить snapshot можно так:

```bash
pnpm sync:site-css
```

Если пакет вынести в отдельный GitHub-репозиторий, snapshot CSS уже лежит внутри пакета и продолжит работать.

## Скрипты

```bash
pnpm dev          # Vite dev server, port 5177
pnpm build        # typecheck + production build
pnpm preview      # preview build, port 4177
pnpm article:new  # создать articles/<name>.html
pnpm snapshot:pull # скачать production HTML snapshot
pnpm sync:site-css
```
