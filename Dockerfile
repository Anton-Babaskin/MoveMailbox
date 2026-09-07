ARG GO_IMAGE=golang:1.27.0-bookworm@sha256:ded31c68586d2e49e760acc2e65a884b23d032e9bbbed0ae0c55abd3fcaf4452
ARG IMAPSYNC_IMAGE=gilleslamiral/imapsync:2.319@sha256:161336e1a6db587bc42ea1126cfc9b6afa67ea92b408ea4c4454f7f771561aa4

FROM ${GO_IMAGE} AS builder

ENV GOTOOLCHAIN=local
WORKDIR /src
COPY go.* ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal

ARG VERSION=dev
ARG TARGETOS=linux
ARG TARGETARCH=amd64
RUN go test ./...
RUN CGO_ENABLED=0 go test -c -o /out/migrator-tests ./internal/migrator
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -trimpath \
    -ldflags="-s -w -X github.com/Anton-Babaskin/MoveMailbox/internal/api.Version=${VERSION}" \
    -o /out/movemailbox ./cmd/mailbox-migrator

FROM ${IMAPSYNC_IMAGE} AS runtime

ARG VERSION=dev
LABEL org.opencontainers.image.title="MoveMailbox" \
      org.opencontainers.image.description="Self-hosted IMAP mailbox migration interface" \
      org.opencontainers.image.source="https://github.com/Anton-Babaskin/MoveMailbox" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.licenses="NOASSERTION"

USER root
COPY --from=builder --chown=nobody:nogroup /out/movemailbox /usr/local/bin/movemailbox
RUN mkdir -p /data /worker-data && chown nobody:nogroup /data /worker-data

ENV MOVEMAILBOX_ADDR=0.0.0.0:8080 \
    MOVEMAILBOX_IMAPSYNC_BIN=imapsync \
    MOVEMAILBOX_MAX_CONCURRENT=2 \
    MOVEMAILBOX_DATABASE=/data/movemailbox.db \
    MOVEMAILBOX_OPEN_BROWSER=false

USER nobody:nogroup
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/api/health"]
ENTRYPOINT ["/usr/local/bin/movemailbox"]

FROM runtime AS tls-test
COPY --from=builder /out/migrator-tests /tmp/migrator-tests
RUN MOVEMAILBOX_TEST_REAL_IMAPSYNC=1 /tmp/migrator-tests -test.run '^TestRealImapsyncTLSVerification$' -test.v

# The default release image contains no test executable.
FROM runtime AS release
