# Launch audit — 2026-10-23

## Вывод для владельца

Ядро миграции уже есть; нам не нужна ещё неделя разработки PostgreSQL, биллинга
и личного кабинета, чтобы начать бесплатный ограниченный пилот. Но публичный
сайт сейчас — честно обозначенный preview, а рабочий API находится за отдельным
приглашением. Это два разных развёртывания, не «уже работающий онлайн-сервис».

Конечный маршрут к запуску:

1. Исправления этого аудита → зелёный CI → обновлённая сборка и закрытая VM.
2. Один финальный перенос через рабочую форму на production HTTPS-адресе:
   папки/подпапка, прогресс, перезагрузка и отмена. Использовать тестовые ящики,
   не просить владельца вручную выполнять тест-кейсы. Не открывать сбор паролей
   на GitHub Pages без backend. Не ослаблять приглашение ради теста.
3. Подключить уведомления владельцу и продление сертификата. Срок текущего
   сертификата — примерно до 13 декабря; ручной DNS-01 не является автопродлением.
   Для DNS/SMTP/Telegram нужны права или реквизиты владельца, их нельзя выдумать.
4. Выпустить ограниченный бесплатный MVP. Платежи, аккаунты, команды, PostgreSQL,
   KMS и macOS-native acceptance оставить отдельными этапами, не обещать их сейчас.

Для стабильного публичного распространения исходников/бинарников также нужен
выбор лицензии владельцем. Нельзя самостоятельно выдать чужой код под новой
лицензией. Native Windows real-IMAP acceptance требует совместимого imapsync;
demo и успешная сборка не заменяют этот тест. До этого архивы — prerelease.

## Confirmed findings and fixes

| Priority | Finding | Resolution |
| --- | --- | --- |
| P1 | Go 1.27.0 build/runtime affected by reachable standard-library advisories; scheduled main CI red | Go 1.27.3 in module, CI, release and digest-pinned Docker builder; fresh vulnerability scan required |
| P1 | Browser cancel sent no JSON Content-Type; actual API returned 415 instead of cancelling | SDK sends `{}` with JSON header and CSRF; regression plus real browser recheck |
| P1 | Strict-mirror confirmation survived provider/security/port selection changes | Reset on both input/change for endpoint inputs and selects; browser reproduction plus regression |
| P2 | Cancelled job reset transferred/skipped/bytes to zero despite visible partial copying | Preserve last observed partial counters in the terminal view/event; these are not a guaranteed final provider inventory |
| P2 | Pinned sharp and retained source-map-js had high-severity advisories | sharp 0.35.5, source-map-js 1.2.2; Next 16.4.2, paired React/react-dom 19.3.1; production npm audit zero |
| P2 | Download buttons frozen on v0.4.0-preview | Shared release index including prereleases; no `/releases/latest` trap or not-yet-existing tag |
| P2 | Windows CSP generation used URL pathname, producing `C:\\C:\\...` | `fileURLToPath`; static build uses Node subprocesses instead of POSIX-only env syntax |
| P2 | `next lint` no longer exists | Explicit TypeScript check and compatible `lint` alias; not represented as an ESLint run |
| Maintenance | Independent React/ReactDOM bot updates conflicted | Dependabot runtime group; reviewed minor Actions/SQLite/x/sys updates included |

The npm peer-dependency failure examined at the start belonged to a Dependabot
PR, not evidence that original main's lockfile was inconsistent. Main's Go
security-scan failure was independently confirmed. No `--force`, disabled
certificate validation, `--legacy-peer-deps` or removed security checks used.

Primary Go release evidence: [Go release history](https://go.dev/doc/devel/release#go1.27.3).
Package versions/advisories were checked against the npm registry/audit and
Actions tag SHAs against their official repositories. Updating dependencies
is not proof of absence of unknown vulnerabilities or a full penetration test.

## Acceptance scope

- Local pinned Go: race-enabled suite, vet and reachable-vulnerability scan.
- Linux Python operational harnesses; local age integration may be skipped when
  age tools are absent, while CI installs the pinned tools.
- SDK and mirror-reset transport/interaction regressions.
- Native Windows browser against embedded UI on isolated loopback/demo state:
  fields, connection/folders, selected INBOX, running reload, cancellation,
  dangerous confirmation reset. This is **demo**, not native real IMAP.
- Static export: 247 generated routes, 243 sitemap URLs, CSP on 246 HTML pages,
  canonical/link/404/robots/placeholder checks and source type checking.
- Public live SEO: 243 sitemap pages and 272 internal URLs passed, including
  verified HTTPS, redirects, unique metadata/JSON-LD and disabled preview fields.
  One initial route fetch returned transient 503; isolated fetch and complete
  subsequent pass succeeded. This is availability evidence, not a Google ranking
  or Search Console indexing guarantee.
- Closed VM baseline: containers healthy, readiness 200, no active work or
  envelopes, about 29 GiB available, monitor active and gateway TLS valid.
- Existing external HTTPS pilot gate passed guest cookie/CSRF/Origin/Host and
  temporary invitation revocation. Optional `--load` is bounded to 80 readiness
  requests/four clients; it does not measure IMAP throughput or stress providers.

Promotion, fresh real-mail fixture results, load measurements, exact CI/PR and
published-versus-deployed versions must be recorded in the latest
[handoff](HANDOFF.md), not inferred from older successful tests.

## Explicit remaining limits

- Public Pages is static; do not enable password fields or claim a migration can
  run there. Public self-service needs a chosen HTTPS API/UI origin and explicit
  owner approval of public exposure. Do not change virtualization/VPN routing.
- The browser automation surface cannot open the HTTP Basic-auth protected
  pilot directly (invalid-auth browser error). Programmatic HTTPS acceptance
  remains possible; no auth/security bypass was used to manufacture a UI pass.
- Notifications, independent external heartbeat and automatic DNS certificate
  renewal are not configured. Local journal alone cannot notify if the VM dies.
- Off-site backup remains deferred by owner. Record the accepted recovery risk;
  do not claim a VM-local snapshot is independent off-site recovery.
- No new stable license, billing, native real-Windows provider coverage,
  notarization or signing is implied by an audit/prerelease.
