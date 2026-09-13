# Engineering handoff — 2026-09-13

## Backend native progress counters (feature/backend-progress-counters)

- Safely fast-forwarded main to `8701fed`; PRs #22/#23/#24 are merged, no open
  PR remained, and both main push workflows passed for that exact SHA.
- Added optional native `totalMessages`, `remainingMessages`, `totalBytes` and
  `etaSeconds` to events and job views. Unknown values remain omitted, observed
  zero survives JSON, and `countersUpdated` explicitly replaces/clears observations.
  New attempts reset counters; terminal views clear ETA without inventing zero
  remaining messages. Bounded worker event retention preserves observations.
- Corrected the proposal below: native ETA is still an estimate, and whole-mailbox
  quota inventory must not masquerade as selected-transfer size. `totalBytes`
  comes from native Host1 inventory for this run, not quota admission. No extra
  mailbox login/inventory or website/frontend modification was introduced.
- Tests cover native formats/overflow/zero, long log tails, reader isolation,
  SQLite reopen, encrypted worker HTTP transport with trimmed history and service
  restart, guest ownership and SSE/GET serialization. Full Go tests and vet pass
  on Windows; Python harness checks in WSL: 48 passed, one expected skip (age
  unavailable). All six SDK tests pass. CI status belongs to the exact pushed SHA.
- No test VM update, real mailbox mutation, public deployment or release was
  performed. Browser acceptance over same-origin HTTPS remains an open gate;
  off-site backups remain deferred by the owner.

Next two technical steps: (1) review/merge the counter PR after exact-head CI,
then update the closed test VM with the reviewed image and transactional rollback;
(2) run a bounded real-mail API/worker acceptance on that image (selected folders,
native counters, repeat/cancel/restart), retaining the separate browser gate for
when website integration resumes. Do not add paid accounts or widen public access
as part of this slice.

## Request to the backend: expose the counters imapsync already prints

Addressed by the backend slice above, with the inventory/ETA corrections noted.

The workspace now shows elapsed time, measured transfer rate and a remaining
estimate, all computed in the browser from `startedAt` plus the `transferred`
and `bytes` counters. They are marked with `≈` because they are arithmetic,
not data from the API.

They can stop being estimates without any new IMAP work:
`internal/migrator/progress.go` already parses `Host1 Nb messages:` into
`progress.totalMessages` and the `ETA: ... N/M msgs left` line into
remaining/total, and `internal/migrator/estimate.go` already knows the whole
source size in bytes and messages (it logs `Entire source: N bytes, M messages,
K folders`). None of that reaches `migrator.Event` or `jobs.View`, so the UI
cannot show it.

Adding these optional fields to the event and the job view would let the
workspace display exact values instead of computed ones (each still optional,
absent meaning unknown — the UI already treats a missing field that way):

- `totalMessages` and `remainingMessages` — from the ETA line already parsed.
- `totalBytes` — from the admission estimate already computed.
- `etaSeconds` — imapsync prints it; currently discarded.

No frontend change is required to keep working if these never arrive: the
estimates simply stay estimates. Website side does not touch `internal/`.

## Workspace wired to the guest client (website side)

`web/lib/workspace.ts` now talks to the backend only through
`sdk/guest-client.mjs`, per `docs/GUEST-INTEGRATION.md`. Every blocker listed
in that document is addressed:

- The session is awaited inside the client before any POST; the page no longer
  fires requests with an empty CSRF token.
- Named `snapshot` and `migration` events are consumed through `client.watch`;
  `finished` is treated as terminal-but-unknown and the authoritative job view
  decides between completed, failed and cancelled.
- Errors are read as `{error:{code,message}}` and mapped to RU/EN/UK strings;
  429, 503 and 403 get their own wording. Server text and folder names are put
  into `textContent`, never `innerHTML`.
- `start` sends the full request: both endpoints, `syncFlags`/`preserveDates`,
  the selected run mode, the selected folder names and `destinationSubfolder`.
  Strict mirror still requires both flags and the two UI confirmations, and the
  confirmation is cleared when either endpoint changes.
- Mock data is gone. The folder list is fetched from the user's own source
  server and shows names only — no invented sizes or message counts. The
  monitor shows progress, transferred, skipped and bytes, plus phase and
  current folder; the fabricated speed and ETA tiles were removed, because the
  API has no such fields.
- Cancellation is a request, not a fact: the button shows «Останавливаем…» and
  the stream keeps running until the view is terminal.
- Only the job ID is stored, in `sessionStorage`. After a reload the page calls
  `client.get(id)` and re-opens the stream; a 404 clears the ID and says the job
  is gone instead of claiming success. Passwords are never stored and
  `POST /api/jobs` is never replayed.

Verified in headless Chromium against a mock API that follows the contract
(session, test, folders, 202 + job view, named SSE events, cancel, 404):
check, folder discovery, partial selection reaching the request payload, live
progress, reload while running, cancellation to a terminal state, a server
error message rendered as text, and no credentials in browser storage. The
GitHub Pages build makes no `/api/*` request at all and keeps the network
buttons disabled.

Not done here and still open: one real disposable-mailbox transfer over the
same HTTPS origin on the VM. That needs the API and the site on one origin, so
it belongs to the backend side.

## Guest UI integration slice (feature/guest-transfer-contract)

Owner deferred off-site backup work and approved moving to a usable migration
flow. PR #20 is merged and its updater was installed on the VM with matching
SHA-256; current task is based on main 370bf69. Existing backend supports guest
sessions, connection/folder discovery, quota admission, jobs, ownership, SSE,
cancellation and retrieval after reload. Do not rebuild those features.

- Added `sdk/guest-client.mjs`: independent same-origin API transport for Claude,
  awaited CSRF bootstrap, actual nested errors, named snapshot/migration events,
  cursor deduplication/reset, authoritative terminal status and observable stop
  failures. It never stores credentials or automatically retries POSTs.
- Six focused Node tests pass: concurrent CSRF bootstrap, failure/no replay,
  SSE snapshots/gaps, cancelled completion, lost ownership/refresh and stop
  rejection. Added the client tests to CI. Full checks depend on the pushed SHA.
- `docs/GUEST-INTEGRATION.md` records exact API usage and concrete existing
  frontend blockers: unnamed SSE handler, lost options, mock folder totals/ETA,
  nested error parsing, premature stop and missing reload recovery. Claude owns
  wiring the module into the UI; website source was not edited.
- Limitations: no standalone structured size-estimate API; quota admission
  occurs in normal worker jobs. Lost start acknowledgement has no client
  idempotency key: inspect owned jobs instead of blindly replaying. Browser
  end-to-end transfer is still pending UI integration and same-origin HTTPS.

Next: (1) Claude connects the workspace using the integration contract;
(2) run one complete real-browser disposable-mail transfer with reload/cancel
and visible failure handling, then prepare the closed pilot release. Do not
claim that transport unit tests alone complete this browser acceptance gate.

## Live transactional update to current main

- PR #17 was merged and post-merge CI passed. Current main
  `b7f765a16a0b5b419d96a5931ad0fb68874758d2` also passed both push workflows.
  An exact `git archive` was hashed before transfer and built on the closed VM;
  Go tests and the real imapsync TLS/STARTTLS matrix passed during the image
  build. The resulting `staging-b7f765a` image is pinned as
  `sha256:6f937d90133c94d8c1fc5639c4a6b0c31f385272b036d143fff68ab2b24801de`.
- The merged transactional updater was used for the first live update. Its
  initial attempt refused before downtime because `/var/backups/movemailbox`
  was mode 0755. The verified root-owned directory was restricted to 0700; the
  service and old image remained untouched until that precondition passed.
- The successful run stopped both writers, created and validated root-only
  snapshot `pre-b7f765a16a0b-20260913T123729Z`, atomically changed the image
  pin and required both exact-image health checks plus readiness. The former
  digest and earlier validated snapshot remain available for rollback.
- Post-update health reports version `staging-b7f765a`, remote-worker execution,
  healthy SQLite and HTTP 200/no-store readiness. The private verifier passed
  isolation/resources, guest/CSRF/Host/SSRF, all egress denials and verified TLS
  to both authorized IMAP servers without credentials or jobs. State remains
  24 completed, 2 cancelled, zero active jobs and zero envelopes; API retention
  has independently reduced retained snapshots to 13, which is permitted.
- Windows `git archive` exposed a packaging edge: executable Python files with
  `text=auto` were exported with CRLF and failed direct shebang execution even
  though `python3 file.py` worked. This branch pins Python and shell files to LF
  in `.gitattributes`, and snapshot creation now normalizes backup databases to
  DELETE journal mode so validated backups contain no misleading empty WAL/SHM
  sidecars. The installed updater was replaced with an LF-identical executable
  and its direct `--help` invocation passed.
- No real-mail login, message mutation, strict mirror, public exposure,
  production deployment or off-site upload was performed. Website source was
  not edited; the deployed image merely contains the already-merged current
  main website maintained by Claude.

### Next two technical steps

1. Obtain exact-head CI and review/merge this packaging/snapshot correction;
   then install that exact merged updater on the closed VM.
2. Select an off-site object store and provide scoped write/read credentials so
   the age-sealed pair can be uploaded, retrieved and restored into isolated
   empty storage with measured RPO/RTO and retention/versioning evidence.

## WAL-safe updater and full reboot acceptance

- Added `scripts/staging_update.py`, a staging-only transactional updater. It
  resolves local tags to immutable image IDs, requires the rollback image,
  stops both writers, snapshots both SQLite stores through the Backup API,
  rejects active/enveloped/inconsistent pairs, atomically updates the root-only
  image pin and requires both exact-image health checks plus `/api/ready`.
- Failed updates retain a diagnostic snapshot and restore the previously
  validated pair after removing failed-image WAL/SHM sidecars; the old image,
  volumes and backups are never deleted. Tests cover committed state living in
  WAL, active-state rejection, corrupt-pair rejection before overwrite,
  sidecar-safe restore and the automatic image/database rollback sequence.
- The closed test VM completed a full reboot. Boot ID changed from
  `4d98986c-ae1d-4e5c-9381-f3a3a0e3474e` to
  `9741c808-5bd8-4269-88e2-fe6deb218dad`. Monotonic activation evidence was
  egress `2960444`, Docker `5281745`, stage `5689752`; Docker also reports the
  egress unit in both `Requires` and `After`.
- After reboot both containers were healthy on exact digest
  `sha256:07761ebafcdb3fccce8ba420f1be2e47aa5508a5fae2730ed65360ae5e0f1e7f`.
  The full private verifier passed resource/isolation, guest/CSRF/Host/SSRF,
  egress-denial and verified TLS checks to both authorized IMAP hosts without
  logging in or creating a job. Readiness returned HTTP 200/no-store; storage
  remained 24 completed, 2 cancelled, zero active jobs and zero envelopes.
- Local WSL verification: 49 Python tests passed except the expected `age`
  integration skip because that binary is not installed there; documentation
  checks and exact-head CI must be checked after push. Website/frontend files
  were not modified. No mailbox content, strict mirror, public exposure,
  off-site upload, production deployment or platform host was touched.

### Next two technical steps

1. Obtain green CI for the exact PR head, review/merge PR #17 when authorized,
   then use only that merged updater for the next reviewed staging image.
2. After the owner selects an object store and scoped credentials, seal, upload,
   retrieve and restore the database pair into isolated empty storage; record
   checksum, retention/versioning and measured RPO/RTO.

## Active technical task: closed-stage deployment of merged main

- PRs #13/#15 were green and merged. Exact main `bc80040` passed full CI.
  Claude owns website/frontend/SEO; no frontend source was edited in this task.
- Built and deployed version `staging-bc80040`, image digest
  `sha256:07761ebafcdb3fccce8ba420f1be2e47aa5508a5fae2730ed65360ae5e0f1e7f`.
  The former digest `sha256:15d062fa52b8d9bb3e3cdea83045e4481ae72eb7476be87087404ccaafd476b3`
  remains for rollback. Both containers are healthy; remote worker, SQLite and
  `/api/ready` HTTP 200/no-store passed.
- Before deployment: zero active jobs/envelopes. A stopped paired rollback
  snapshot `pre-bc80040-20260912T181033Z`, made with SQLite Backup API, passed
  checksums, integrity, terminal-queue and paired-status validation. It is local
  to the VM, not an encrypted off-site backup.
- A prior plain `.db` copy was correctly rejected because current worker state
  remained in WAL. It is retained root-only as
  `rejected-pre-bc80040-20260912T180936Z` and must never be restored. Service
  stayed on the old image until the valid snapshot existed.
- Post-deploy private checks passed: isolation/resources, loopback API, private
  worker, guest cookie/CSRF/Host/SSRF, nftables egress and verified IMAP TLS to
  both authorized Mail-in-a-Box hosts.
- A new 13-job real-mail pilot passed: preflights made no destination writes;
  folder hierarchy/subfolder, both directions, a 6 MiB attachment, exact SHA-256,
  flags and INTERNALDATE, zero-copy repeats, cancel recovery and worker SIGKILL
  recovery. Source/INBOXes stayed unchanged; guest isolation/SQLite integrity
  passed; final state is 24 completed, 2 cancelled, zero active/envelopes, and no
  plaintext test password in inspected DB/WAL/SHM/logs. Retained fixture prefix:
  `MoveMailbox-Stage-73f998de0f3e`.
- No strict mirror, mail deletion, public exposure, VM reboot, off-site upload or
  production deployment was performed.

### Previous next steps (now superseded above)

1. Implement and test a reusable WAL-aware staging snapshot/update/rollback
   command; then perform full VM reboot acceptance with console fallback.
2. After the owner selects an object store and scoped credentials, seal, upload,
   retrieve and restore the pair into isolated empty storage; record checksum,
   retention/versioning and measured RPO/RTO.

## Integration of technical PRs #13 and #15

The owner authorized merging both technical PRs after green CI. PR #13 now
incorporates PR #15's reviewed backend branch so the handoff conflict is resolved
without losing either work record. Merge #15 first, then #13 after its own exact
head checks pass. Inspect GitHub state before doing anything: if both are merged,
fast-forward local main and start the next technical branch from it. Never merge
Claude's website PR #14 as part of this authorization.

Claude owns website/frontend/design/content/SEO; this agent owns the utility,
backend, workers, tests and test VM. The next technical stages are deployment of
the tested image to the closed VM with rollback and disposable-mail acceptance,
then real encrypted off-site restore using an owner-designated destination.
The records below preserve earlier evidence, not current checkout instructions.

## Completed real-mail acceptance record (PR #13)

- Historical `test/private-staging-mail` pilot was based on main `3889632`. PR #11 is already
  merged. This new technical branch is independent of the public website PR #12
  (`web/github-pages-seo`); inspect both PR states after fetching all refs.
- Owner explicitly resumed the previously cancelled mailbox tests. A real
  Mail-in-a-Box pilot passed on the deployed API/worker image `staging-be9af16`.
  No Go/application code or deployment configuration changed.
- Added `scripts/smoke-private-staging-mail.py`: bounded stdin credentials,
  fixed loopback guest API, selected synthetic folders, 6 MiB attachment,
  preflight modes, bidirectional copies and repeats, guest isolation,
  cancellation and opt-in worker SIGKILL with exclusive-active-job guard.
- All 13 real jobs reached expected terminal states. Copy verification compares
  complete-message SHA-256, flags and INTERNALDATE. Repeats copied zero messages;
  original INBOXes and source fixture stayed unchanged. Crash recovery used two
  attempts for the same job. SQLite integrity and terminal envelope cleanup
  passed; raw mailbox passwords absent from inspected DB/WAL/SHM and service logs.
- Six new offline guard tests passed. WSL suite: 41 passed, one age integration
  test skipped because age/age-keygen are unavailable in that WSL environment.
  Consult the current PR's CI for pinned age integration and Go/Docker checks;
  a previous branch's green CI is not proof for this branch.
- Post-pilot harness review also added a restart attempt when the Docker kill
  command errors/times out; two offline tests cover both success and failure
  paths. This cleanup change was not a second live-mail run.
- Test scripts were staged temporarily on the VM; credentials were supplied
  through SSH stdin after hidden local input. No credential file was created.
  Synthetic folders remain for inspection; both deployed services are healthy.
  Details, job IDs and limitations: [pilot record](PILOT.md).
- Next two technical steps: (1) encrypted off-host backup and independent restore
  using an owner-designated destination; (2) VM reboot acceptance and readiness
  monitoring/retention checks. Separate future scope: paid identity/entitlements.
- Website DNS/HTTPS and all 30 sitemap pages were verified on September 12;
  source and deployment checker are in PR #12. Search-engine ownership records
  and sitemap submission are still pending with the owner. Do not lose the
  website branch when continuing technical work on another computer.

## Backend hardening record (PR #15, 2026-09-12)

This section supersedes the historical branch/PR and cancelled-test directions
below. Website/frontend/design/content/SEO now belong to Claude, per the owner.
This agent owns the migration utility, API/backend, worker, technical tests and
test VM. No frontend files were changed in this task; see `AGENTS.md`.

- Active branch: `feature/backend-mvp-hardening`, based on current main
  `8744a68` after PR #12 was merged. Technical changes are in
  [PR #15](https://github.com/Anton-Babaskin/MoveMailbox/pull/15); do not merge
  Claude's separate website branch into it. Inspect current PR state and CI
  for the exact head before continuing on another computer.
- Previous real-mail pilot is independently recorded in
  [PR #13](https://github.com/Anton-Babaskin/MoveMailbox/pull/13), branch
  `test/private-staging-mail`, head `ab29f5f`. Its 13 completed real-mail jobs
  and CI evidence are not another live-mail run in this task. That PR remains
  separately reviewable; preserve its test harness/evidence when merging.
- Stage 1: API and worker service reject invalid typed environment settings
  before listeners/storage/log creation. Explicit numeric limits/durations
  must be positive; empty values retain defaults. Subprocess tests exercise
  both real entry points and check that errors omit supplied values.
- Stage 2: `/api/ready` returns 200/503 from configured engine availability,
  observed history-store health and manager lifecycle. `/api/health` remains
  compatible. Probes create no guest session; Host/security guards remain.
  Readiness is not a capacity reservation or a disk-space forecast.
- Stage 3: initial SSE snapshots establish a reconnect cursor; reconnect headers
  flush without waiting for another event. Retention/future-cursor gaps receive
  an owned snapshot, with already represented events suppressed. Unauthorized
  guests still receive 404. See [API integration contract](BACKEND-OPERATIONS.md)
  for Claude; this does not implement or validate browser integration.
- Verification of implementation commit `5cb88f8`: `go test -race ./...`,
  `go vet ./...`, clean gofmt output, and 20 repeated SSE/readiness/durable-save
  test runs passed in the pinned Go 1.27 builder on the test VM, network disabled
  and resources bounded. Windows Go was not used.
- Extended process-level demo smoke passed inside a separate isolated container:
  readiness 200/503/200 across worker loss/recovery, API liveness retained,
  API restart/reconnect, worker retry, 954 simulated messages, strict-mirror
  non-replay, ownership, cancellation and no plaintext in inspected DB/WAL/logs.
  This is synthetic, not a new real-IMAP acceptance test. Token-rotation readiness
  assertions were added to the existing Docker CI drill; check CI before claiming
  that Docker variant passed for the current head.
- WSL Python suite: 36 tests, 35 passed and one age-dependent test skipped
  (age absent locally). Documentation link/artwork checker passed. CI installs
  age and runs the full suite, vulnerability scan, five cross-builds and Docker
  recovery/rotation/backup/ENOSPC drills; its final result is not presumed here.
- Running staging API/worker, deployed image, firewall and secrets were not
  modified or restarted. No website deployment, mailbox mutation, merge or
  release. Unrelated local archives/logs remain outside Git; credentials and
  runtimes are not synchronized between computers.

### Next two technical steps

Owner subsequently authorized merging PRs #13 and #15 after checking them; do
not merge Claude's PR #14. Recheck actual GitHub state on resume and use updated
main once both technical PRs are merged.

CI on `edb9707` exposed a pre-existing worker shutdown race before Migrate:
ordinary leased work was permanently failed if service cancellation arrived
after envelope opening but before execution. The fix releases that lease and
requeues unstarted ordinary work without consuming an attempt; strict mirror,
deadline failure and explicit cancellation remain fail-closed. Added four
deterministic policy cases (50 repetitions passed), then 200 repetitions of the
actual service-restart test passed, plus the full race suite and vet in the
isolated builder. The earlier red Docker run must not be called green; inspect
the CI result for the new head that includes this correction.

1. After reviewing/merging the technical PRs and checking their exact green CI,
   deploy an immutable tested image to the closed test VM with a rollback image
   retained. Validate readiness and reconnect behavior against that deployed
   API/worker and repeat the authorized disposable-mail acceptance harness.
2. Perform an actual encrypted off-site backup/restore into isolated empty
   storage, including missing/corrupt objects and recovery-time evidence. This
   requires the owner's selected off-site destination and scoped credentials;
   a local archive drill is not off-site validation.

## Previous task: public static website (PR #12 merged)

### Калькулятор и маршруты приведены к проверенным цифрам — 2026-09-13 (website)

- После правки статей сайт противоречил сам себе: в блоге написано, что
  Microsoft порогов не публикует, а калькулятор на `/pricing` показывал точные
  «~0.5 ГБ / час». Теперь у каждой цифры видно основание: чип
  «документировано» у задокументированных лимитов Gmail и «оценка» у остальных.
  Формулировка на маршруте `microsoft-365-to-gmail` приведена к тому же виду.
- **В калькулятор добавлен приёмник.** Раньше спрашивался только источник, и
  расчёт переноса в Gmail врал впятеро: Gmail отдаёт 2500 МБ в сутки, а
  принимает 500 — оба числа задокументированы. Теперь скорость считается как
  минимум из двух сторон, в примечании названо узкое место, а в тёмной панели
  две полосы показывают разрыв: ящик на 12 ГБ из Gmail в свой сервер — 4 дня
  22 часа, он же в Gmail — 24 дня 9 часов.
- **Семь маршрутов, ведущих в Gmail** (`outlook-to-gmail`, `microsoft-365-to-gmail`,
  `yandex-to-gmail`, `icloud-to-gmail`, `yahoo-to-gmail`, `cpanel-to-gmail`,
  `exchange-to-google-workspace`), получили первым пунктом «граблей» этот лимит
  на трёх языках. Раньше самый значимый для планирования факт на самых
  коммерческих страницах не упоминался вовсе.
- Проверено: сборка, `check-export` — 129 URL и целый 404.html, восемь страниц
  в браузере (включая `/en/pricing/` и `/uk/pricing/`) — ноль ошибок в консоли
  и ноль горизонтальной прокрутки; калькулятор проверен кликами в трёх
  сочетаниях сторон; светлая и тёмная тема, мобильная ширина.

### Дизайн: переключатель языка, строка запуска, эффекты — 2026-09-12 (website)

- **Переключатель языка был сломан**, а не просто некрасив: CSS стилизовал
  `.seg button`, а разметка после слияния рендерит ссылки — три языка слипались
  в «RUENUK». Селекторы покрывают оба варианта, control получил активную
  пилюлю, ховер и фокус-кольцо; мобильный вариант починен так же.
- **Язык браузера: предложение вместо перенаправления.** Сначала было сделано
  автоперенаправление (`public/lang.js`), затем переделано на подсказку —
  `components/lang-suggest.tsx`. Причина: автоматический редирект по языку
  ломает две вещи сразу — человек теряет адрес, который ему прислали, а краулер
  получает все языковые версии по одному адресу вопреки hreflang; Search Central
  прямо советует не перенаправлять. Теперь страница остаётся той, что запросили,
  а внизу слева один раз появляется карточка на языке предложения: «Switch to
  English» или «Залишитись російською». Выбор пишется в `mm.lang` и больше не
  спрашивается; клик по переключателю языка в шапке считается тем же выбором.
  На сервере компонент не рендерит ничего — статический экспорт один на всех.
  Проверено: en → баннер на английском, uk → на украинском, ru и de → без
  баннера, на `/en/...` баннера нет, на статье предлагается та же статья, после
  отказа баннер не возвращается; светлая и тёмная тема, мобильная ширина.
- **Строка запуска** была флекс-строкой с прижатыми вправо кнопками разной
  высоты. Стала сеткой: гарантии слева, пара кнопок справа единым блоком
  фиксированной ширины (одной высоты 48px, «Остановить» 150px), на узком
  экране — в столбец. Ширина блока не зависит от длины подписи, поэтому вид
  одинаковый на трёх языках.
- **Секция «как проходит перенос»** из двух плоских списков стала карточками:
  у шагов сквозная линия, которая прочерчивается по мере прокрутки, и медальоны,
  зажигающиеся, когда линия до них дошла; у гарантий — иконка на мягкой
  подложке. Ховер приподнимает карточку.
- **Раскрытие при прокрутке стало разным по типу блока**: карточки выезжают
  снизу волной (задержка внутри группы), колонки — навстречу друг другу,
  крупные полотна проявляются шторкой с расфокусом, бейджи подрастают.
  Всё выключается системным «уменьшить движение», а элемент без скрипта
  остаётся видимым: прятать контент за анимацией нельзя.
- **Страница 404 чинилась дважды.** Сначала обнаружилось, что в `404.html`
  два тега `<html>`: корневого layout у проекта нет (их два, по одному на
  языковое дерево), и Next добавлял not-found собственную обёртку поверх нашей.
  Браузер второй тег выбрасывает, React при гидратации видел не своё дерево и
  падал с ошибкой 418. Решение — `app/global-not-found.tsx` и флаг
  `experimental.globalNotFound`: страница рендерит документ сама. Флаг
  экспериментальный, поэтому инвариант закреплён в `check-export`: ровно один
  тег `<html>` и обязательный `lang` — если Next снова начнёт оборачивать
  страницу, упадёт сборка, а не живой сайт. Заодно снят
  предзапрос ссылок переключателя языка (`prefetch={false}`) — он тянул
  RSC-пейлоады других языков на каждой странице и несуществующий адрес на 404.
- Проверено: сборка 140 маршрутов, `check-export` — 129 URL, ноль скачков
  уровня заголовков, headless Chromium по одиннадцати страницам (включая
  `/en/`, `/uk/` и 404) — ноль ошибок в консоли и ноль горизонтальной
  прокрутки; светлая и тёмная тема, ширины 390/768/1400 — вёрстка цела.

### Бэклог сайта закрыт на три пункта — 2026-09-12 (website/SEO scope)

- **Переключатель языка на 404** вёл на `/en/404.html` и `/uk/404.html`, которых
  нет. У битого адреса нет версии в другом языке, поэтому на 404 переключатель
  ведёт на главную соответствующего языка (флаг `notFound` в `SiteShell` и
  `SiteHeader`). Проверено в браузере: на 404 ссылки `/`, `/en/`, `/uk/`,
  на обычных страницах прежнее поведение, ошибочных запросов больше нет.
- **Цифры провайдеров перепроверены по первоисточникам.** Подтвердилось:
  Gmail — 2500 МБ в сутки на скачивание по IMAP. Нашлось то, чего в статье не
  было: у Gmail есть второй порог, 500 МБ в сутки на загрузку, то есть перенос
  В Gmail примерно впятеро медленнее, чем ИЗ него. Не подтвердилось: «Exchange
  около 0.5 ГБ в час» и «iCloud режет число сессий» — Microsoft и Apple таких
  порогов не публикуют, формулировки убраны. Вместо них документированные
  факты: Microsoft 365 не переносит письма больше 35 МБ и папки со слэшем в
  имени, у iCloud предельный размер письма 20 МБ. Правки в трёх статьях
  (`how-long-migration-takes`, `folder-separators`, `verify-migration`) на трёх
  языках, с указанием источника в тексте.
  Источники: Google Workspace Admin Help (Gmail bandwidth limits), Microsoft
  Learn (Tips for optimizing IMAP migrations), Apple Support 102198.
- **Правовые страницы.** Два плейсхолдера из пяти закрыты проверяемыми фактами:
  аналитики и сторонних запросов на сайте нет (в экспорте ноль обращений к
  чужим доменам), хостинг — GitHub Pages, платёжный провайдер не подключён;
  оплата не принимается, поэтому условия возврата описаны честно — они появятся
  до запуска первого платного тарифа. Осталось три пункта, которые может
  заполнить только владелец: оператор (юрлицо или ИП и адрес), контактный email
  и предел ответственности с применимым правом. Страницы остаются под
  `noindex`, пока эти три не заполнены.
- **Страж плейсхолдеров** добавлен в `scripts/check-export.mjs`: если страница
  попала в sitemap и содержит `{{…}}`, проверка падает. Это защита от шага,
  когда с правовых страниц снимут `noindex`, не подставив реквизиты. Проверен в
  обе стороны: на подсунутом плейсхолдере падает, на чистом экспорте проходит.

### Аудит сайта после публикации — 2026-09-12 (website/SEO scope)

- Прогнал аудит живого сайта и экспорта, починил четыре найденные вещи.
  Код продукта не изменялся; правки только в `web/`.
- **Страница 404 была дефолтной страницей Next**: английский текст, без
  `<html lang>`, без шапки и футера, одна ссылка. Любая битая внешняя ссылка
  или устаревший URL из выдачи упирались в белую страницу. Теперь это обычная
  страница сайта (`web/app/not-found.tsx`) с навигацией и пятью разделами;
  язык подставляется на клиенте по префиксу адреса, потому что статический
  экспорт кладёт один `404.html` на все три языка. Стоит `noindex`.
- **`og.png` весил 1094 КБ** при 1731×909 и объявлялся как 1735×909 — ширина
  в метаданных была неверной. Пережат в 1200×630 (стандарт превью) палитровым
  PNG: 227 КБ, −79%, без видимой потери качества; размеры в `lib/seo.ts`
  приведены к факту.
- **`lastmod` в карте сайта был датой сборки**: после каждого деплоя все 129
  URL объявляли себя изменёнными. Теперь дата привязана к содержимому —
  у записей блога своя дата публикации, у остальных страниц константа
  `CONTENT_UPDATED`, которую двигают вместе с правкой текстов.
- **Доступность**: 109 декоративных иконок (`<svg><use href="#…"/></svg>`)
  получили `aria-hidden="true"` — скринридер объявлял их как графику без
  имени. Исправлены пропуски уровней заголовков на `/blog`, `/routes`,
  `/pricing` и `/download`: секции с пропом `pageTitle` дают странице `h1`,
  а карточки внутри оставались `h3`. Теперь уровень карточек зависит от того,
  заголовок какого уровня даёт секция. По всем 137 страницам экспорта: ноль
  пропусков уровня, ровно один `h1`, ноль иконок без подписи.
- Проверено: `npm run build` (140 маршрутов), `check-export` — 129 URL,
  `npm audit` — 0 уязвимостей, headless Chromium по шести страницам — ноль
  ошибок в консоли, скриншоты `/pricing`, `/download`, `/blog`, `/routes`
  и 404 — вёрстка не изменилась. `go build`, `go vet`, `check-docs` — зелёные.
- Осталось в бэклоге: на странице 404 переключатель языка в шапке ведёт на
  `/en/404.html` и `/uk/404.html`, которых нет, — две записи 404 в консоли.
  Вреда нет, но аккуратнее было бы вести на главную соответствующего языка.

### Блог, бекенд сайта и публикация — 2026-09-12 (website/SEO scope)

- **Опубликовано.** PR #14 смержен в main (`8188182`), workflow Pages выложил
  сайт. Живая проверка `npm run check:live` прошла: 129 страниц карты сайта,
  уникальные метаданные и canonical, валидный JSON-LD, 162 внутренних URL,
  noindex у черновиков, настоящая 404, поля пароля в предпросмотре отключены.
  Выборочно проверены 200 на `/`, `/en/`, `/uk/`, `/blog/` и страницах записей
  во всех трёх языках; BlogPosting и взаимные hreflang отдаются живым сайтом.

- Владелец передал в эту зону ответственности и бекенд сайта: монтирование
  статики, CSP, workflow и публикацию. Код продукта (`internal/migrator`,
  `internal/jobs`, `internal/worker`, `cmd/`) не изменялся.
- `internal/api/server.go`: сайт из `internal/web` смонтирован на «/» вместо
  `internal/webui` (пакет оставлен на релиз, но снят с роутера), удалена
  обслуживавшая его функция `staticHandler`.
- CSP сделан строже, чем предлагал `INTEGRATION.md`: вместо
  `script-src 'unsafe-inline'` хендлер сайта считает sha256 инлайн-скриптов и
  инлайн-стилей при старте из вшитой статики и дописывает хэши в `script-src`
  и `style-src`. Политика по-прежнему объявлена только в `securityHeaders`.
  Проверено в headless Chromium на собранном бинаре: ни одного нарушения CSP,
  интерактив живой.
- У вшитых файлов появился ETag (sha256 содержимого) и 304 на If-None-Match —
  это поведение раньше проверял `TestStaticAssetsUseETag` поверх `webui`; тест
  переехал в `internal/web` и расширен, в `internal/api` добавлены проверки
  приоритета `/api/*` и отсутствия `'unsafe-inline'` в script-src.
- Блог: двенадцать записей по `docs/seo/content-plan.md` (приоритеты 1-3 плюс
  доставляемость после переезда), каждая на трёх языках, с BlogPosting,
  хлебными крошками, FAQ-разметкой и внутренними ссылками на маршрут и на
  страницу ошибки. Мёртвых ссылок `href="#"` в экспорте не осталось.
- Sitemap вырос с 93 до 129 URL. По всему экспорту: 136 страниц, ноль дублей
  title и description, ноль внутренних ссылок без хвостового слэша, ноль битых
  внутренних ссылок, весь JSON-LD парсится.
- Ограничение: цифры лимитов провайдеров в статьях `how-long-migration-takes`
  и `app-passwords` — порядок величин, взятый из `content-plan.md` и опыта, а
  не результат живой проверки. Перед продвижением статей их стоит перепроверить.
- Docker-образ локально не собирался (Docker в среде нет); CI собирает.

### Website i18n release — 2026-09-12 (website/SEO scope only)

- Branch `claude/website-seo-scqzs2`, ответвлена от `main` `8744a68`. PR #12
  уже смержен, `web/github-pages-seo` полностью содержится в main, расхождений
  с origin нет. Работа ограничена сайтом и SEO: код продукта (Go-бекенд,
  `internal/api`, `internal/migrator`, worker) не изменялся.
- Каталог `web/` заменён целиком версией из архива владельца (не пофайловое
  слияние: структура изменилась — появились `content/`, `i18n/`, два корневых
  layout `app/(ru)` и `app/(intl)/[lang]`). Добавлены `internal/web/`
  (`go:embed` статики), `docs/seo/`, `Makefile`, `INTEGRATION.md`.
- Три языка: русский в корне, `/en`, `/uk`. 93 URL в sitemap, у каждой страницы
  взаимные hreflang и x-default на русскую версию. Адреса русских страниц не
  изменились, накопленный индекс не затронут. Новое: `/en/*`, `/uk/*`, `/blog/`.
- Сохранены решения прошлой ветки: хвостовые слэши, один `<h1>` на страницу,
  экранирование `<` в JSON-LD, честные формулировки предпросмотра, ссылки на
  `v0.4.0-preview`/`SECURITY.md`/`#readme`, отсутствие логотипов провайдеров,
  `CNAME` и `.nojekyll`.
- Регрессия слияния исправлена: пять ссылок в `components/sections/`
  (`brief`, `faq-short`, `workspace`) были захардкожены без слэша и без языка
  (в href стояла строка `/guides`), теперь идут через `href(lang, path)`. В экспорте не
  осталось ни одной внутренней ссылки без слэша.
- Сохранены решения репозитория поверх архива: Next 15.5.24 (в архиве 15.5.4),
  overrides postcss/sharp, скрипты `check`/`check:live`, workflow Pages с
  пинованными по SHA actions, Node 24.18.0, `npm ci --ignore-scripts` и
  `npm audit`. Из архивного workflow взят только флаг `NEXT_PUBLIC_STATIC_SITE=1`.
- `scripts/check-live.mjs` приведён к новой версии: блог больше не черновик
  (он индексируется), черновики проверяются во всех трёх языках, предпросмотр
  проверяется по `disabled` на полях пароля, а не по `fieldset disabled`.
- Проверено: `npm ci`, сборка со статическим флагом (104 страницы),
  `node scripts/check-export.mjs` — 93 URL, все существуют; `npm audit` — 0
  уязвимостей; по одному `<h1>` на всех 24 проверенных страницах; `<html lang>`
  и взаимные hreflang для ru/en/uk; headless Chromium по 9 страницам — ноль
  ошибок и предупреждений в консоли; интерактив жив (swap переносит значение,
  «Порт: вручную» показывает поле, поля пароля и кнопки запуска отключены).
  `go build ./...`, `go vet ./...`, `go test ./...` — зелёные.
- Docker: в существующий Dockerfile добавлены только стадия `web` и
  `COPY --from=web`, остальной файл не тронут; в `.dockerignore` дописаны
  четыре строки. Образ локально не собирался — Docker в этой среде нет.
- Не сделано намеренно (это бекенд продукта, за ним CODEX): правки
  `internal/api/server.go` из `INTEGRATION.md` — монтирование `web.Handler()`
  вместо `internal/webui` и `script-src 'self' 'unsafe-inline'` для inline-
  скриптов гидратации Next. Пока они не сделаны, сайт из бинаря не отдаётся;
  на GitHub Pages это не влияет.
- Открытый вопрос по контенту: три карточки на `/blog/` ведут на `href="#"`
  (так было и до слияния), при этом страница теперь индексируется. Нужно либо
  опубликовать посты, либо убрать мёртвые ссылки.
- Дальше: 1) ревью и мерж PR ветки `claude/website-seo-scqzs2` в `main`, после
  чего workflow Pages опубликует сайт (Settings → Pages источник должен быть
  **GitHub Actions**); 2) после публикации прогнать `npm run check:live` по
  живому домену и передать CODEX две правки `internal/api/server.go`.

### Public deployment verification — 2026-09-12

- Fetched all branches/tags; no new remote work or divergence. PR #12 is still
  open. CI for `064eecc` completed successfully, including Docker; it is not
  evidence for subsequent commits. Continue `web/github-pages-seo` until merged.
- DNS now resolves normally. GitHub Pages reports HTTPS enforced and an approved
  certificate for apex and www. Live checks confirmed HTTP/www redirects to
  HTTPS apex with deep paths preserved.
- Added `web/scripts/check-live.mjs` and `npm run check:live`: read-only public
  verification of 30 sitemap pages, unique metadata, canonical URLs, JSON-LD,
  74 internal URLs, draft noindex, real 404 and disabled preview credentials.
  The live check and existing local export check (1090 references) passed.
  No application/backend code changed; cancelled mailbox tests remain cancelled.
- Next: inspect CI on the current PR head and merge PR #12 when authorized;
  then remove the temporary site-branch deployment allowance. Obtain the owner's
  search-engine verification record and submit the sitemap after verification.
  The public checks do not establish indexing or rankings.

### Synchronization snapshot — 2026-09-11

- The requested live-mail test continuation was cancelled; no mailbox login,
  migration or deletion was started in this session.
- Mailbox credentials are not stored in GitHub, the VM configuration or the
  handoff. Generated service secrets do exist in protected VM configuration;
  they are intentionally excluded from Git. A later mailbox pilot needs
  explicitly authorized runtime inputs.
- `web/github-pages-seo` is synchronized with `origin/web/github-pages-seo`;
  PR #12 remains open with its required checks green. No release or merge was
  performed in this sync step.

- Branch `web/github-pages-seo`, synchronized with main `3889632`. User requested public
  website publishing on GitHub Pages with movemailbox.com; deployment from this
  branch is authorized, but no backend PR merge or release is implied.
- Imported the owner's Next.js website into `web/`; preserved the framework,
  stylesheet and design. Did not import replacement Dockerfile, Go handlers or
  permissive CSP instructions. Backend and Proxmox were not modified.
- Public Pages is a documentation/product preview, not an online migration
  backend. Server-rendered disabled fieldset prevents credential entry; its API
  adapter is retained but not imported/initialized. No payment collection.
- Static export: 30 sitemap URLs, trailing-slash directory routes, matching
  canonical links, unique titles/descriptions and h1 headings, valid JSON-LD.
  Removed nonexistent-language hreflang, fake health status and open-source
  license claim; corrected missing assets and preview download links.
- Blog/legal drafts have noindex and are excluded from sitemap. Placeholder
  legal claims replaced with honest current static-site notices. Owner must
  supply full online-service terms before backend/payment launch.
- Local production build and TypeScript validation passed; export checker
  passed 30 indexable pages and 1090 local link/asset references. npm audit found
  zero vulnerabilities after Next 15.5.24 and scoped PostCSS/sharp overrides.
  Public DNS/HTTPS was subsequently validated on September 12 as recorded above.
- Pages custom domain configured; deployment workflow only publishes on explicit
  main/site-branch pushes, never PR events. Inspect the site PR and Pages run for
  exact commit/deployment result. Initial site branch allowed in github-pages
  environment; remove that allowance and workflow branch after merging.
- Backend PR #11 was merged into main as `3889632` during this task; its CI passed. VM is closed; user
  explicitly rejected changes to existing Proxmox services/443, which is occupied.
  Read `ops/private-vm-staging` handoff for VM evidence. Do not add port forwards.
- DNS setup from [website instructions](../web/README.md) and HTTPS validation
  are complete. Owner supplies the Search Console verification record before
  ownership verification/sitemap submission; backend integration is separate.
- User's unrelated ZIP exports, log and nested `website/` remain untouched and
  uncommitted. Credentials and local machine paths are not synchronized.

Historical records below describe earlier tasks.
## Previous task: closed VM stage (PR #11 merged)

- Historical branch `ops/private-vm-staging`, based on main `be9af16`, is merged
  through PR #11. Continue on the active website branch above.
- Deployed a closed Ubuntu 24.04 VM stage: Docker/Compose, separate API/worker,
  root-only generated credentials, loopback-only API, host UFW allowing SSH,
  project-scoped nftables egress policy and systemd startup ordering.
- Application image was built from `be9af16fa7b718f16028c7b746f7807d5c896d7d`:
  `sha256:15d062fa52b8d9bb3e3cdea83045e4481ae72eb7476be87087404ccaafd476b3`.
  Ops files are deployed separately from that immutable application image.
- Fixed worker Compose healthcheck: GET instead of wget spider/HEAD. The old
  probe falsely reported unhealthy although GET and authenticated API health
  succeeded. Both services are now healthy after stage service restart.
- VM checks passed: non-root/read-only/capability/resource limits, API loopback
  binding, worker unpublished, real remote-worker health, Secure/HttpOnly guest
  cookie, CSRF rejection, private-target rejection and untrusted Host rejection.
- Live network checks passed: metadata, bridge-host, NAT hairpin and arbitrary
  HTTPS denied with increasing nftables rejection counters; API direct IMAP
  denied; worker DNS and certificate-verified IMAP TLS reached two authorized
  servers. No mailbox login, migration job or message mutation in this stage.
- Python: all 36 tests passed in WSL with age, including six new staging tests.
  Native Windows Go could not run: incomplete temporary toolchain, missing
  standard-library `unsafe`. Do not describe that attempt as a test pass.
- Fallback verification passed on the VM in the pinned Go builder container:
  `go test -race ./...` and `go vet ./...`, with no network and bounded resources.
  Application Go sources are unchanged from the image baseline. Documentation
  checker passed (92 local link references); Python syntax compilation passed.
- No DNS/NAT, HTTPS, Proxmox settings, filesystem resize, full VM reboot,
  off-site backup or public deployment was performed. SSH authentication was
  not weakened or disabled. Temporary deployment sudo access remains; arrange
  its removal only after verifying a normal administrative fallback.
- Next two steps: (1) owner confirms staging DNS and NAT/reverse proxy, then
  configure HTTPS and a restricted pilot; (2) configure an owner-provided off-site
  backup destination, prove restore, then schedule VM reboot acceptance.
- See [private staging runbook](../deploy/staging/README.md). Server addresses,
  SSH keys and generated secrets are intentionally absent from the repository.

The sections below retain historical implementation evidence; their statements
about no VPS refer to the earlier tasks, not the current closed stage.

## Where to continue

- Repository: `Anton-Babaskin/MoveMailbox` (GitHub is canonical).
- Presentation task: `docs/repository-showcase`, based on main `162353a`, is
  complete. PR #10 passed CI run `34491518564` and was integrated into main as
  merge commit `1949d02ac83b4eae35e18d3dda7746e8780df102` on September 10.
  The branch remains as a historical remote ref; start new work from updated
  `main`, not from the presentation branch.
- This task adds a new English/Russian repository overview, original SVG banner
  and mail-flow diagram, setup/configuration guides, documentation index,
  contribution/support instructions, issue/PR templates and a changelog.
  GitHub description, website and topics were refreshed; private vulnerability
  reporting was verified enabled. No release tag or asset was replaced.
- Local verification: Go tests/vet, documentation links and all 30 Python tests
  passed in Linux/WSL with age installed, including four docs-checker tests.
  The full backup suite is not native-Windows compatible (POSIX directory fsync
  and symlinks); its initial Windows attempt failed and was rerun in WSL.
  Both SVGs were rasterized and visually inspected. Consult this
  task's exact PR SHA for full CI results; no production behavior was changed.
- The MoveMailbox license choice is still awaiting the owner. Do not select a
  license, label the project open source or reinterpret imapsync's license as
  permission for the whole repository. THIRD_PARTY_NOTICES.md is a scoped
  inventory, not a completed transitive/container redistribution audit.
- Integrated baseline: `main`, merge commit `c1b2c601fe128baa31505f4b6e247a5522081d3f`.
  [PR #9](https://github.com/Anton-Babaskin/MoveMailbox/pull/9) was merged on
  September 10 with the owner's authorization. Its development branch
  `feature/live-imap-storage-recovery` is retained for reference, not active work.
- Continue new implementation on a fresh feature branch from safely updated main.
  Fetch and inspect the current main CI; do not mistake pre-merge checks for a
  completed post-merge run.
- Published [v0.4.0-preview](https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview)
  still points to `b1eca4b2494712b1492ddcc165187b76056bb8c5`, now an ancestor of main.
  Its tag and five platform archives were not rewritten or promoted to stable.
  CI `34469906451` and release workflow `34470545536` passed for that exact SHA.
- Follow root `AGENTS.md` and [two-computer workflow](TWO-COMPUTERS.md). Fetch all
  branches first; do not reset another computer's local work or merge all refs.

## Completed in this task

1. Finished the previous stage's handoff: confirmed PR #8 merged and main CI
   green, then started this branch from the updated main.
2. Added portable Codex instructions, safe start/end Git synchronization rules
   and this progress record. No global settings or automatic background sync.
3. Extended the bounded ENOSPC harness with an explicitly authorized real-IMAP
   mode. The test wrapper pauses **after native imapsync success, before worker
   finalization**; it never modifies native arguments or production code.
4. Real copy + ENOSPC without restart passed: no false success; terminal failure
   persisted after capacity returned, attempts=1, credential envelope removed.
5. Real copy + ENOSPC + SIGKILL passed: same database retained by a holder,
   opted-in ordinary recovery completed in attempts=2 after lease expiry.
6. Both runs: SHA-256, flags, INTERNALDATE and message count matched; subsequent
   transfers copied zero messages; source unchanged, guest isolation and empty
   terminal envelopes verified, no mailbox passwords in service logs.
7. Added an operator-safe `age` metadata backup utility with atomic object commit,
   manifest/checksum validation, traversal/link/size limits and no-overwrite
   restore. It never includes worker private keys or mailbox contents.
8. Added 26 offline tests and a Docker backup drill. Demo encrypted backup,
   interrupted/corrupt/truncated object rejection, fresh-volume restore and a
   post-restore migration all pass. Rotation guard and coordinated key/token
   rotation pass in the Docker remote-worker drill.

Evidence, sanitized job IDs and reproduction: [PILOT.md](PILOT.md), September 10
section. All temporary lab containers were stopped. Test mail and ordinary lab
volumes were retained; the bounded worker tmpfs disappears after its last mount.
The test gate bind mount was temporary; recreate these labs with the harness,
do not just restart their stopped containers.

## Verification and honest limits

- Local Windows Go 1.27: `go test ./...` and `go vet ./...` passed.
- WSL Python: 26 offline harness tests passed, including age round-trip, archive
  commit, corruption, path-safety, rotation-gate and ENOSPC tests.
- Both new live-mail modes passed with native imapsync and verified IMAP TLS,
  guest API and encrypted remote-worker queue, not the demo engine.
- CI is authoritative for the exact pushed SHA: inspect the current branch PR
  checks for Linux race/vet/vulnerability tests, builds and Docker regression
  matrix. Do not infer a new head is green from the baseline run above.
- This is disk exhaustion at **post-copy finalization**, not ENOSPC injected
  during the APPEND literal. Exact APPEND disconnect/lost-ACK tests are separate
  previous proofs. Neither result establishes universal exactly-once delivery.
- Live strict mirror was not rerun here; destructive replay remains forbidden
  and is covered by the earlier demo crash matrix. No production policy changed.
- No VPS, production KMS, off-site provider or public launch is implied.
- The encrypted backup drill uses a local directory as an object-store model; it
  is not evidence of an actual S3/B2/Wasabi off-site upload or provider ACL.

## Next two proposed technical steps

1. Run the same backup/restore against a user-provided encrypted off-site bucket
   on the VPS, with object lock/versioning and independent checksum retrieval.
2. Add paid-account/magic-link entitlements and a production deployment gate
   only after VPS egress firewall, HTTPS, retention and incident contacts are
   configured. Keep free guest migration without registration.

MVP release gates still include deployment egress/SSRF enforcement, external
provider coverage, load/abuse tests, ownership of retention/alerts, HTTPS and
production secrets. See [ROADMAP.md](ROADMAP.md).

## Files deliberately not synchronized

This machine has unrelated site ZIP/tar exports, a local log, a Replit prompt
and an untracked nested `website/` repository. They were preserved, not staged
or deleted. Site-source synchronization needs its own explicit repository scope.
Mailbox credentials and generated service keys are never part of the handoff.
