#!/bin/bash
# Подготовка удалённой сессии Claude Code.
#
# 1. Зависимости сайта, чтобы сборка и проверки работали сразу.
# 2. Доверие к CA агент-прокси в хранилище браузера.
#
# Про второй пункт подробнее. Весь исходящий HTTPS в такой сессии идёт через
# прокси, который перевыпускает сертификаты своим CA. Curl и Node про этот CA
# знают — переменные окружения расставлены заранее. А headless Chromium читает
# отдельное хранилище NSS (~/.pki/nssdb), и оно наполняется один раз при
# создании контейнера. CA прокси с тех пор может смениться — тогда браузер
# отвечает ERR_CERT_AUTHORITY_INVALID на любой внешний адрес, и посмотреть
# живой сайт глазами становится нельзя.
#
# Правильное лечение — досыпать актуальный CA в хранилище браузера, а не
# отключать проверку сертификатов: с отключённой проверкой браузер перестанет
# замечать и настоящую подмену, а нам именно в браузере положено видеть ровно
# то же, что увидит посетитель.
set -euo pipefail

# Только в удалённой среде: на своей машине ни apt, ни чужого CA не нужно.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "session-start: зависимости сайта"
if [ -d "${CLAUDE_PROJECT_DIR:-.}/web" ]; then
  (cd "${CLAUDE_PROJECT_DIR:-.}/web" && npm install --no-audit --no-fund)
fi

CA_BUNDLE=/root/.ccr/ca-bundle.crt
NSSDB="$HOME/.pki/nssdb"

if [ ! -f "$CA_BUNDLE" ]; then
  echo "session-start: CA прокси не найден ($CA_BUNDLE) — браузеру доверять нечего, пропускаю"
  exit 0
fi

if ! command -v certutil >/dev/null 2>&1; then
  echo "session-start: ставлю certutil (libnss3-tools)"
  apt-get update -qq >/dev/null 2>&1 || true
  apt-get install -y -qq libnss3-tools >/dev/null 2>&1 || true
fi

if ! command -v certutil >/dev/null 2>&1; then
  echo "session-start: certutil недоступен — браузер останется без CA прокси"
  exit 0
fi

mkdir -p "$NSSDB"
if [ ! -f "$NSSDB/cert9.db" ]; then
  certutil -d "sql:$NSSDB" -N --empty-password
fi

# Из бандла берём только сертификаты нашего прокси: остальные полторы сотни —
# обычные публичные корни, они у браузера и так есть.
python3 - "$CA_BUNDLE" "$NSSDB" <<'PY'
import os
import re
import subprocess
import sys
import tempfile

bundle, nssdb = sys.argv[1], sys.argv[2]
certs = re.findall(
    r'-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----',
    open(bundle, encoding='utf-8', errors='replace').read(), re.S)

added = 0
for i, cert in enumerate(certs, 1):
    subject = subprocess.run(['openssl', 'x509', '-noout', '-subject'],
                             input=cert, capture_output=True, text=True).stdout
    if not any(key in subject for key in ('Anthropic', 'CCR', 'Egress')):
        continue
    with tempfile.NamedTemporaryFile('w', suffix='.pem', delete=False) as handle:
        handle.write(cert + '\n')
        path = handle.name
    # -A поверх существующего имени просто перезаписывает запись: повторный
    # запуск хука ничего не ломает и подхватывает сменившийся CA.
    subprocess.run(['certutil', '-d', f'sql:{nssdb}', '-A', '-t', 'C,,',
                    '-n', f'ccr-proxy-{i}', '-i', path], check=True)
    os.unlink(path)
    added += 1

print(f'session-start: в хранилище браузера добавлено сертификатов прокси: {added}')
PY
