package api

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	guestCookieName          = "__Host-movemailbox_session"
	defaultSessionTTL        = 24 * time.Hour
	defaultSessionRate       = 120
	defaultIPRate            = 600
	minimumSessionSecretSize = 32
)

type principalContextKey struct{}

type guestGateway struct {
	secret       []byte
	ttl          time.Duration
	sessionLimit int
	ipLimit      int
	limiter      *requestLimiter
	now          func() time.Time
}

type guestPrincipal struct {
	id        string
	csrfToken string
	expiresAt time.Time
}

func (config Config) withDefaults() Config {
	if config.SessionTTL <= 0 {
		config.SessionTTL = defaultSessionTTL
	}
	if config.SessionRequestsPerMinute == 0 {
		config.SessionRequestsPerMinute = defaultSessionRate
	}
	if config.IPRequestsPerMinute == 0 {
		config.IPRequestsPerMinute = defaultIPRate
	}
	if len(config.PublicIMAPPorts) == 0 {
		config.PublicIMAPPorts = []int{143, 993}
	}
	return config
}

func (config Config) Validate() error {
	config = config.withDefaults()
	if !config.PublicMode {
		return nil
	}
	if len([]byte(strings.TrimSpace(config.SessionSecret))) < minimumSessionSecretSize {
		return fmt.Errorf("MOVEMAILBOX_SESSION_SECRET must contain at least %d bytes in public mode", minimumSessionSecretSize)
	}
	if config.SessionTTL < 5*time.Minute || config.SessionTTL > 30*24*time.Hour {
		return errors.New("public session TTL must be between 5 minutes and 30 days")
	}
	if config.SessionRequestsPerMinute < 1 || config.IPRequestsPerMinute < 1 {
		return errors.New("public request limits must be positive")
	}
	for _, port := range config.PublicIMAPPorts {
		if port < 1 || port > 65535 {
			return errors.New("public IMAP ports must be between 1 and 65535")
		}
	}
	return nil
}

func newGuestGateway(config Config) *guestGateway {
	return &guestGateway{
		secret:       []byte(config.SessionSecret),
		ttl:          config.SessionTTL,
		sessionLimit: config.SessionRequestsPerMinute,
		ipLimit:      config.IPRequestsPerMinute,
		limiter:      newRequestLimiter(),
		now:          time.Now,
	}
}

func (gateway *guestGateway) wrap(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") || r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}

		principal, created, err := gateway.resolve(r)
		if err != nil {
			writeErrorCode(w, http.StatusServiceUnavailable, "session.unavailable", "secure session generation is unavailable")
			return
		}
		if !created && principal.expiresAt.Sub(gateway.now()) <= gateway.ttl/2 {
			principal.expiresAt = gateway.now().Add(gateway.ttl).UTC()
			created = true
		}
		if created {
			gateway.setCookie(w, principal)
		}
		if allowed, retry := gateway.limiter.allow("ip:"+requestIP(r), gateway.ipLimit, gateway.now()); !allowed {
			writeRateLimit(w, retry)
			return
		}
		if allowed, retry := gateway.limiter.allow("session:"+principal.id, gateway.sessionLimit, gateway.now()); !allowed {
			writeRateLimit(w, retry)
			return
		}
		if stateChanging(r.Method) && !hmac.Equal([]byte(r.Header.Get("X-CSRF-Token")), []byte(principal.csrfToken)) {
			writeErrorCode(w, http.StatusForbidden, "request.csrf.invalid", "CSRF token is missing or invalid")
			return
		}

		ctx := context.WithValue(r.Context(), principalContextKey{}, principal)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (gateway *guestGateway) resolve(r *http.Request) (guestPrincipal, bool, error) {
	now := gateway.now()
	if cookie, err := r.Cookie(guestCookieName); err == nil {
		if principal, ok := gateway.parse(cookie.Value, now); ok {
			return principal, false, nil
		}
	}
	principal, err := gateway.create(now)
	return principal, true, err
}

func (gateway *guestGateway) create(now time.Time) (guestPrincipal, error) {
	random := make([]byte, 32)
	if _, err := rand.Read(random); err != nil {
		return guestPrincipal{}, fmt.Errorf("secure session randomness is unavailable: %w", err)
	}
	id := base64.RawURLEncoding.EncodeToString(random)
	expiresAt := now.Add(gateway.ttl).UTC()
	return guestPrincipal{id: id, csrfToken: gateway.csrf(id), expiresAt: expiresAt}, nil
}

func (gateway *guestGateway) setCookie(w http.ResponseWriter, principal guestPrincipal) {
	http.SetCookie(w, &http.Cookie{
		Name:     guestCookieName,
		Value:    gateway.token(principal.id, principal.expiresAt),
		Path:     "/",
		Expires:  principal.expiresAt,
		MaxAge:   int(gateway.ttl / time.Second),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
}

func (gateway *guestGateway) token(id string, expiresAt time.Time) string {
	payload := id + "." + strconv.FormatInt(expiresAt.Unix(), 10)
	return payload + "." + gateway.mac("session:"+payload)
}

func (gateway *guestGateway) parse(token string, now time.Time) (guestPrincipal, bool) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return guestPrincipal{}, false
	}
	idBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil || len(idBytes) != 32 {
		return guestPrincipal{}, false
	}
	expiresUnix, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		return guestPrincipal{}, false
	}
	payload := parts[0] + "." + parts[1]
	expected, err := base64.RawURLEncoding.DecodeString(gateway.mac("session:" + payload))
	if err != nil {
		return guestPrincipal{}, false
	}
	provided, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || !hmac.Equal(provided, expected) {
		return guestPrincipal{}, false
	}
	expiresAt := time.Unix(expiresUnix, 0).UTC()
	if !expiresAt.After(now) || expiresAt.After(now.Add(gateway.ttl+time.Minute)) {
		return guestPrincipal{}, false
	}
	return guestPrincipal{id: parts[0], csrfToken: gateway.csrf(parts[0]), expiresAt: expiresAt}, true
}

func (gateway *guestGateway) csrf(id string) string { return gateway.mac("csrf:" + id) }

func (gateway *guestGateway) mac(value string) string {
	mac := hmac.New(sha256.New, gateway.secret)
	_, _ = mac.Write([]byte(value))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func principalFromRequest(r *http.Request) (guestPrincipal, bool) {
	principal, ok := r.Context().Value(principalContextKey{}).(guestPrincipal)
	return principal, ok && principal.id != ""
}

func stateChanging(method string) bool {
	switch method {
	case http.MethodGet, http.MethodHead, http.MethodOptions:
		return false
	default:
		return true
	}
}

func requestIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	if value := strings.Trim(strings.TrimSpace(r.RemoteAddr), "[]"); value != "" {
		return value
	}
	return "unknown"
}

func writeRateLimit(w http.ResponseWriter, retry time.Duration) {
	seconds := int((retry + time.Second - 1) / time.Second)
	if seconds < 1 {
		seconds = 1
	}
	w.Header().Set("Retry-After", strconv.Itoa(seconds))
	writeErrorCode(w, http.StatusTooManyRequests, "request.rate_limited", "request rate limit exceeded")
}

type rateWindow struct {
	started time.Time
	count   int
}

type requestLimiter struct {
	mu      sync.Mutex
	windows map[string]rateWindow
}

func newRequestLimiter() *requestLimiter {
	return &requestLimiter{windows: make(map[string]rateWindow)}
}

func (limiter *requestLimiter) allow(key string, limit int, now time.Time) (bool, time.Duration) {
	if limit < 0 {
		return true, 0
	}
	limiter.mu.Lock()
	defer limiter.mu.Unlock()
	started := now.Truncate(time.Minute)
	window := limiter.windows[key]
	if !window.started.Equal(started) {
		window = rateWindow{started: started}
	}
	if window.count >= limit {
		return false, started.Add(time.Minute).Sub(now)
	}
	window.count++
	limiter.windows[key] = window
	if len(limiter.windows) > 4096 {
		for candidate, value := range limiter.windows {
			if value.started.Before(started) {
				delete(limiter.windows, candidate)
			}
		}
	}
	return true, 0
}
