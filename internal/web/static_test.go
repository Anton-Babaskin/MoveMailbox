package web

import (
	"crypto/sha256"
	"encoding/base64"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"
)

// policy повторяет заголовок, который выставляет securityHeaders в internal/api.
const policy = "default-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; " +
	"script-src 'self'; img-src 'self' data:; connect-src 'self'"

func sha(body string) string {
	sum := sha256.Sum256([]byte(body))
	return "'sha256-" + base64.StdEncoding.EncodeToString(sum[:]) + "'"
}

func TestInlineHashesSkipsExternalScripts(t *testing.T) {
	html := []byte(`<html><head>` +
		`<script src="/_next/static/chunk.js" async=""></script>` +
		`<script>self.__next_f=[]</script>` +
		`<style>body{margin:0}</style>` +
		`</head></html>`)

	hashes := hashesFor(html)
	if want := " " + sha("self.__next_f=[]"); hashes.scripts != want {
		t.Errorf("scripts = %q, want %q", hashes.scripts, want)
	}
	if want := " " + sha("body{margin:0}"); hashes.styles != want {
		t.Errorf("styles = %q, want %q", hashes.styles, want)
	}
}

func TestInlineHashesDeduplicates(t *testing.T) {
	html := []byte(`<script>a=1</script><script>a=1</script>`)
	if got := hashesFor(html).scripts; strings.Count(got, "sha256-") != 1 {
		t.Errorf("одинаковые скрипты должны дать один хэш, получено %q", got)
	}
}

func TestWithInlineHashesExtendsOnlyItsDirectives(t *testing.T) {
	header := http.Header{}
	header.Set("Content-Security-Policy", policy)
	withInlineHashes(header, pageHashes{scripts: " 'sha256-s'", styles: " 'sha256-c'"})

	got := header.Get("Content-Security-Policy")
	if !strings.Contains(got, "script-src 'self' 'sha256-s'") {
		t.Errorf("хэш скрипта не добавлен: %q", got)
	}
	if !strings.Contains(got, "style-src 'self' 'sha256-c'") {
		t.Errorf("хэш стиля не добавлен: %q", got)
	}
	// style-src-attr начинается с той же подстроки и не должен пострадать.
	if !strings.Contains(got, "style-src-attr 'unsafe-inline'") {
		t.Errorf("style-src-attr изменён: %q", got)
	}
	if strings.Contains(got, "'unsafe-inline' 'sha256-c'") {
		t.Errorf("хэш попал не в ту директиву: %q", got)
	}
}

func TestWithInlineHashesLeavesMissingPolicyAlone(t *testing.T) {
	header := http.Header{}
	withInlineHashes(header, pageHashes{scripts: " 'sha256-s'"})
	if got := header.Get("Content-Security-Policy"); got != "" {
		t.Errorf("политика выдумана на пустом месте: %q", got)
	}
}

// site — раскладка, которую даёт next build с trailingSlash: true.
func site() fstest.MapFS {
	page := []byte(`<html><head><script src="/_next/static/a.js"></script>` +
		`<script>self.__next_f=[]</script></head><body><h1>ok</h1></body></html>`)
	return fstest.MapFS{
		"index.html":        {Data: page},
		"routes/index.html": {Data: page},
		"404.html":          {Data: []byte(`<html><head><style>body{margin:0}</style></head></html>`)},
		"sitemap.xml":       {Data: []byte(`<urlset></urlset>`)},
		"_next/static/a.js": {Data: []byte(`console.log(1)`)},
	}
}

func request(t *testing.T, handler http.Handler, target string, header http.Header) *httptest.ResponseRecorder {
	t.Helper()
	r := httptest.NewRequest(http.MethodGet, target, nil)
	for key, values := range header {
		r.Header[key] = values
	}
	recorder := httptest.NewRecorder()
	recorder.Header().Set("Content-Security-Policy", policy)
	handler.ServeHTTP(recorder, r)
	return recorder
}

func TestHandlerServesPagesWithHashedPolicy(t *testing.T) {
	handler, err := handlerFor(site())
	if err != nil {
		t.Fatal(err)
	}

	for _, path := range []string{"/", "/routes/"} {
		response := request(t, handler, path, nil)
		if response.Code != http.StatusOK {
			t.Errorf("%s: код %d, ожидался 200", path, response.Code)
			continue
		}
		if got := response.Header().Get("Content-Type"); !strings.HasPrefix(got, "text/html") {
			t.Errorf("%s: Content-Type %q", path, got)
		}
		want := "script-src 'self' " + sha("self.__next_f=[]")
		if got := response.Header().Get("Content-Security-Policy"); !strings.Contains(got, want) {
			t.Errorf("%s: в CSP нет хэша инлайн-скрипта: %q", path, got)
		}
	}
}

// Раньше это поведение проверял TestStaticAssetsUseETag в internal/api поверх
// internal/webui: тот хендлер снят с роутера вместе с пакетом, а кэширование
// теперь живёт здесь.
func TestHandlerUsesETagForConditionalRequests(t *testing.T) {
	handler, err := handlerFor(site())
	if err != nil {
		t.Fatal(err)
	}

	for _, path := range []string{"/_next/static/a.js", "/sitemap.xml", "/"} {
		first := request(t, handler, path, nil)
		if first.Code != http.StatusOK {
			t.Errorf("%s: код %d, ожидался 200", path, first.Code)
			continue
		}
		etag := first.Header().Get("ETag")
		if etag == "" {
			t.Errorf("%s: нет ETag", path)
			continue
		}

		second := request(t, handler, path, http.Header{"If-None-Match": {etag}})
		if second.Code != http.StatusNotModified {
			t.Errorf("%s: повторный запрос дал %d, ожидался 304", path, second.Code)
		}
	}
}

func TestHandlerCachesHashedAssetsForever(t *testing.T) {
	handler, err := handlerFor(site())
	if err != nil {
		t.Fatal(err)
	}

	asset := request(t, handler, "/_next/static/a.js", nil)
	if got := asset.Header().Get("Cache-Control"); !strings.Contains(got, "immutable") {
		t.Errorf("ассет с хэшем в имени: Cache-Control %q", got)
	}
	page := request(t, handler, "/", nil)
	if got := page.Header().Get("Cache-Control"); !strings.Contains(got, "no-cache") {
		t.Errorf("страница: Cache-Control %q", got)
	}
}

func TestHandlerServesSiteNotFoundPage(t *testing.T) {
	handler, err := handlerFor(site())
	if err != nil {
		t.Fatal(err)
	}

	response := request(t, handler, "/__missing__/", nil)
	if response.Code != http.StatusNotFound {
		t.Fatalf("код %d, ожидался 404", response.Code)
	}
	if !strings.Contains(response.Body.String(), "body{margin:0}") {
		t.Errorf("отдана не страница 404 сайта: %q", response.Body.String())
	}
	want := "style-src 'self' " + sha("body{margin:0}")
	if got := response.Header().Get("Content-Security-Policy"); !strings.Contains(got, want) {
		t.Errorf("в CSP страницы 404 нет хэша инлайн-стиля: %q", got)
	}
}
