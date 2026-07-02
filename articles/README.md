# Articles

Каждая статья — отдельный HTML-файл.

Примеры:

```text
articles/main-example.html
articles/2026-07-new-course.html
articles/drafts/longread.html
```

Создать новый файл:

```bash
pnpm article:new my-new-article
pnpm article:new drafts/my-new-article
```

Во время `pnpm dev` список статей в браузере обновляется после сохранения/создания файла.
