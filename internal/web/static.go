// Package web отдаёт статически экспортированный сайт.
//
// Next.js с output:"export" кладёт страницы либо каталогами с index.html
// (trailingSlash: true), либо плоскими .html (trailingSlash: false).
// Хендлер понимает обе раскладки: формат URL решается в конфиге сайта,
// а не здесь, и смена формата не требует правок в Go.
// Задача хендлера — найти для пути нужный файл и не мешать /api/*.
package web

import (
	"embed"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// Каталог out/ кладётся рядом с этим файлом на этапе сборки образа.
//
//go:embed all:out
var content embed.FS

// Handler возвращает http.Handler для сайта.
// Монтировать на "/", а API — на "/api/": ServeMux отдаёт приоритет
// более длинному префиксу, поэтому API перехватывается первым.
func Handler() (http.Handler, error) {
	sub, err := fs.Sub(content, "out")
	if err != nil {
		return nil, err
	}
	files := http.FS(sub)

	open := func(name string) (http.File, fs.FileInfo, bool) {
		f, err := files.Open(name)
		if err != nil {
			return nil, nil, false
		}
		st, err := f.Stat()
		if err != nil || st.IsDir() {
			_ = f.Close()
			return nil, nil, false
		}
		return f, st, true
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := path.Clean("/" + strings.TrimPrefix(r.URL.Path, "/"))

		// Имена ассетов содержат хэш содержимого — кэшируем навсегда.
		if strings.HasPrefix(p, "/_next/static/") {
			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		}

		// 1. Файл есть как есть: ассеты, sitemap.xml, robots.txt, og.png.
		if f, st, ok := open(p); ok {
			defer f.Close()
			http.ServeContent(w, r, p, st.ModTime(), f)
			return
		}

		// 2. Страница. Поддерживаются обе раскладки экспорта, чтобы
		//    хендлер не зависел от trailingSlash:
		//      /routes/ → routes/index.html   (trailingSlash: true)
		//      /routes  → routes.html         (trailingSlash: false)
		//    Какой адрес канонический, решает тег canonical в самой
		//    странице — так один и тот же бинарь переживает смену
		//    формата URL, не роняя уже проиндексированные ссылки.
		name := p
		if name == "/" {
			name = "/index"
		}
		for _, candidate := range []string{
			path.Join(p, "index.html"),
			name + ".html",
		} {
			if f, st, ok := open(candidate); ok {
				defer f.Close()
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				http.ServeContent(w, r, candidate, st.ModTime(), f)
				return
			}
		}

		// 4. Не нашли — отдаём страницу 404 сайта, а не голый текст.
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusNotFound)
		if f, _, ok := open("/404.html"); ok {
			defer f.Close()
			_, _ = io.Copy(w, f)
			return
		}
		_, _ = io.WriteString(w, "404")
	}), nil
}
