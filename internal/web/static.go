// Package web отдаёт статически экспортированный сайт.
//
// Next.js с output:"export" кладёт страницы либо каталогами с index.html
// (trailingSlash: true), либо плоскими .html (trailingSlash: false).
// Хендлер понимает обе раскладки: формат URL решается в конфиге сайта,
// а не здесь, и смена формата не требует правок в Go.
// Задача хендлера — найти для пути нужный файл и не мешать /api/*.
package web

import (
	"bytes"
	"crypto/sha256"
	"embed"
	"encoding/base64"
	"encoding/hex"
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

// fileInfo — то, что считается один раз при старте и дальше только читается.
// Страниц под сотню, а на каждый ответ это иначе был бы sha256 по всему файлу.
type fileInfo struct {
	etag   string
	hashes pageHashes
}

// Handler возвращает http.Handler для сайта.
// Монтировать на "/", а API — на "/api/": ServeMux отдаёт приоритет
// более длинному префиксу, поэтому API перехватывается первым.
func Handler() (http.Handler, error) {
	sub, err := fs.Sub(content, "out")
	if err != nil {
		return nil, err
	}
	return handlerFor(sub)
}

// handlerFor отделён от Handler, чтобы хендлер можно было проверить на
// произвольной файловой системе: в git лежит только out/.gitkeep, и на
// вшитой статике тесты в CI проверять нечего.
func handlerFor(fsys fs.FS) (http.Handler, error) {
	files := http.FS(fsys)

	meta := make(map[string]fileInfo)
	if err := fs.WalkDir(fsys, ".", func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		data, err := fs.ReadFile(fsys, name)
		if err != nil {
			return err
		}
		sum := sha256.Sum256(data)
		info := fileInfo{etag: `"` + hex.EncodeToString(sum[:]) + `"`}
		if strings.HasSuffix(name, ".html") {
			info.hashes = hashesFor(data)
		}
		meta["/"+name] = info
		return nil
	}); err != nil {
		return nil, err
	}

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
			// ETag вместо времени: у вшитых файлов его нет, а без валидатора
			// браузер каждый раз выкачивает файл заново. ServeContent сам
			// ответит 304 на совпавший If-None-Match.
			w.Header().Set("ETag", meta[p].etag)
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
				w.Header().Set("ETag", meta[candidate].etag)
				w.Header().Set("Cache-Control", "no-cache, must-revalidate")
				withInlineHashes(w.Header(), meta[candidate].hashes)
				http.ServeContent(w, r, candidate, st.ModTime(), f)
				return
			}
		}

		// 4. Не нашли — отдаём страницу 404 сайта, а не голый текст.
		// Заголовки правятся до WriteHeader: после него они уже отправлены.
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if f, _, ok := open("/404.html"); ok {
			defer f.Close()
			withInlineHashes(w.Header(), meta["/404.html"].hashes)
			w.WriteHeader(http.StatusNotFound)
			_, _ = io.Copy(w, f)
			return
		}
		w.WriteHeader(http.StatusNotFound)
		_, _ = io.WriteString(w, "404")
	}), nil
}

// inlineHashes считает sha256 всех инлайн-скриптов и инлайн-стилей страницы.
//
// Next кладёт в экспорт данные для гидратации инлайн-скриптами, а страница 404
// — ещё и инлайн-стилем. Под `script-src 'self'` они блокируются, и страница
// открывается мёртвой: разметка есть, ни одна кнопка не работает. Альтернатива
// хэшам — 'unsafe-inline', то есть разрешить вообще любой инлайн-скрипт,
// включая внедрённый через XSS. Хэши считаются здесь же из вшитых файлов при
// старте, поэтому они не могут разойтись со статикой: пересобрали сайт —
// пересчитались и они.
func inlineHashes(html []byte, tag string) string {
	open := []byte("<" + tag)
	closing := []byte("</" + tag + ">")
	var hashes []string
	seen := make(map[string]bool)
	for rest := html; ; {
		index := bytes.Index(rest, open)
		if index < 0 {
			break
		}
		rest = rest[index:]
		tagEnd := bytes.IndexByte(rest, '>')
		if tagEnd < 0 {
			break
		}
		attributes := rest[:tagEnd]
		body := rest[tagEnd+1:]
		end := bytes.Index(body, closing)
		if end < 0 {
			break
		}
		// У элемента со ссылкой тела нет: его разрешает 'self', хэш не нужен.
		if !bytes.Contains(attributes, []byte(" src=")) && end > 0 {
			sum := sha256.Sum256(body[:end])
			value := "'sha256-" + base64.StdEncoding.EncodeToString(sum[:]) + "'"
			if !seen[value] {
				seen[value] = true
				hashes = append(hashes, value)
			}
		}
		rest = body[end:]
	}
	if len(hashes) == 0 {
		return ""
	}
	return " " + strings.Join(hashes, " ")
}

// pageHashes — то, что нужно дописать в CSP конкретной страницы.
type pageHashes struct {
	scripts string
	styles  string
}

func hashesFor(html []byte) pageHashes {
	return pageHashes{scripts: inlineHashes(html, "script"), styles: inlineHashes(html, "style")}
}

// withInlineHashes дописывает хэши в уже выставленный заголовок CSP.
//
// Единственный источник самой политики — securityHeaders в internal/api:
// здесь она не дублируется, а только расширяется на конкретной странице.
// Если CSP не выставлен (например, хендлер используется отдельно), функция
// ничего не делает.
func withInlineHashes(header http.Header, hashes pageHashes) {
	if hashes.scripts == "" && hashes.styles == "" {
		return
	}
	policy := header.Get("Content-Security-Policy")
	if policy == "" {
		return
	}
	// style-src-attr не заденется: после "style-src" у него идёт дефис.
	for _, directive := range []struct{ name, extra string }{
		{"script-src 'self'", hashes.scripts},
		{"style-src 'self'", hashes.styles},
	} {
		if directive.extra == "" || !strings.Contains(policy, directive.name) {
			continue
		}
		policy = strings.Replace(policy, directive.name, directive.name+directive.extra, 1)
	}
	header.Set("Content-Security-Policy", policy)
}
