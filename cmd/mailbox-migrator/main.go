package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
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
	"github.com/Anton-Babaskin/MoveMailbox/internal/credentials"
	"github.com/Anton-Babaskin/MoveMailbox/internal/jobs"
	"github.com/Anton-Babaskin/MoveMailbox/internal/migrator"
	"github.com/Anton-Babaskin/MoveMailbox/internal/worker"
)

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "worker":
			os.Exit(runWorker(os.Args[2:]))
		case "worker-service":
			os.Exit(runWorkerService(os.Args[2:]))
		case "keygen":
			os.Exit(runKeygen(os.Stdout))
		}
	}
	if err := validateEnvironment(false, os.Getenv); err != nil {
		log.Fatal(err)
	}
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
	credentialTTL := flag.Duration("credential-ttl", envDuration("MOVEMAILBOX_CREDENTIAL_TTL", 24*time.Hour), "maximum lifetime of an encrypted migration credential envelope")
	workerLeaseTTL := flag.Duration("worker-lease-ttl", envDuration("MOVEMAILBOX_WORKER_LEASE_TTL", 2*time.Hour), "exclusive lease duration for one isolated migration worker")
	workerURL := flag.String("worker-url", env("MOVEMAILBOX_WORKER_URL", ""), "independent worker service URL for public mode")
	workerPublicKey := flag.String("worker-public-key", env("MOVEMAILBOX_WORKER_PUBLIC_KEY", ""), "base64 X25519 public key for the independent worker")
	workerToken := os.Getenv("MOVEMAILBOX_WORKER_TOKEN")
	workerAllowHTTP := envBool("MOVEMAILBOX_WORKER_ALLOW_HTTP", false)
	embeddedWorker := flag.Bool("embedded-worker", envBool("MOVEMAILBOX_EMBEDDED_WORKER", false), "allow the legacy child worker in public mode (development only)")
	flag.Parse()
	if os.Getenv("MOVEMAILBOX_WORKER_PRIVATE_KEY") != "" {
		log.Fatal("private worker key must not be present in the API environment")
	}
	_ = os.Unsetenv("MOVEMAILBOX_WORKER_TOKEN")
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
		if *publicMode {
			log.Fatal("публичный режим требует SQLite для зашифрованных credential envelopes")
		}
		manager = jobs.NewManagerWithConfig(engine, managerConfig)
		log.Printf("История заданий хранится только в памяти")
	} else {
		store, openErr := jobs.OpenSQLiteStore(*databasePath)
		if openErr != nil {
			log.Fatalf("не удалось открыть историю заданий: %v", openErr)
		}
		if *publicMode {
			if strings.TrimSpace(*workerURL) != "" {
				remoteRunner, workerErr := worker.NewRemoteRunner(worker.RemoteConfig{
					URL: *workerURL, PublicKey: *workerPublicKey, Token: workerToken, AllowHTTP: workerAllowHTTP,
					CredentialTTL: *credentialTTL,
				})
				workerToken = ""
				if workerErr != nil {
					_ = store.Close()
					log.Fatalf("не удалось настроить независимый worker: %v", workerErr)
				}
				engine = remoteRunner
				manager, err = jobs.NewManagerWithWorker(engine, remoteRunner, managerConfig, store)
			} else if *embeddedWorker {
				processRunner, workerErr := worker.NewProcessRunner(worker.ProcessConfig{
					DatabasePath:   *databasePath,
					ImapsyncBinary: *imapsyncBinary,
					MasterKey:      os.Getenv("MOVEMAILBOX_MASTER_KEY"),
					CredentialTTL:  *credentialTTL,
					LeaseTTL:       *workerLeaseTTL,
					Demo:           *demo,
				})
				if workerErr != nil {
					_ = store.Close()
					log.Fatalf("не удалось настроить встроенный worker: %v", workerErr)
				}
				_ = os.Unsetenv("MOVEMAILBOX_MASTER_KEY")
				engine = processRunner
				manager, err = jobs.NewManagerWithWorker(engine, processRunner, managerConfig, store)
				log.Printf("ПРЕДУПРЕЖДЕНИЕ: встроенный worker предназначен только для разработки")
			} else {
				_ = store.Close()
				log.Fatal("публичный режим требует MOVEMAILBOX_WORKER_URL или явный MOVEMAILBOX_EMBEDDED_WORKER=true для разработки")
			}
		} else {
			manager, err = jobs.NewManagerWithStore(engine, managerConfig, store)
		}
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
		log.Printf("Публичный режим: гостевые сессии и защищённый worker включены")
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

func runWorkerService(arguments []string) int {
	if err := validateEnvironment(true, os.Getenv); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 2
	}
	mailboxLimit, err := strconv.ParseInt(env("MOVEMAILBOX_MAX_MAILBOX_BYTES", "5000000000"), 10, 64)
	if err != nil || mailboxLimit < 0 {
		fmt.Fprintln(os.Stderr, "invalid MOVEMAILBOX_MAX_MAILBOX_BYTES")
		return 2
	}
	flags := flag.NewFlagSet("worker-service", flag.ContinueOnError)
	flags.SetOutput(io.Discard)
	address := flags.String("addr", env("MOVEMAILBOX_WORKER_ADDR", "0.0.0.0:8090"), "worker service listen address")
	databasePath := flags.String("database", env("MOVEMAILBOX_WORKER_DATABASE", "/data/worker.db"), "worker service SQLite path")
	imapsyncBinary := flags.String("imapsync", env("MOVEMAILBOX_IMAPSYNC_BIN", "imapsync"), "path to imapsync executable")
	demo := flags.Bool("demo", envBool("MOVEMAILBOX_DEMO", false), "use the built-in demo engine")
	maxConcurrent := flags.Int("max-concurrent", envInt("MOVEMAILBOX_WORKER_MAX_CONCURRENT", 2), "maximum concurrent worker jobs")
	maxMailboxBytes := flags.Int64("max-mailbox-bytes", mailboxLimit, "entire source mailbox limit in bytes; 0 explicitly disables quota")
	maxAttempts := flags.Int("max-attempts", envInt("MOVEMAILBOX_WORKER_MAX_ATTEMPTS", 3), "maximum attempts after interrupted or failed work")
	leaseTTL := flags.Duration("lease-ttl", envDuration("MOVEMAILBOX_WORKER_LEASE_TTL", 30*time.Second), "renewable credential lease duration")
	maxJobs := flags.Int("max-jobs", envInt("MOVEMAILBOX_WORKER_MAX_JOBS", 1024), "maximum queued and retained worker records")
	jobTimeout := flags.Duration("job-timeout", envDuration("MOVEMAILBOX_WORKER_JOB_TIMEOUT", 24*time.Hour), "maximum duration of one worker attempt")
	resumeInterrupted := flags.Bool("resume-interrupted", envBool("MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED", false), "retry interrupted non-destructive jobs; requires whole-process-tree supervision")
	if err := flags.Parse(arguments); err != nil || flags.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "invalid worker service arguments")
		return 2
	}
	var engine migrator.Engine = migrator.ImapsyncEngine{Binary: *imapsyncBinary}
	if *demo {
		engine = migrator.DemoEngine{}
	}
	if *maxMailboxBytes < 0 {
		return 2
	}
	engine = migrator.QuotaEngine{Engine: engine, MaxMailboxBytes: *maxMailboxBytes}
	service, err := worker.NewService(worker.ServiceConfig{
		DatabasePath:      *databasePath,
		PrivateKey:        os.Getenv("MOVEMAILBOX_WORKER_PRIVATE_KEY"),
		Token:             os.Getenv("MOVEMAILBOX_WORKER_TOKEN"),
		Engine:            engine,
		MaxConcurrent:     *maxConcurrent,
		MaxAttempts:       *maxAttempts,
		LeaseTTL:          *leaseTTL,
		MaxJobs:           *maxJobs,
		JobTimeout:        *jobTimeout,
		ResumeInterrupted: *resumeInterrupted,
	})
	_ = os.Unsetenv("MOVEMAILBOX_WORKER_PRIVATE_KEY")
	_ = os.Unsetenv("MOVEMAILBOX_WORKER_TOKEN")
	if err != nil {
		log.Printf("не удалось настроить worker service: %v", err)
		return 1
	}
	rootContext, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := service.Start(rootContext); err != nil {
		log.Printf("не удалось запустить очередь worker service: %v", err)
		return 1
	}
	server := &http.Server{
		Addr:              *address,
		Handler:           service.Handler(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		IdleTimeout:       70 * time.Second,
		MaxHeaderBytes:    16 << 10,
	}
	serverErrors := make(chan error, 1)
	go func() {
		err := server.ListenAndServe()
		if errors.Is(err, http.ErrServerClosed) {
			err = nil
		}
		serverErrors <- err
	}()
	log.Printf("MoveMailbox worker service запущен: %s (engine=%s)", *address, engine.Name())
	select {
	case <-rootContext.Done():
	case err := <-serverErrors:
		if err != nil {
			log.Printf("ошибка worker service: %v", err)
		}
		stop()
	}
	shutdownContext, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownContext)
	if err := service.Shutdown(shutdownContext); err != nil {
		log.Printf("worker service завершился не полностью: %v", err)
		return 1
	}
	return 0
}

func runKeygen(output io.Writer) int {
	publicKey, privateKey, err := credentials.GenerateRecipientKeyPair()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer func() {
		for index := range privateKey {
			privateKey[index] = 0
		}
	}()
	token := make([]byte, 32)
	if _, err := rand.Read(token); err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	defer func() {
		for index := range token {
			token[index] = 0
		}
	}()
	_, err = fmt.Fprintf(output, "MOVEMAILBOX_WORKER_PUBLIC_KEY=%s\nMOVEMAILBOX_WORKER_PRIVATE_KEY=%s\nMOVEMAILBOX_WORKER_TOKEN=%s\n",
		base64.StdEncoding.EncodeToString(publicKey),
		base64.StdEncoding.EncodeToString(privateKey),
		base64.StdEncoding.EncodeToString(token),
	)
	if err != nil {
		return 1
	}
	return 0
}

func runWorker(arguments []string) int {
	flags := flag.NewFlagSet("worker", flag.ContinueOnError)
	flags.SetOutput(io.Discard)
	jobID := flags.String("job-id", "", "credential envelope job ID")
	workerID := flags.String("worker-id", "", "worker lease owner ID")
	operation := flags.String("operation", "migrate", "isolated worker operation")
	envelopeID := flags.String("envelope-id", "", "transient credential envelope ID")
	databasePath := flags.String("database", "", "credential envelope SQLite path")
	imapsyncBinary := flags.String("imapsync", "imapsync", "path to imapsync executable")
	demo := flags.Bool("demo", false, "use the built-in demo migration engine")
	leaseTTL := flags.Duration("lease-ttl", 2*time.Hour, "exclusive credential lease duration")
	if err := flags.Parse(arguments); err != nil || flags.NArg() != 0 {
		fmt.Fprintln(os.Stderr, "invalid isolated worker arguments")
		return 2
	}
	masterKey, err := credentials.ParseMasterKey(os.Getenv("MOVEMAILBOX_MASTER_KEY"))
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 2
	}
	// The worker needs the master key to open the envelope, but imapsync and
	// any helpers it launches must never inherit it.
	_ = os.Unsetenv("MOVEMAILBOX_MASTER_KEY")
	defer func() {
		for index := range masterKey {
			masterKey[index] = 0
		}
	}()
	var engine migrator.Engine = migrator.ImapsyncEngine{Binary: *imapsyncBinary}
	if *demo {
		engine = migrator.DemoEngine{}
	}
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	if *operation == "migrate" {
		err = worker.Execute(ctx, worker.ExecuteConfig{
			JobID:        *jobID,
			WorkerID:     *workerID,
			DatabasePath: *databasePath,
			MasterKey:    masterKey,
			LeaseTTL:     *leaseTTL,
			Engine:       engine,
			Output:       os.Stdout,
		})
	} else {
		err = worker.ExecuteTransient(ctx, worker.TransientConfig{
			EnvelopeID: *envelopeID,
			Operation:  *operation,
			MasterKey:  masterKey,
			Engine:     engine,
			Input:      os.Stdin,
			Output:     os.Stdout,
		})
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		return 1
	}
	return 0
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
		log.Printf("Некорректное значение %s; используется значение по умолчанию", name)
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
		log.Printf("Некорректное значение %s; используется значение по умолчанию", name)
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
		log.Printf("Некорректное значение %s; используется значение по умолчанию", name)
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
