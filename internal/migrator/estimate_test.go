package migrator

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"net"
	"os"
	"strings"
	"testing"
)

// Opt-in read-only smoke test. Supply credentials through the test process
// environment, never in a tracked file or command-line flag.
func TestLiveMailboxEstimate(t *testing.T) {
	host := os.Getenv("MOVEMAILBOX_TEST_IMAP_HOST")
	if host == "" {
		t.Skip("live mailbox not configured")
	}
	user, password := os.Getenv("MOVEMAILBOX_TEST_IMAP_USER"), os.Getenv("MOVEMAILBOX_TEST_IMAP_PASSWORD")
	if user == "" || password == "" {
		t.Fatal("live test credentials incomplete")
	}
	estimate, err := (ImapsyncEngine{}).EstimateMailbox(context.Background(), Endpoint{Host: host, Port: 993, Security: SecurityTLS, Username: user, Password: password})
	if err != nil {
		t.Fatal("live read-only inventory failed (upstream details withheld)")
	}
	t.Logf("read-only inventory: %d bytes, %d messages, %d folders", estimate.Bytes, estimate.Messages, estimate.Folders)
}

type estimatedTestEngine struct {
	DemoEngine
	estimate MailboxEstimate
	err      error
	called   bool
}

type growingEstimateEngine struct {
	estimatedTestEngine
	calls int
}

func (e *growingEstimateEngine) EstimateMailbox(context.Context, Endpoint) (MailboxEstimate, error) {
	e.calls++
	if e.calls == 1 {
		return MailboxEstimate{Bytes: 400, Messages: 1, Folders: 1}, nil
	}
	return MailboxEstimate{Bytes: 600, Messages: 2, Folders: 1}, nil
}

func (e *estimatedTestEngine) EstimateMailbox(context.Context, Endpoint) (MailboxEstimate, error) {
	return e.estimate, e.err
}
func (e *estimatedTestEngine) Migrate(context.Context, Request, func(Event)) (Result, error) {
	e.called = true
	return Result{}, nil
}

func TestQuotaAdmission(t *testing.T) {
	for _, tc := range []struct {
		name        string
		size, limit int64
		failure     bool
		allowed     bool
	}{
		{"below", 4999999999, 5000000000, false, true},
		{"equal", 5000000000, 5000000000, false, true},
		{"above", 5000000001, 5000000000, false, false},
		{"unavailable", 0, 5000000000, true, false},
		{"negative size", -1, 5000000000, false, false},
		{"invalid limit", 1, -1, false, false},
		{"explicit unlimited", 9000000000, 0, false, true},
	} {
		t.Run(tc.name, func(t *testing.T) {
			engine := &estimatedTestEngine{estimate: MailboxEstimate{Bytes: tc.size}}
			if tc.failure {
				engine.err = errors.New("secret upstream details")
			}
			request := Request{Source: Endpoint{Host: "source.test", Port: 993, Security: SecurityTLS, Username: "u", Password: "p"}, Destination: Endpoint{Host: "dest.test", Port: 993, Security: SecurityTLS, Username: "u", Password: "p"}, Options: Options{Folders: []string{"Tiny"}}}
			_, err := (QuotaEngine{Engine: engine, MaxMailboxBytes: tc.limit}).Migrate(context.Background(), request, nil)
			if engine.called != tc.allowed {
				t.Fatalf("migration called=%v, want %v; error=%v", engine.called, tc.allowed, err)
			}
			if !tc.allowed && !errors.Is(err, ErrMailboxPolicy) {
				t.Fatalf("expected permanent policy failure: %v", err)
			}
			if err != nil && strings.Contains(err.Error(), "secret") {
				t.Fatal("upstream details leaked")
			}
		})
	}
}

func TestQuotaAdmissionRejectsMailboxGrowthBetweenInventories(t *testing.T) {
	engine := &growingEstimateEngine{}
	request := Request{Source: Endpoint{Host: "source.test", Port: 993, Security: SecurityTLS, Username: "u", Password: "p"}, Destination: Endpoint{Host: "dest.test", Port: 993, Security: SecurityTLS, Username: "u", Password: "p"}}
	_, err := (QuotaEngine{Engine: engine, MaxMailboxBytes: 500}).Migrate(context.Background(), request, nil)
	if !errors.Is(err, ErrMailboxPolicy) {
		t.Fatalf("expected growth to be rejected, got %v", err)
	}
	if engine.calls != 2 || engine.called {
		t.Fatalf("growth check calls=%d migrationCalled=%v", engine.calls, engine.called)
	}
}

func TestNativeMailboxEstimate(t *testing.T) {
	for _, mode := range []string{"complete", "missing", "duplicate", "changed", "zero", "denied"} {
		t.Run(mode, func(t *testing.T) {
			listener, err := net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer listener.Close()
			done := make(chan struct{})
			go func() {
				defer close(done)
				conn, err := listener.Accept()
				if err != nil {
					return
				}
				defer conn.Close()
				fmt.Fprint(conn, "* OK [CAPABILITY IMAP4rev1] ready\r\n")
				scanner := bufio.NewScanner(conn)
				examines := 0
				for scanner.Scan() {
					parts := strings.Fields(scanner.Text())
					if len(parts) < 2 {
						return
					}
					tag, cmd := parts[0], parts[1]
					switch cmd {
					case "CAPABILITY":
						fmt.Fprint(conn, "* CAPABILITY IMAP4rev1\r\n")
					case "LOGIN":
					case "LIST":
						fmt.Fprint(conn, "* LIST (\\Noselect) \"/\" \"Parent\"\r\n* LIST () \"/\" \"INBOX\"\r\n* LIST () \"/\" \"Empty\"\r\n")
					case "EXAMINE":
						examines++
						if mode == "denied" {
							fmt.Fprintf(conn, "%s NO denied\r\n", tag)
							continue
						}
						count := 2
						if strings.Contains(scanner.Text(), "Empty") {
							count = 0
						}
						next := 3
						if mode == "changed" && examines > 1 {
							next = 4
						}
						fmt.Fprintf(conn, "* %d EXISTS\r\n* OK [UIDVALIDITY 1] valid\r\n* OK [UIDNEXT %d] next\r\n", count, next)
					case "FETCH":
						size := 100
						if mode == "zero" {
							size = 0
						}
						fmt.Fprintf(conn, "* 1 FETCH (UID 1 RFC822.SIZE %d)\r\n", size)
						uid := 2
						if mode == "duplicate" {
							uid = 1
						}
						if mode != "missing" {
							fmt.Fprintf(conn, "* 2 FETCH (UID %d RFC822.SIZE 200)\r\n", uid)
						}
					case "LOGOUT":
						fmt.Fprintf(conn, "* BYE bye\r\n%s OK logout\r\n", tag)
						return
					default:
						fmt.Fprintf(conn, "%s BAD unexpected command\r\n", tag)
						continue
					}
					fmt.Fprintf(conn, "%s OK done\r\n", tag)
				}
			}()
			host, port := splitTestAddress(t, listener.Addr().String())
			estimate, err := (ImapsyncEngine{}).EstimateMailbox(context.Background(), Endpoint{Host: host, Port: port, Security: SecurityPlain, Username: "u", Password: "p"})
			<-done
			if mode == "complete" {
				if err != nil || estimate.Bytes != 300 || estimate.Messages != 2 || estimate.Folders != 2 {
					t.Fatalf("estimate=%+v err=%v", estimate, err)
				}
			} else if err == nil || estimate.Bytes != 0 {
				t.Fatalf("must fail closed: %+v %v", estimate, err)
			}
		})
	}
}
