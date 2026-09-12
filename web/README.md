# MoveMailbox — сайт

Next.js 15 (App Router) + React 19. Без Tailwind: вся стилизация — один
файл `app/globals.css` на CSS-переменных. Тема (светлая/тёмная) переключается
только переменными в `:root`, компоненты о цветах не знают.

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
npm run export     # сборка + копирование в ../internal/web/out
```

Node 20+. Сайт собирается в статику (`output: 'export'`) и вшивается
в Go-бинарь через `go:embed`. Как это подключено к бекенду — в
`INTEGRATION.md` в корне.

## Что где

```
app/                     страницы и метаданные
  page.tsx               главная: форма переноса → безопасность → остальное
  routes/                маршруты A → B + индекс всех 16 страниц
  migrate/[route]/       16 SSG-страниц маршрутов из data/migration-routes.ts
  guides/                гайды по провайдерам
  docs/errors/           разбор ошибок IMAP
  docs/errors/[code]/    7 SSG-страниц ошибок из data/imap-errors.ts
  pricing/ security/ download/ blog/
  privacy/ terms/        ⚠ содержат {{ПЛЕЙСХОЛДЕРЫ}}, см. ниже
  sitemap.ts robots.ts
components/
  sections/*.tsx         блоки страниц, один файл на секцию
  site-header/footer     шапка и подвал
  icon-sprite.tsx        SVG-спрайт, 31 символ, подключается как <use href="#ck" />
lib/
  seo.ts                 метаданные и генераторы JSON-LD
  workspace.ts           логика формы переноса (императивный порт из макета)
  guides.ts calculator.ts effects.ts
data/
  providers.ts           11 провайдеров: хосты, порты, пароли приложений
  migration-routes.ts    16 маршрутов с уникальными текстами
  imap-errors.ts         7 ошибок IMAP
public/brand/            логотип, фавиконки
```

`lib/workspace.ts`, `guides.ts`, `calculator.ts`, `effects.ts` — прямой порт
императивного JS из статического макета, помечены `// @ts-nocheck`.
Они вызываются из `useEffect` соответствующих клиентских компонентов.
При переписывании на React снимайте `@ts-nocheck`, а не добавляйте новый.

## Перед публикацией — обязательно

1. **`app/privacy/page.tsx` и `app/terms/page.tsx`** содержат `{{...}}`:
   юрлицо, контактный email, аналитика, условия возврата, применимое право.
   Заполните и поменяйте в метаданных `robots: { index: false }` на `true`.
2. **`lib/seo.ts` → `SITE`** — сейчас `https://movemailbox.com`.
   Если домен другой, поменяйте там: отсюда берутся canonical, OG и sitemap.
3. **`public/og.png`** — картинка для соцсетей 1735×909. Если её нет,
   ссылка на сайт будет разворачиваться без превью.
4. **API переноса.** Фронт ходит в `/api/check`, `/api/measure`, `/api/jobs`
   (см. объект `API` в `lib/workspace.ts`). Сайт и API на одном origin,
   поэтому пути относительные и CORS не нужен. Контракт — в `INTEGRATION.md`.

## Шрифты

Manrope, JetBrains Mono, Instrument Serif подключены `<link>`'ом на
Google Fonts в `app/layout.tsx`. Так сборка не зависит от сети.
Если захотите самохостинг (быстрее и без внешнего запроса) — замените
`<link>` на `next/font/google`; сборка тогда будет скачивать шрифты сама.
Фолбэк на системные уже прописан в `--font-sans/-serif/-mono`.

## SEO

- 31 URL в `sitemap.xml`, все отдают 200 — проверено.
- Уникальные `title` и `description` у всех 16 маршрутов.
- JSON-LD: BreadcrumbList, HowTo и FAQPage на маршрутах,
  TechArticle и FAQPage на ошибках, SoftwareApplication на главной.
- `hreflang` и переключатель RU/EN/UK **выключены** до появления
  реальных деревьев `/en` и `/uk`: ссылка на 404 хуже её отсутствия.
  Включать в том же коммите, в котором появятся страницы.

Дальнейшие шаги по трафику — в `docs/seo/` в корне репозитория.
