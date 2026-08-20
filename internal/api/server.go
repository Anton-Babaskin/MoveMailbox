package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"strings"
	"time"

	"github.com/Anton-Babaskin/mailbox-migrator/internal/jobs"
	"github.com/Anton-Babaskin/mailbox-migrator/internal/migrator"
	"github.com/Anton-Babaskin/mailbox-migrator/internal/webui"
)

type Server struct {
	engine  migrator.Engine
	manager *jobs.Manager
}

// Version is replaced at build time for tagged releases.
var Version = "0.1.1-preview"

func New(engine migrator.Engine, manager *jobs.Manager) http.Handler {
	server := &Server{engine: engine, manager: manager}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", server.health)
	mux.HandleFunc("POST /api/connections/test", server.testConnection)
	mux.HandleFunc("GET /api/jobs", server.listJobs)
	mux.HandleFunc("POST /api/jobs", server.startJob)
	mux.HandleFunc("GET /api/jobs/{id}", server.getJob)
	mux.HandleFunc("GET /api/jobs/{id}/events", server.jobEvents)
	mux.HandleFunc("POST /api/jobs/{id}/cancel", server.cancelJob)

	assets, err := fs.Sub(webui.Assets, "dist")
	if err != nil {
		panic(err)
	}
	mux.Handle("/", http.FileServer(http.FS(assets)))
	return securityHeaders(mux)
}

func (s *Server) health(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"product":   "mailbox-migrator",
		"status":    "ok",
		"engine":    s.engine.Name(),
		"available": s.engine.Available(),
		"version":   Version,
	})
}

func (s *Server) testConnection(w http.ResponseWriter, r *http.Request) {
	var endpoint migrator.Endpoint
	if err := decodeJSON(w, r, &endpoint); err != nil {
		return
	}
	if err := endpoint.Validate(); err != nil {
		writeError(w, http.StatusBadRequest, err)
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
		writeError(w, http.StatusBadGateway, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ok": true, "message": "Подключение успешно", "details": logs})
}

func (s *Server) startJob(w http.ResponseWriter, r *http.Request) {
	var request migrator.Request
	if err := decodeJSON(w, r, &request); err != nil {
		return
	}
	view, err := s.manager.Start(request)
	if err != nil {
		writeError(w, http.StatusBadRequest, err)
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
		writeError(w, http.StatusNotFound, fmt.Errorf("задание не найдено"))
		return
	}
	writeJSON(w, http.StatusOK, view)
}

func (s *Server) cancelJob(w http.ResponseWriter, r *http.Request) {
	if err := s.manager.Cancel(r.PathValue("id")); err != nil {
		writeError(w, http.StatusConflict, err)
		return
	}
	writeJSON(w, http.StatusAccepted, map[string]any{"ok": true})
}

func (s *Server) jobEvents(w http.ResponseWriter, r *http.Request) {
	events, unsubscribe, ok := s.manager.Subscribe(r.PathValue("id"))
	if !ok {
		writeError(w, http.StatusNotFound, fmt.Errorf("задание не найдено"))
		return
	}
	defer unsubscribe()
	view, _ := s.manager.Get(r.PathValue("id"))
	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, fmt.Errorf("потоковые события не поддерживаются"))
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache, no-transform")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")
	writeSSE(w, "snapshot", view)
	flusher.Flush()

	keepAlive := time.NewTicker(15 * time.Second)
	defer keepAlive.Stop()
	for {
		select {
		case event := <-events:
			writeSSE(w, "migration", event)
			flusher.Flush()
		case <-keepAlive.C:
			fmt.Fprint(w, ": keep-alive\n\n")
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
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
	return nil
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, err error) {
	writeJSON(w, status, map[string]string{"error": err.Error()})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
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
