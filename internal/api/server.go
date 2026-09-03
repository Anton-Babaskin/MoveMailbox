package api

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"mime"
	"net"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
	"github.com/Anton-Babaskin/MoveMailbox/internal/webui"
)

type Server struct {
	engine  migrator.Engine
	manager *jobs.Manager
}

type Config struct {
	AllowedHosts []string
}

const (
	ProductID       = "movemailbox"
	LegacyProductID = "mailbox-migrator"
	ProductName     = "MoveMailbox"
)

// Version is replaced at build time for tagged releases.
var Version = "0.3.0-preview"

func New(engine migrator.Engine, manager *jobs.Manager, config Config) http.Handler {
	server := &Server{engine: engine, manager: manager}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", server.health)
	mux.HandleFunc("POST /api/connections/test", server.testConnection)
	mux.HandleFunc("POST /api/connections/folders", server.listFolders)
	mux.HandleFunc("GET /api/jobs", server.listJobs)
	mux.HandleFunc("POST /api/jobs", server.startJob)
	mux.HandleFunc("GET /api/jobs/{id}", server.getJob)
	mux.HandleFunc("GET /api/jobs/{id}/events", server.jobEvents)
	mux.HandleFunc("POST /api/jobs/{id}/cancel", server.cancelJob)

	assets, err := fs.Sub(webui.Assets, "dist")
	if err != nil {
		panic(err)
	}
	mux.Handle("/", staticHandler(assets))
	return securityHeaders(requestGuard(config.AllowedHosts, mux))
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	storageKind, storageHealthy := s.manager.StorageStatus()
	writeJSON(w, http.StatusOK, map[string]any{
		"product":   ProductID,
		"name":      ProductName,
		"status":    "ok",
		"engine":    s.engine.Name(),
		"available": s.engine.Available(),
		"version":   Version,
		"storage": map[string]any{
			"kind":    storageKind,
			"healthy": storageHealthy,
		},
	})
}

func (s *Server) testConnection(w http.ResponseWriter, r *http.Request) {
	var endpoint migrator.Endpoint
	if err := decodeJSON(w, r, &endpoint); err != nil {
		return
	}
	if err := endpoint.Validate(); err != nil {
		writeErrorCode(w, http.StatusBadRequest, "validation.endpoint", err.Error())
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
	defer cancel()
	logs := make([]string, 0, 4)
	err := s.engine.TestConnection(ctx, endpoint, func(event migrator.Event) {
		if event.Message != "" && len(logs) < 4 {
			logs = append(logs, event.Message)
		}
	})
	if err != nil {
		message := strings.ReplaceAll(err.Error(), endpoint.Password, "[REDACTED]")
		writeErrorCode(w, http.StatusBadGateway, "connection.failed", message)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "message": "Подключение успешно", "details": logs})
}

func (s *Server) listFolders(w http.ResponseWriter, r *http.Request) {
	var endpoint migrator.Endpoint
	if err := decodeJSON(w, r, &endpoint); err != nil {
		return
	}
	if err := endpoint.Validate(); err != nil {
		writeErrorCode(w, http.StatusBadRequest, "validation.endpoint", err.Error())
		return
	}
	lister, ok := s.engine.(migrator.FolderLister)
	if !ok {
		writeErrorCode(w, http.StatusNotImplemented, "folders.unsupported", "движок не поддерживает получение списка папок")
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
	defer cancel()
	folders, err := lister.ListFolders(ctx, endpoint)
	if err != nil {
		message := strings.ReplaceAll(err.Error(), endpoint.Password, "[REDACTED]")
		writeErrorCode(w, http.StatusBadGateway, "folders.failed", message)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"folders": folders})
}

func (s *Server) startJob(w http.ResponseWriter, r *http.Request) {
	var request migrator.Request
	if err := decodeJSON(w, r, &request); err != nil {
		return
	}
	view, err := s.manager.Start(request)
	if err != nil {
		writeManagerError(w, err)
		return
	}
	writeJSON(w, http.StatusAccepted, view)
}

func (s *Server) listJobs(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, s.manager.List())
}

func (s *Server) getJob(w http.ResponseWriter, r *http.Request) {
	view, ok := s.manager.Get(r.PathValue("id"))
	if !ok {
		writeErrorCode(w, http.StatusNotFound, "job.not_found", "задание не найдено")
		return
	}
	writeJSON(w, http.StatusOK, view)
}

func (s *Server) cancelJob(w http.ResponseWriter, r *http.Request) {
	if err := s.manager.Cancel(r.PathValue("id")); err != nil {
		writeManagerError(w, err)
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"ok": true})
}

func (s *Server) jobEvents(w http.ResponseWriter, r *http.Request) {
	afterSequence := uint64(0)
	lastEventID := strings.TrimSpace(r.Header.Get("Last-Event-ID"))
	if lastEventID != "" {
		parsed, err := strconv.ParseUint(lastEventID, 10, 64)
		if err != nil {
			writeErrorCode(w, http.StatusBadRequest, "stream.last_event_id.invalid", "некорректный Last-Event-ID")
			return
		}
		afterSequence = parsed
	}
	events, unsubscribe, ok := s.manager.SubscribeFrom(r.PathValue("id"), afterSequence)
	if !ok {
		writeErrorCode(w, http.StatusNotFound, "job.not_found", "задание не найдено")
		return
	}
	defer unsubscribe()
	view, _ := s.manager.Get(r.PathValue("id"))
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeErrorCode(w, http.StatusInternalServerError, "stream.unsupported", "потоковые события не поддерживаются")
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	// The initial snapshot already contains recent events through view.Sequence.
	// Suppress their replay below so a fast job cannot duplicate log lines. On
	// an EventSource reconnect Last-Event-ID is present and only missed events
	// are sent.
	initialSnapshot := lastEventID == ""
	if initialSnapshot {
		writeSSE(w, "snapshot", view)
		flusher.Flush()
	}

	keepAlive := time.NewTicker(15 * time.Second)
	defer keepAlive.Stop()
	for {
		select {
		case event, open := <-events:
			if !open {
				return
			}
			if initialSnapshot && event.Sequence <= view.Sequence {
				continue
			}
			writeSSEWithID(w, "migration", event.Sequence, event.Event)
			flusher.Flush()
			if event.Event.Type == "finished" {
				return
			}
		case <-keepAlive.C:
			fmt.Fprint(w, ": keep-alive\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func writeSSEWithID(w http.ResponseWriter, eventName string, id uint64, value any) {
	data, _ := json.Marshal(value)
	fmt.Fprintf(w, "id: %d\nevent: %s\ndata: %s\n\n", id, eventName, data)
}

func writeSSE(w http.ResponseWriter, eventName string, value any) {
	data, _ := json.Marshal(value)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventName, data)
}

func decodeJSON(w http.ResponseWriter, r *http.Request, target any) error {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		writeError(w, http.StatusBadRequest, fmt.Errorf("некорректный запрос: %w", err))
		return err
	}
	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		if err == nil {
			err = fmt.Errorf("после JSON-объекта переданы лишние данные")
		}
		writeError(w, http.StatusBadRequest, fmt.Errorf("некорректный запрос: %w", err))
		return err
	}
	return nil
}

func requestGuard(allowedHosts []string, next http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(allowedHosts))
	for _, host := range allowedHosts {
		if canonicalAuthority(host) != "" {
			allowed[canonicalAuthority(host)] = struct{}{}
		}
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := canonicalAuthority(r.Host)
		if _, ok := allowed[host]; !ok {
			writeErrorCode(w, http.StatusMisdirectedRequest, "request.host.denied", "недопустимый адрес сервера")
			return
		}

		switch strings.ToLower(strings.TrimSpace(r.Header.Get("Sec-Fetch-Site"))) {
		case "", "none", "same-origin":
		default:
			writeErrorCode(w, http.StatusForbidden, "request.cross_site", "межсайтовый запрос отклонён")
			return
		}
		if origin := strings.TrimSpace(r.Header.Get("Origin")); origin != "" {
			parsed, err := url.Parse(origin)
			if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || canonicalAuthority(parsed.Host) != host {
				writeErrorCode(w, http.StatusForbidden, "request.origin.denied", "источник запроса отклонён")
				return
			}
		}
		if r.Method == http.MethodPost {
			mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
			if err != nil || mediaType != "application/json" {
				writeErrorCode(w, http.StatusUnsupportedMediaType, "request.json.required", "требуется Content-Type application/json")
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func canonicalAuthority(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	if value == "" {
		return ""
	}
	if host, port, err := net.SplitHostPort(value); err == nil {
		host = strings.TrimSuffix(strings.Trim(host, "[]"), ".")
		if host == "" || port == "" {
			return ""
		}
		return net.JoinHostPort(host, port)
	}
	return strings.TrimSuffix(value, ".")
}

type cachedAsset struct {
	contentType string
	data        []byte
	etag        string
}

func staticHandler(assets fs.FS) http.Handler {
	cache := make(map[string]cachedAsset)
	if err := fs.WalkDir(assets, ".", func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if entry.IsDir() {
			return nil
		}
		data, err := fs.ReadFile(assets, name)
		if err != nil {
			return err
		}
		digest := sha256.Sum256(data)
		contentType := mime.TypeByExtension(path.Ext(name))
		cache[name] = cachedAsset{contentType: contentType, data: data, etag: fmt.Sprintf("\"%x\"", digest)}
		return nil
	}); err != nil {
		panic(err)
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			writeErrorCode(w, http.StatusMethodNotAllowed, "request.method.denied", "метод не поддерживается")
			return
		}
		name := strings.TrimPrefix(path.Clean("/"+r.URL.Path), "/")
		if name == "" || name == "." {
			name = "index.html"
		}
		asset, ok := cache[name]
		if !ok {
			http.NotFound(w, r)
			return
		}
		if asset.contentType != "" {
			w.Header().Set("Content-Type", asset.contentType)
		}
		w.Header().Set("ETag", asset.etag)
		w.Header().Set("Cache-Control", "no-cache, must-revalidate")
		if r.Header.Get("If-None-Match") == asset.etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		http.ServeContent(w, r, name, time.Time{}, bytes.NewReader(asset.data))
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeErrorCode(w, status, "request.failed", err.Error())
}

func writeManagerError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, jobs.ErrJobNotFound):
		writeErrorCode(w, http.StatusNotFound, "job.not_found", err.Error())
	case errors.Is(err, jobs.ErrJobFinished):
		writeErrorCode(w, http.StatusConflict, "job.finished", err.Error())
	case errors.Is(err, jobs.ErrJobLimitReached):
		writeErrorCode(w, http.StatusTooManyRequests, "job.limit_reached", err.Error())
	case errors.Is(err, jobs.ErrEngineUnavailable):
		writeErrorCode(w, http.StatusServiceUnavailable, "engine.unavailable", err.Error())
	case errors.Is(err, jobs.ErrManagerShuttingDown):
		writeErrorCode(w, http.StatusServiceUnavailable, "manager.shutting_down", err.Error())
	case errors.Is(err, jobs.ErrPersistenceUnavailable):
		writeErrorCode(w, http.StatusServiceUnavailable, "storage.unavailable", "история заданий временно недоступна")
	default:
		writeErrorCode(w, http.StatusBadRequest, "validation.request", err.Error())
	}
}

func writeErrorCode(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
		w.Header().Set("X-DNS-Prefetch-Control", "off")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		w.Header().Set("Content-Security-Policy", strings.Join([]string{
			"default-src 'self'",
			"style-src 'self'",
			"style-src-attr 'unsafe-inline'",
			"script-src 'self'",
			"img-src 'self' data:",
			"connect-src 'self'",
			"font-src 'self'",
			"frame-ancestors 'none'",
		}, "; "))
		next.ServeHTTP(w, r)
	})
}
