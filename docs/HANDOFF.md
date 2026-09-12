# Engineering handoff — 2026-09-12

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

### Next two technical steps

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
