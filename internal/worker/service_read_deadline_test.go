package worker

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"sync"
	"testing"
	"time"
)

type observedRequestBody struct {
	io.ReadCloser
	once    sync.Once
	started chan struct{}
}

func (body *observedRequestBody) Read(p []byte) (int, error) {
	body.once.Do(func() { close(body.started) })
	return body.ReadCloser.Read(p)
}

// Use a real TCP connection: a recorder cannot reproduce a blocked socket read.
func TestOperationIncompleteBodyReleasesWorker(t *testing.T) {
	for _, test := range []struct {
		name, method, path string
		shutdown           bool
	}{
		{"operation-timeout", "POST", "/v1/operations/" + operationTestConnection, false},
		{"operation-shutdown", "POST", "/v1/operations/" + operationTestConnection, true},
		{"admission-shutdown", "PUT", "/v1/jobs/incomplete-body", true},
	} {
		t.Run(test.name, func(t *testing.T) {
			_, privateKey, token := remoteTestSecrets(t)
			timeout := 150 * time.Millisecond
			if test.shutdown {
				timeout = time.Minute
			}
			service, err := NewService(ServiceConfig{
				DatabasePath: filepath.Join(t.TempDir(), "worker.db"),
				PrivateKey:   privateKey, Token: token, Engine: &remoteTestEngine{},
				OperationTimeout: timeout,
			})
			if err != nil {
				t.Fatal(err)
			}
			if err := service.Start(context.Background()); err != nil {
				t.Fatal(err)
			}
			defer shutdownRemoteTestService(t, service)
			started, finished := make(chan struct{}), make(chan struct{})
			handler := service.Handler()
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				r.Body = &observedRequestBody{ReadCloser: r.Body, started: started}
				handler.ServeHTTP(w, r)
				close(finished)
			}))
			defer server.Close()
			conn, err := net.DialTimeout("tcp", server.Listener.Addr().String(), time.Second)
			if err != nil {
				t.Fatal(err)
			}
			defer conn.Close()
			if _, err := fmt.Fprintf(conn, "%s %s HTTP/1.1\r\nHost: test\r\nAuthorization: Bearer %s\r\nContent-Length: 100\r\n\r\n{", test.method, test.path, token); err != nil {
				t.Fatal(err)
			}
			select {
			case <-started:
			case <-time.After(2 * time.Second):
				t.Fatal("handler did not begin reading")
			}
			if test.shutdown {
				ctx, cancel := context.WithTimeout(context.Background(), time.Second)
				err := service.Shutdown(ctx)
				cancel()
				if err != nil {
					t.Fatalf("incomplete body blocked shutdown: %v", err)
				}
			}
			select {
			case <-finished:
			case <-time.After(time.Second):
				t.Fatal("operation timeout did not interrupt body read")
			}
			select {
			case service.slots <- struct{}{}:
				<-service.slots
			case <-time.After(time.Second):
				t.Fatal("worker slot did not become available")
			}
		})
	}
}
