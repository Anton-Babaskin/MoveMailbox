package main

import (
	"context"
	"encoding/json"
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

	"github.com/Anton-Babaskin/mailbox-migrator/internal/api"
	"github.com/Anton-Babaskin/mailbox-migrator/internal/jobs"
	"github.com/Anton-Babaskin/mailbox-migrator/internal/migrator"
)

func main() {
	logFile := setupLogging()
	if logFile != nil {
		defer logFile.Close()
	}

	address := flag.String("addr", env("MM_ADDR", "127.0.0.1:8080"), "HTTP listen address")
	imapsyncBinary := flag.String("imapsync", env("MM_IMAPSYNC_BIN", "imapsync"), "path to imapsync executable")
	demo := flag.Bool("demo", envBool("MM_DEMO", false), "use the built-in demo migration engine")
	openBrowser := flag.Bool("open", envBool("MM_OPEN_BROWSER", true), "open the interface in the default browser")
	maxConcurrent := flag.Int("max-concurrent", envInt("MM_MAX_CONCURRENT", 2), "maximum number of concurrent migrations")
	flag.Parse()

	var engine migrator.Engine = migrator.ImapsyncEngine{Binary: *imapsyncBinary}
	if *demo {
		engine = migrator.DemoEngine{}
	}
	manager := jobs.NewManager(engine, *maxConcurrent)

	listener, publicURL, reused, err := acquireListener(*address, *openBrowser)
	if err != nil {
		log.Fatalf("не удалось запустить Mailbox Migrator: %v", err)
	}
	if reused {
		log.Printf("Mailbox Migrator уже запущен: %s", publicURL)
		if err := openURL(publicURL); err != nil {
			log.Printf("не удалось открыть браузер автоматически: %v", err)
		}
		return
	}
	defer listener.Close()

	server := &http.Server{
		Handler:           api.New(engine, manager),
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       70 * time.Second,
	}

	serveError := make(chan error, 1)
	go func() {
		err := server.Serve(listener)
		if err == http.ErrServerClosed {
			err = nil
		}
		serveError <- err
	}()
	log.Printf("Mailbox Migrator запущен: %s (engine=%s)", publicURL, engine.Name())
	if *openBrowser {
		if err := openURL(publicURL); err != nil {
			log.Printf("не удалось открыть браузер автоматически: %v", err)
		}
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	select {
	case <-stop:
		log.Print("Останавливаем Mailbox Migrator")
	case err := <-serveError:
		if err != nil {
			log.Fatalf("ошибка HTTP-сервера: %v", err)
		}
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	_ = server.Shutdown(ctx)
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
	return health.Product == "mailbox-migrator" && health.Status == "ok"
}

func setupLogging() *os.File {
	if runtime.GOOS != "windows" {
		return nil
	}
	executable, err := os.Executable()
	if err != nil {
		return nil
	}
	file, err := os.OpenFile(filepath.Join(filepath.Dir(executable), "mailbox-migrator.log"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o600)
	if err != nil {
		return nil
	}
	log.SetOutput(io.MultiWriter(os.Stderr, file))
	return file
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
	return command.Start()
}
