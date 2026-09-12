# Как встроить сайт в репозиторий MoveMailbox

Новый сайт заменяет собой `internal/webui` — тот интерфейс, что сейчас
примонтирован на `/` в `internal/api/server.go`. Бекенд уже рабочий,
его API менять не нужно: фронт написан под существующие эндпоинты.

## Раскладка

```
MoveMailbox/
├── cmd/mailbox-migrator/   существующий бекенд, не трогаем
├── internal/
│   ├── api/server.go       ← две правки: монтирование сайта и CSP
│   ├── webui/              ← старый интерфейс, снимается с роутера
│   └── web/                ← новый пакет из этого архива
│       ├── static.go       хендлер + go:embed
│       ├── .gitignore      out/* кроме .gitkeep
│       └── out/.gitkeep    заглушка: без неё go build падает
├── web/                    ← исходники сайта (Next.js 15)
├── docs/seo/               ← ядро запросов, план контента, чек-лист
├── Makefile                ← новый файл, в репозитории его не было
├── Dockerfile              ← ваш же, плюс стадия web и одна строка COPY
└── .dockerignore           ← дописать четыре строки
```

`go:embed` не читает выше своего пакета, поэтому статика физически
копируется в `internal/web/out`. Это артефакт сборки, в git не идёт —
кроме `.gitkeep`: без единого файла в каталоге `go:embed all:out`
не компилируется, и бекенд нельзя было бы собрать, не поставив Node.

## Правка 1: монтирование

В `internal/api/server.go` сейчас:

```go
assets, err := fs.Sub(webui.Assets, "dist")
if err != nil {
    panic(err)
}
mux.Handle("/", staticHandler(assets))
```

Становится:

```go
site, err := web.Handler()
if err != nil {
    panic(err)
}
mux.Handle("/", site)
```

Импорт `internal/webui` убирается. Сам пакет можно удалить сразу или
оставить на один релиз — но не монтировать: два хендлера на `/`
несовместимы, `ServeMux` паникует на дублирующемся паттерне.

Порядок регистрации значения не имеет: `ServeMux` выбирает самый
длинный совпавший паттерн, поэтому `/api/...` перехватываются раньше `/`.

## Правка 2: CSP

`internal/api/server.go`, около строки 522:

```go
"script-src 'self'",
```

становится

```go
"script-src 'self' 'unsafe-inline'",
```

Next кладёт в страницу inline-скрипты с данными для гидратации — в
экспорте их около двух десятков на страницу. Под `script-src 'self'`
они блокируются: страница откроется, но ни одна кнопка не заработает.

Остальные директивы менять не нужно:

- `style-src 'self'` — шрифты самохостятся (`next/font` скачивает их
  на этапе сборки), внешних стилей в сайте нет;
- `style-src-attr 'unsafe-inline'` — уже есть, покрывает inline-стили
  в разметке;
- `connect-src 'self'` — форма ходит в `/api/*` на том же origin;
- `img-src 'self' data:` — иконки лежат в SVG-спрайте внутри страницы.

Если позже захотите вернуть строгий `script-src`: считать sha256
каждого inline-скрипта на этапе сборки, сложить в файл рядом со
статикой и подставлять в заголовок. Работает, но требует помнить про
пересборку — забыли, и сайт молча умер.

## Что фронт ждёт от API

Ничего нового. Пути и формы запросов повторяют `internal/api/server.go`
и `internal/migrator/types.go`:

| Действие в интерфейсе | Запрос |
|---|---|
| «Проверить оба» | `POST /api/connections/test`, тело — `migrator.Endpoint` |
| список папок | `POST /api/connections/folders` |
| «Начать перенос» | `POST /api/jobs`, тело — `migrator.Request` |
| прогресс | `GET /api/jobs/{id}/events`, SSE, события — `migrator.Event` |
| «Остановить» | `POST /api/jobs/{id}/cancel` |
| CSRF | `GET /api/session` при загрузке, токен уходит в `X-CSRF-Token` |

Всё это собрано в объекте `API` в `web/lib/workspace.ts` — единственном
месте фронта, которое знает о сервере. Если где-то разошлись имена
полей, правится только этот блок.

Соответствие чекбоксов расширенных настроек полям `migrator.Options`:

| `data-mode` | поле |
|---|---|
| `verbose` | `dryRun` |
| `creds` | `justLogin` |
| `sizes` | `justFolderSizes` |
| `folders` | `justFolders` |
| кнопка `#strict` | `strictMirror` + `strictMirrorConfirmed` |

Взаимоисключающие режимы фронт намеренно не фильтрует: правила
валидации живут в `Request.Validate()`, и дублировать их в браузере
значит однажды с ними разойтись.

## .dockerignore

Дописать в конец:

```
web/node_modules
web/.next
web/out
internal/web/out
```

Существующая строка `website` к каталогу `web` не относится — шаблон
без звёздочки совпадает только целиком. Без этих строк в контекст
сборки уедут `node_modules`, а стадия `web` всё равно соберёт статику
заново поверх устаревшей копии.

## Сборка

```bash
make web      # npm ci && next build && копирование в internal/web/out
make build    # то же плюс go build
```

В Docker то же делает стадия `web` — Node в финальный образ не попадает.

`npm run export` внутри `make web` использует `web/scripts/embed.mjs`,
а не `rm -rf && cp`: на Windows этих команд нет.

Первая сборка сайта тянет шрифты с Google Fonts (`next/font` их
самохостит). Машине нужна сеть — как и для `npm ci`.

## Разработка

Два процесса:

```bash
make web-dev                    # сайт на :3000 с горячей перезагрузкой
go run ./cmd/mailbox-migrator   # бекенд на :8080
```

Чтобы форма в дев-режиме ходила в бекенд, добавьте в `web/next.config.ts`:

```ts
async rewrites() {
  return process.env.NODE_ENV === 'development'
    ? [{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }]
    : [];
}
```

`rewrites` при `output: 'export'` в продакшен-сборку не попадают —
работают только у дев-сервера, и это именно то, что нужно.

## Формат URL

`trailingSlash: false`. Экспорт кладёт страницы плоскими файлами:
`/migrate/gmail-to-outlook.html`. Хендлер сам дописывает `.html`,
поэтому URL остаётся `/migrate/gmail-to-outlook` — ровно так, как он
записан в `canonical`, в `sitemap.xml` и во внутренних ссылках.
Расхождение между этими тремя местами — самая частая причина дублей
в индексе, поэтому менять `trailingSlash` без правки всех трёх не стоит.

Запрос с хвостовым слэшем хендлер уводит 301-м на канонический вид.

## Что доделать перед публикацией

1. `web/app/privacy/page.tsx` и `web/app/terms/page.tsx` содержат
   `{{...}}`: юрлицо, контактный email, аналитика, условия возврата,
   применимое право. После заполнения поменять `robots: { index: false }`
   на `true`.
2. `web/lib/seo.ts` → `SITE` — боевой домен. Оттуда берутся canonical,
   Open Graph и sitemap: ошибка здесь окажется сразу на всех страницах.
3. `web/public/og.png` — превью для соцсетей 1735×909.

## Проверка

```bash
make build && ./bin/movemailbox &
for u in / /routes /migrate/gmail-to-outlook /docs/errors/authenticationfailed \
         /sitemap.xml /robots.txt /theme.js; do
  printf "%-42s %s\n" "$u" "$(curl -so /dev/null -w '%{http_code}' localhost:8080$u)"
done
curl -s localhost:8080/sitemap.xml | grep -c "<loc>"   # ожидается 31
```

И обязательно в браузере: открыть главную и посмотреть консоль.
Ни одного сообщения про Content Security Policy быть не должно — если
есть, значит правка 2 не доехала и интерактив мёртв.
