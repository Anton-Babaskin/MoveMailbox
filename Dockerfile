FROM golang:1.24-bookworm AS builder

WORKDIR /src
COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal

RUN go test ./...
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/mailbox-migrator ./cmd/mailbox-migrator

FROM gilleslamiral/imapsync:latest

USER root
COPY --from=builder /out/mailbox-migrator /usr/local/bin/mailbox-migrator

ENV MM_ADDR=0.0.0.0:8080 \
    MM_IMAPSYNC_BIN=imapsync \
    MM_MAX_CONCURRENT=2 \
    MM_OPEN_BROWSER=false

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/mailbox-migrator"]
