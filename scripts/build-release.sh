#!/usr/bin/env bash
# Build only native release archives. Call after npm run export from web/.
set -euo pipefail

: "${RELEASE_TAG:?release tag required}" "${GITHUB_SHA:?full source commit required}"
[[ "${RELEASE_TAG}" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]
[[ "${GITHUB_SHA}" =~ ^[0-9a-f]{40}$ ]]
if [[ "${RELEASE_TAG}" != *-* && ! -f LICENSE ]]; then
  echo 'Stable release requires an owner-approved LICENSE; use an explicit prerelease tag.' >&2
  exit 1
fi
test -f internal/web/out/index.html
test -d internal/web/out/_next/static
# Fail rather than mix fresh artifacts with an older/user-owned output directory.
test ! -e dist
test ! -L dist
mkdir dist
version="${RELEASE_TAG#v}"
archives=()
for target in windows/amd64 linux/amd64 linux/arm64 darwin/amd64 darwin/arm64; do
  goos="${target%/*}"
  goarch="${target#*/}"
  package="movemailbox-${goos}-${goarch}-${RELEASE_TAG}"
  suffix=""
  if [[ "${goos}" == windows ]]; then suffix=".exe"; fi
  mkdir -p "dist/${package}/operations"
  GOOS="${goos}" GOARCH="${goarch}" CGO_ENABLED=0 go build -mod=readonly -trimpath \
    -ldflags="-s -w -X github.com/Anton-Babaskin/MoveMailbox/internal/api.Version=${version}" \
    -o "dist/${package}/movemailbox${suffix}" ./cmd/mailbox-migrator
  cp README.md SECURITY.md docs/LICENSING.md "dist/${package}/"
  if [[ -f LICENSE ]]; then cp LICENSE "dist/${package}/"; fi
  cp docs/WORKER.md docs/BACKUP-RUNBOOK.md "dist/${package}/operations/"
  cp scripts/backup_archive.py scripts/backup_validation.py "dist/${package}/operations/"
  printf 'Version: %s\nCommit: %s\nPlatform: %s\n' "${RELEASE_TAG}" "${GITHUB_SHA}" "${target}" > "dist/${package}/BUILD-INFO.txt"
  go version -m "dist/${package}/movemailbox${suffix}" > "dist/${package}/BUILD-DEPENDENCIES.txt"
  if [[ "${goos}" == windows ]]; then
    cp scripts/windows/START-DEMO.cmd scripts/windows/START-DEMO-DEBUG.cmd scripts/windows/START-REAL.cmd scripts/windows/README-RU.txt "dist/${package}/"
    (cd dist && zip -qr "${package}.zip" "${package}")
    archives+=("${package}.zip")
  else
    cp scripts/README-UNIX.txt "dist/${package}/"
    tar -czf "dist/${package}.tar.gz" -C dist "${package}"
    archives+=("${package}.tar.gz")
  fi
done
(cd dist && sha256sum "${archives[@]}" > SHA256SUMS.txt)
