package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/Anton-Babaskin/MoveMailbox/internal/api"
	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
)

func main() {
	logFile := setupLogging()
	if logFile != nil {
		defer logFile.Close()
	}

	address := flag.String("addr", env("MOVEMAILBOX_ADDR", env("MM_ADDR", "127.0.0.1:8080")), "HTTP listen address")
	imapsyncBinary := flag.String("imapsync", env("MOVEMAILBOX_IMAPSYNC_BIN", env("MM_IMAPSYNC_BIN", "imapsync")), "path to imapsync executable")
	demo := flag.Bool("demo", envBool("MOVEMAILBOX_DEMO", envBool("MM_DEMO", false)), "use the built-in demo migration engine")
	openBrowser := flag.Bool("open", envBool("MOVEMAILBOX_OPEN_BROWSER", envBool("MM_OPEN_BROWSER", true)), "open the interface in the default browser")
	maxConcurrent := flag.Int("max-concurrent", envInt("MOVEMAILBOX_MAX_CONCURRENT", envInt("MM_MAX_CONCURRENT", 2)), "maximum number of concurrent migrations")
	maxJobs := flag.Int("max-jobs", envInt("MOVEMAILBOX_MAX_JOBS", 256), "maximum number of queued and retained migration jobs")
	historyTTL := flag.Duration("history-ttl", envDuration("MOVEMAILBOX_HISTORY_TTL", 24*time.Hour), "how long completed job history is retained")
	databasePath := flag.String("database", env("MOVEMAILBOX_DATABASE", defaultDatabasePath()), "SQLite history path, or 'off' to keep history in memory")
	allowedHostsFlag := flag.String("allowed-hosts", env("MOVEMAILBOX_ALLOWED_HOSTS", ""), "comma-separated additional HTTP Host values allowed by the local API")
	publicMode := flag.Bool("public", envBool("MOVEMAILBOX_PUBLIC_MODE", false), "enable protected guest sessions for deployment behind HTTPS")
	maxActivePerSession := flag.Int("max-active-per-session", envInt("MOVEMAILBOX_MAX_ACTIVE_PER_SESSION", 1), "maximum active migrations for one guest session in public mode")
	sessionTTL := flag.Duration("session-ttl", envDuration("MOVEMAILBOX_SESSION_TTL", 24*time.Hour), "guest session lifetime in public mode")
	sessionRate := flag.Int("session-rate", envInt("MOVEMAILBOX_SESSION_REQUESTS_PER_MINUTE", 120), "requests per minute for one guest session")
	ipRate := flag.Int("ip-rate", envInt("MOVEMAILBOX_IP_REQUESTS_PER_MINUTE", 600), "requests per minute for one direct client IP")
	flag.Parse()
	apiConfig := api.Config{
		PublicMode:               *publicMode,
		SessionSecret:            os.Getenv("MOVEMAILBOX_SESSION_SECRET"),
		SessionTTL:               *sessionTTL,
		SessionRequestsPerMinute: *sessionRate,
		IPRequestsPerMinute:      *ipRate,
	}
	if err := apiConfig.Validate(); err != nil {
		log.Fatalf("неверная конфигурация публичного режима: %v", err)
	}

	var engine migrator.Engine = migrator.ImapsyncEngine{Binary: *imapsyncBinary}
	if *demo {
		engine = migrator.DemoEngine{}
	}
	listener, publicURL, reused, err := acquireListener(*address, *openBrowser)
	if err != nil {
		log.Fatalf("не удалось запустить %s: %v", api.ProductName, err)
	}
	if reused {
		log.Printf("%s уже запущен: %s", api.ProductName, publicURL)
		if err := openURL(publicURL); err != nil {
			log.Printf("не удалось открыть браузер автоматически: %v", err)
		}
		return
	}
	defer listener.Close()

	managerConfig := jobs.Config{
		MaxConcurrent: *maxConcurrent,
		MaxJobs:       *maxJobs,
		CompletedTTL:  *historyTTL,
	}
	if *publicMode {
		if *maxActivePerSession < 1 {
			*maxActivePerSession = 1
		}
		managerConfig.MaxActivePerOwner = *maxActivePerSession
	}
	var manager *jobs.Manager
	if strings.EqualFold(strings.TrimSpace(*databasePath), "off") {
		manager = jobs.NewManagerWithConfig(engine, managerConfig)
		log.Printf("История заданий хранится только в памяти")
	} else {
		store, openErr := jobs.OpenSQLiteStore(*databasePath)
		if openErr != nil {
			log.Fatalf("не удалось открыть историю заданий: %v", openErr)
		}
		manager, err = jobs.NewManagerWithStore(engine, managerConfig, store)
		if err != nil {
			log.Fatalf("не удалось восстановить историю заданий: %v", err)
		}
		log.Printf("История заданий: SQLite (%s)", *databasePath)
	}

	apiConfig.AllowedHosts = allowedHosts(listener, *allowedHostsFlag)
	server := &http.Server{
		Handler:           api.New(engine, manager, apiConfig),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		IdleTimeout:       70 * time.Second,
		MaxHeaderBytes:    32 << 10,
	}

	serveError := make(chan error, 1)
	go func() {
		err := server.Serve(listener)
		if err == http.ErrServerClosed {
			err = nil
		}
		serveError <- err
	}()
	log.Printf("%s запущен: %s (engine=%s)", api.ProductName, publicURL, engine.Name())
	if *publicMode {
		log.Printf("Публичный режим: защищённые гостевые сессии включены")
	}
	if *openBrowser {
		if err := openURL(publicURL); err != nil {
			log.Printf("не удалось открыть браузер автоматически: %v", err)
		}
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	select {
	case <-stop:
		log.Printf("Останавливаем %s", api.ProductName)
	case err := <-serveError:
		if err != nil {
			log.Printf("ошибка HTTP-сервера: %v", err)
		}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	managerStopped := make(chan error, 1)
	go func() { managerStopped <- manager.Shutdown(ctx) }()
	if err := server.Shutdown(ctx); err != nil && !errors.Is(err, context.Canceled) && !errors.Is(err, context.DeadlineExceeded) {
		log.Printf("ошибка остановки HTTP-сервера: %v", err)
	}
	if err := <-managerStopped; err != nil {
		log.Printf("не все миграции успели завершиться безопасно: %v", err)
	}
}

func acquireListener(address string, interactive bool) (net.Listener, string, bool, error) {
	listener, err := net.Listen("tcp", address)
	if err == nil {
		return listener, "http://" + browserAddress(listener.Addr().String()), false, nil
	}
	if !interactive || !isLoopbackAddress(address) {
		return nil, "", false, fmt.Errorf("адрес %s недоступен: %w", address, err)
	}

	requestedURL := "http://" + browserAddress(address)
	if isExistingInstance(requestedURL) {
		return nil, requestedURL, true, nil
	}

	fallback, fallbackErr := net.Listen("tcp", "127.0.0.1:0")
	if fallbackErr != nil {
		return nil, "", false, fmt.Errorf("порт занят, свободный порт также не найден: %w", fallbackErr)
	}
	actualURL := "http://" + browserAddress(fallback.Addr().String())
	log.Printf("Порт %s занят другой программой; используем %s", address, actualURL)
	return fallback, actualURL, false, nil
}

func isLoopbackAddress(address string) bool {
	host, _, err := net.SplitHostPort(address)
	if err != nil {
		return false
	}
	host = strings.Trim(host, "[]")
	if strings.EqualFold(host, "localhost") {
		return true
	}
	return net.ParseIP(host).IsLoopback()
}

func isExistingInstance(baseURL string) bool {
	client := &http.Client{Timeout: 1200 * time.Millisecond}
	response, err := client.Get(strings.TrimRight(baseURL, "/") + "/api/health")
	if err != nil {
		return false
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return false
	}
	var health struct {
		Product string `json:"product"`
		Status  string `json:"status"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, 16*1024)).Decode(&health); err != nil {
		return false
	}
	knownProduct := health.Product == api.ProductID || health.Product == api.LegacyProductID
	return knownProduct && health.Status == "ok"
}

func setupLogging() *os.File {
	if runtime.GOOS != "windows" {
		return nil
	}
	executable, err := os.Executable()
	if err != nil {
		return nil
	}
	file, err := os.OpenFile(filepath.Join(filepath.Dir(executable), "movemailbox.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o600)
	if err != nil {
		return nil
	}
	log.SetOutput(io.MultiWriter(os.Stderr, file))
	return file
}

func defaultDatabasePath() string {
	if configDirectory, err := os.UserConfigDir(); err == nil {
		return filepath.Join(configDirectory, "MoveMailbox", "movemailbox.db")
	}
	if executable, err := os.Executable(); err == nil {
		return filepath.Join(filepath.Dir(executable), "movemailbox.db")
	}
	return "movemailbox.db"
}

func env(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func envBool(name string, fallback bool) bool {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.ParseBool(value)
	if err != nil {
		log.Printf("Некорректное значение %s=%q; используется значение по умолчанию", name, value)
		return fallback
	}
	return parsed
}

func envInt(name string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		log.Printf("Некорректное значение %s=%q; используется значение по умолчанию", name, value)
		return fallback
	}
	return parsed
}

func envDuration(name string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(name))
	if value == "" {
		return fallback
	}
	parsed, err := time.ParseDuration(value)
	if err != nil {
		log.Printf("Некорректное значение %s=%q; используется значение по умолчанию", name, value)
		return fallback
	}
	return parsed
}

func browserAddress(address string) string {
	if strings.HasPrefix(address, ":") {
		return "127.0.0.1" + address
	}
	if strings.HasPrefix(address, "0.0.0.0:") {
		return "127.0.0.1:" + strings.TrimPrefix(address, "0.0.0.0:")
	}
	return address
}

func allowedHosts(listener net.Listener, configured string) []string {
	hosts := make(map[string]struct{})
	add := func(value string) {
		if value = strings.TrimSpace(value); value != "" {
			hosts[value] = struct{}{}
		}
	}
	host, port, err := net.SplitHostPort(listener.Addr().String())
	if err == nil {
		add(net.JoinHostPort("127.0.0.1", port))
		add(net.JoinHostPort("localhost", port))
		add(net.JoinHostPort("::1", port))
		host = strings.Trim(host, "[]")
		if ip := net.ParseIP(host); ip == nil || !ip.IsUnspecified() {
			add(net.JoinHostPort(host, port))
		}
	}
	for _, value := range strings.Split(configured, ",") {
		add(value)
	}
	result := make([]string, 0, len(hosts))
	for value := range hosts {
		result = append(result, value)
	}
	return result
}

func openURL(url string) error {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = exec.Command("rundll32.exe", "url.dll,FileProtocolHandler", url)
	case "darwin":
		command = exec.Command("open", url)
	default:
		command = exec.Command("xdg-open", url)
	}
	if err := command.Start(); err != nil {
		return err
	}
	return command.Process.Release()
}
