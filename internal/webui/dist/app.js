const byId = (id) => document.getElementById(id);

const translations = {
  ru: {
    history: "История", checkingEngine: "Проверяем движок…", heroTitle: "Перенесите почту.", heroAccent: "Спокойно и красиво.",
    heroDescription: "Подключите два почтовых ящика — мы аккуратно перенесём папки, письма, даты и флаги. Без консоли и сложных инструкций.",
    passwordsNotStored: "Пароли не сохраняются", oneWay: "Только в одну сторону", canCancel: "Можно отменить", from: "ОТКУДА", source: "Источник",
    to: "КУДА", destination: "Назначение", notChecked: "Не проверено", imapServer: "IMAP-сервер или IP-адрес", port: "Порт", security: "Защита соединения",
    plainSecurity: "Без шифрования — небезопасно", username: "Логин", password: "Пароль или пароль приложения", loginPlaceholder: "Введите логин", passwordPlaceholder: "Введите пароль",
    connectionOptions: "Настройки подключения", automaticRecommended: "Автоматически — рекомендуется", autoPort: "Автоматически", manualPort: "Вручную", migrationOptions: "Опции миграции", swapMailboxes: "Поменять источник и назначение", testConnection: "Проверить подключение",
    saveFlags: "Сохранить флаги", flagsDescription: "Прочитано, важное, отвечено", saveDates: "Сохранить даты", datesDescription: "Исходное время получения",
    dryRun: "Пробный запуск", dryRunDescription: "Ничего не копировать", folderSelection: "Выбор папок", allFolders: "Все папки", selectedFolders: "Выбрано папок: {count}",
    destinationSubfolder: "Подпапка назначения", destinationSubfolderDescription: "Оставьте пустым для обычного переноса", destinationSubfolderPlaceholder: "Например: Imported mail",
    strictMirror: "Строгое зеркало", strictMirrorOff: "Выключено · безопасный режим", strictMirrorOn: "Включено · лишние письма будут удалены", folders: "ПАПКИ", chooseFolders: "Какие папки перенести",
    chooseFoldersDescription: "MoveMailbox получит список папок из источника. Пароль используется только для этого подключения и не сохраняется.", selectAll: "Выбрать все", clearAll: "Снять все", reloadFolders: "Обновить список",
    foldersLoading: "Загружаем папки…", foldersEmpty: "Сервер не вернул доступных папок", foldersFailed: "Не удалось получить папки", applySelection: "Применить выбор", chooseAtLeastOneFolder: "Выберите хотя бы одну папку",
    sourceMustBeVerified: "Сначала проверьте подключение к источнику", destructiveOption: "ОПАСНАЯ ОПЦИЯ", strictMirrorTitle: "Включить строгое зеркало?",
    strictMirrorWarning: "Письма, которых нет в источнике, будут удалены из соответствующих папок назначения. Это действие может быть необратимым.", strictMirrorDoes: "Что произойдёт",
    strictMirrorDelete: "Лишние письма в назначении будут удалены", strictMirrorSourceSafe: "Источник останется без изменений", strictMirrorBackup: "Рекомендуется сначала сделать пробный запуск или резервную копию",
    strictMirrorAcknowledge: "Я понимаю, что лишние письма в назначении будут удалены", keepSafeMode: "Оставить безопасный режим", enableStrictMirror: "Включить строгое зеркало",
    sourceUntouched: "Письма в источнике останутся на месте", destinationCleanupWarning: "В назначении будут удалены лишние письма", startMigration: "Начать миграцию",
    migrationRunning: "МИГРАЦИЯ ИДЁТ", migratingMailbox: "Переносим почтовый ящик", cancel: "Отменить", transferred: "Перенесено", messages: "писем",
    skipped: "Пропущено", alreadyThere: "уже были", volume: "Объём", data: "данных", time: "Время", elapsed: "прошло", technicalLog: "Технический журнал",
    forDiagnostics: "для диагностики", newMigration: "Новая миграция", footerDescription: "IMAP → IMAP · безопасное одностороннее копирование", journal: "ЖУРНАЛ",
    migrationHistory: "История миграций", showPassword: "Показать пароль", hidePassword: "Скрыть пароль", engineUnavailable: "Движок миграции недоступен",
    checkBoth: "Сначала проверьте оба подключения", demoMode: "Демо-режим", engineReady: "{engine} готов", imapsyncMissing: "imapsync не найден", apiUnavailable: "API недоступен",
    checking: "Проверяем…", connected: "Подключено", connectionEstablished: "Соединение установлено", sourceReady: "Источник готов к миграции",
    destinationReady: "Сервер назначения готов принимать почту", connectionFailed: "Не удалось подключиться", connectionError: "Ошибка", verifyConnections: "Проверьте подключения",
    verifyBeforeStart: "Перед миграцией подтвердите источник и назначение", migrationNotStarted: "Миграция не запущена", verificationRequired: "Требуется проверка", settingsChangedDuringCheck: "Настройки подключения изменились во время проверки. Проверьте подключение ещё раз.",
    logGap: "Часть технического журнала пропущена ({count} событий)", scanningFolders: "Сканируем папки", migrationCompletedBadge: " МИГРАЦИЯ ЗАВЕРШЕНА",
    migrationCancelledBadge: " МИГРАЦИЯ ОТМЕНЕНА", attentionBadge: " НУЖНО ВНИМАНИЕ", mailTransferred: "Почта успешно перенесена",
    migrationStopped: "Миграция остановлена", migrationFailed: "Миграция завершилась с ошибкой", migrationCompleted: "Миграция завершена",
    transferredCount: "Перенесено писем: {count}", jobStopped: "Задание остановлено", cancelFailed: "Не удалось отменить", historyLoading: "Загружаем историю…",
    historyEmpty: "Здесь появятся ваши миграции", statusQueued: "В очереди", statusRunning: "В работе", statusCompleted: "Готово", statusFailed: "Ошибка",
    statusCancelled: "Отменено", phasePreparing: "Подготовка", phaseConnecting: "Подключение", phaseScanning: "Сканирование папок", phaseCopying: "Копирование",
    phaseVerifying: "Проверка результата", httpError: "Ошибка HTTP {status}", close: "Закрыть", switchLanguage: "Switch to English",
    errorHostDenied: "Недопустимый адрес сервера", errorCrossSite: "Межсайтовый запрос отклонён", errorJSONRequired: "Требуется JSON-запрос",
    errorJobNotFound: "Задание не найдено", errorJobFinished: "Задание уже завершено", errorJobLimit: "Очередь миграций заполнена",
    errorEngineUnavailable: "Движок миграции недоступен", errorManagerStopping: "MoveMailbox завершает работу", errorInvalidRequest: "Некорректный запрос",
    installImapsync: "Запустите приложение с установленным imapsync или в демо-режиме",
    homeLabel: "MoveMailbox — на главную",
    byteUnits: ["Б", "КБ", "МБ", "ГБ", "ТБ"], locale: "ru-RU",
  },
  en: {
    history: "History", checkingEngine: "Checking engine…", heroTitle: "Move your email.", heroAccent: "Calmly and clearly.",
    heroDescription: "Connect two mailboxes and MoveMailbox will carefully copy folders, messages, dates, and flags — without a console or complex instructions.",
    passwordsNotStored: "Passwords are not stored", oneWay: "One-way copy", canCancel: "Cancellation supported", from: "FROM", source: "Source",
    to: "TO", destination: "Destination", notChecked: "Not checked", imapServer: "IMAP server or IP address", port: "Port", security: "Connection security",
    plainSecurity: "No encryption — unsafe", username: "Username", password: "Password or app password", loginPlaceholder: "Enter login name", passwordPlaceholder: "Enter password",
    connectionOptions: "Connection settings", automaticRecommended: "Automatic — recommended", autoPort: "Automatic", manualPort: "Manual", migrationOptions: "Migration options", swapMailboxes: "Swap source and destination", testConnection: "Test connection",
    saveFlags: "Preserve flags", flagsDescription: "Read, important, answered", saveDates: "Preserve dates", datesDescription: "Original received time",
    dryRun: "Dry run", dryRunDescription: "Do not copy anything", folderSelection: "Folder selection", allFolders: "All folders", selectedFolders: "Folders selected: {count}",
    destinationSubfolder: "Destination subfolder", destinationSubfolderDescription: "Leave empty for a normal transfer", destinationSubfolderPlaceholder: "For example: Imported mail",
    strictMirror: "Strict mirror", strictMirrorOff: "Off · safe mode", strictMirrorOn: "On · extra messages will be deleted", folders: "FOLDERS", chooseFolders: "Choose folders to transfer",
    chooseFoldersDescription: "MoveMailbox will read the folder list from the source. The password is used only for this connection and is not stored.", selectAll: "Select all", clearAll: "Clear all", reloadFolders: "Reload list",
    foldersLoading: "Loading folders…", foldersEmpty: "The server returned no selectable folders", foldersFailed: "Could not load folders", applySelection: "Apply selection", chooseAtLeastOneFolder: "Select at least one folder",
    sourceMustBeVerified: "Test the source connection first", destructiveOption: "DESTRUCTIVE OPTION", strictMirrorTitle: "Enable strict mirror?",
    strictMirrorWarning: "Messages that do not exist in the source will be deleted from the corresponding destination folders. This can be irreversible.", strictMirrorDoes: "What will happen",
    strictMirrorDelete: "Extra destination messages will be deleted", strictMirrorSourceSafe: "The source will remain unchanged", strictMirrorBackup: "Run a dry test or make a backup first",
    strictMirrorAcknowledge: "I understand that extra destination messages will be deleted", keepSafeMode: "Keep safe mode", enableStrictMirror: "Enable strict mirror",
    sourceUntouched: "Messages remain in the source mailbox", destinationCleanupWarning: "Extra destination messages will be deleted", startMigration: "Start migration",
    migrationRunning: "MIGRATION RUNNING", migratingMailbox: "Moving mailbox", cancel: "Cancel", transferred: "Transferred", messages: "messages",
    skipped: "Skipped", alreadyThere: "already existed", volume: "Volume", data: "of data", time: "Time", elapsed: "elapsed", technicalLog: "Technical log",
    forDiagnostics: "for diagnostics", newMigration: "New migration", footerDescription: "IMAP → IMAP · safe one-way copying", journal: "JOURNAL",
    migrationHistory: "Migration history", showPassword: "Show password", hidePassword: "Hide password", engineUnavailable: "Migration engine is unavailable",
    checkBoth: "Test both connections first", demoMode: "Demo mode", engineReady: "{engine} ready", imapsyncMissing: "imapsync not found", apiUnavailable: "API unavailable",
    checking: "Checking…", connected: "Connected", connectionEstablished: "Connection established", sourceReady: "Source is ready for migration",
    destinationReady: "Destination is ready to receive mail", connectionFailed: "Connection failed", connectionError: "Error", verifyConnections: "Test the connections",
    verifyBeforeStart: "Verify both source and destination before migration", migrationNotStarted: "Migration was not started", verificationRequired: "Verification required", settingsChangedDuringCheck: "Connection settings changed during the test. Test the connection again.",
    logGap: "Part of the technical log was dropped ({count} events)", scanningFolders: "Scanning folders", migrationCompletedBadge: " MIGRATION COMPLETED",
    migrationCancelledBadge: " MIGRATION CANCELLED", attentionBadge: " ATTENTION REQUIRED", mailTransferred: "Mail transferred successfully",
    migrationStopped: "Migration stopped", migrationFailed: "Migration failed", migrationCompleted: "Migration completed",
    transferredCount: "Messages transferred: {count}", jobStopped: "Job stopped", cancelFailed: "Could not cancel", historyLoading: "Loading history…",
    historyEmpty: "Your migrations will appear here", statusQueued: "Queued", statusRunning: "Running", statusCompleted: "Completed", statusFailed: "Failed",
    statusCancelled: "Cancelled", phasePreparing: "Preparing", phaseConnecting: "Connecting", phaseScanning: "Scanning folders", phaseCopying: "Copying",
    phaseVerifying: "Verifying result", httpError: "HTTP error {status}", close: "Close", switchLanguage: "Переключить на русский",
    errorHostDenied: "The server address is not allowed", errorCrossSite: "Cross-site request denied", errorJSONRequired: "A JSON request is required",
    errorJobNotFound: "Migration job not found", errorJobFinished: "Migration job has already finished", errorJobLimit: "The migration queue is full",
    errorEngineUnavailable: "Migration engine is unavailable", errorManagerStopping: "MoveMailbox is shutting down", errorInvalidRequest: "Invalid request",
    installImapsync: "Start the app with imapsync installed or use demo mode",
    homeLabel: "MoveMailbox — home",
    byteUnits: ["B", "KB", "MB", "GB", "TB"], locale: "en-US",
  },
};

function initialLocale() {
  try {
    const stored = localStorage.getItem("movemailbox.locale");
    if (stored === "ru" || stored === "en") return stored;
  } catch { /* storage may be unavailable */ }
  return "ru";
}

function t(key, variables = {}) {
  const value = translations[state?.locale || "ru"]?.[key] ?? translations.ru[key] ?? key;
  if (typeof value !== "string") return value;
  return Object.entries(variables).reduce((text, [name, replacement]) => text.replaceAll(`{${name}}`, replacement), value);
}

const state = {
  locale: initialLocale(),
  engine: null,
  available: false,
  currentJob: null,
  stream: null,
  timer: null,
  startedAt: null,
  toastTimer: null,
  refreshTimer: null,
  verified: { source: false, destination: false },
  logNodes: [],
  seenEvents: new Set(),
  modalReturnFocus: null,
  lastView: null,
  availableFolders: [],
  selectedFolders: [],
  strictMirror: false,
};

const MAX_LOG_LINES = 2000;
const MAX_SEEN_EVENTS = 4000;

const elements = {
  form: byId("migrationForm"),
  setup: byId("setupView"),
  progress: byId("progressView"),
  launch: byId("launchButton"),
  enginePill: byId("enginePill"),
  engineLabel: byId("engineLabel"),
  progressBar: byId("progressBar"),
  progressPercent: byId("progressPercent"),
  progressPhase: byId("progressPhase"),
  currentFolder: byId("currentFolder"),
  transferred: byId("transferredMetric"),
  skipped: byId("skippedMetric"),
  bytes: byId("bytesMetric"),
  time: byId("timeMetric"),
  route: byId("progressRoute"),
  title: byId("progressTitle"),
  log: byId("logOutput"),
  cancel: byId("cancelButton"),
  finishedActions: byId("finishedActions"),
  historyModal: byId("historyModal"),
  historyList: byId("historyList"),
  folderModal: byId("folderModal"),
  folderList: byId("folderList"),
  strictMirrorModal: byId("strictMirrorModal"),
  appShell: document.querySelector(".app-shell"),
  toast: byId("toast"),
  toastTitle: byId("toastTitle"),
  toastMessage: byId("toastMessage"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  let payload = null;
  try { payload = await response.json(); } catch { /* empty body */ }
  if (!response.ok) {
    const code = payload?.code || payload?.error?.code || "http.error";
    const localizedKey = ({
      "request.host.denied": "errorHostDenied",
      "request.cross_site": "errorCrossSite",
      "request.origin.denied": "errorCrossSite",
      "request.json.required": "errorJSONRequired",
      "job.not_found": "errorJobNotFound",
      "job.finished": "errorJobFinished",
      "job.limit_reached": "errorJobLimit",
      "engine.unavailable": "errorEngineUnavailable",
      "manager.shutting_down": "errorManagerStopping",
      "validation.request": "errorInvalidRequest",
    })[code];
    const serverDetail = typeof payload?.error === "string" ? payload.error : payload?.error?.message;
    const detail = localizedKey ? t(localizedKey) : serverDetail;
    const error = new Error(detail || t("httpError", { status: response.status }));
    error.code = code;
    error.status = response.status;
    throw error;
  }
  return payload;
}

function showToast(title, message, type = "success") {
  elements.toastTitle.textContent = title;
  elements.toastMessage.textContent = message;
  elements.toast.classList.toggle("error", type === "error");
  elements.toast.classList.add("visible");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 4200);
}

function openModal(modal, focusTarget) {
  state.modalReturnFocus = document.activeElement;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  elements.appShell.inert = true;
  elements.appShell.setAttribute("aria-hidden", "true");
  (focusTarget || modal.querySelector("button, input, select, [tabindex]:not([tabindex='-1'])"))?.focus();
}

function closeModal(modal) {
  if (modal.classList.contains("hidden")) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  elements.appShell.inert = false;
  elements.appShell.removeAttribute("aria-hidden");
  state.modalReturnFocus?.focus();
  state.modalReturnFocus = null;
}

function folderCheckboxes() {
  return [...elements.folderList.querySelectorAll("input[data-folder]")];
}

function updateFolderSummary() {
  byId("folderSelectionSummary").textContent = state.selectedFolders.length
    ? t("selectedFolders", { count: state.selectedFolders.length })
    : t("allFolders");
}

function renderFolderList() {
  elements.folderList.replaceChildren();
  if (!state.availableFolders.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = t("foldersEmpty");
    elements.folderList.append(empty);
    return;
  }
  const selected = new Set(state.selectedFolders);
  const selectEverything = selected.size === 0;
  state.availableFolders.forEach((folder) => {
    const label = document.createElement("label");
    label.className = "folder-choice";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.folder = folder.name;
    input.checked = selectEverything || selected.has(folder.name);
    const box = document.createElement("span");
    box.className = "check-ui";
    box.innerHTML = '<svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7"/></svg>';
    const name = document.createElement("span");
    name.textContent = folder.name;
    label.append(input, box, name);
    elements.folderList.append(label);
  });
}

async function loadFolders() {
  elements.folderList.innerHTML = `<div class="history-empty">${t("foldersLoading")}</div>`;
  for (const button of [byId("reloadFolders"), byId("applyFolderSelection")]) button.disabled = true;
  try {
    const payload = await api("/api/connections/folders", { method: "POST", body: JSON.stringify(endpoint("source")) });
    state.availableFolders = Array.isArray(payload.folders) ? payload.folders : [];
    const availableNames = new Set(state.availableFolders.map((folder) => folder.name));
    state.selectedFolders = state.selectedFolders.filter((folder) => availableNames.has(folder));
    renderFolderList();
  } catch (error) {
    elements.folderList.replaceChildren();
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = error.message;
    elements.folderList.append(empty);
    showToast(t("foldersFailed"), error.message, "error");
  } finally {
    byId("reloadFolders").disabled = false;
    byId("applyFolderSelection").disabled = false;
  }
}

function openFolderSelection() {
  if (!state.verified.source) {
    showToast(t("verificationRequired"), t("sourceMustBeVerified"), "error");
    document.querySelector(".source-card .test-button")?.focus();
    return;
  }
  openModal(elements.folderModal, byId("closeFolderModal"));
  loadFolders();
}

function applyFolderSelection() {
  const checkboxes = folderCheckboxes();
  const selected = checkboxes.filter((input) => input.checked).map((input) => input.dataset.folder);
  if (!selected.length) {
    showToast(t("folderSelection"), t("chooseAtLeastOneFolder"), "error");
    return;
  }
  state.selectedFolders = selected.length === checkboxes.length ? [] : selected;
  updateFolderSummary();
  closeModal(elements.folderModal);
}

function updateStrictMirrorUI() {
  const button = byId("strictMirrorButton");
  button.setAttribute("aria-pressed", String(state.strictMirror));
  byId("strictMirrorSummary").textContent = state.strictMirror ? t("strictMirrorOn") : t("strictMirrorOff");
  const safety = document.querySelector(".safety-note span");
  safety.textContent = state.strictMirror ? t("destinationCleanupWarning") : t("sourceUntouched");
  safety.closest(".safety-note").classList.toggle("danger", state.strictMirror);
}

function toggleStrictMirror() {
  if (state.strictMirror) {
    state.strictMirror = false;
    updateStrictMirrorUI();
    return;
  }
  byId("strictMirrorAcknowledge").checked = false;
  byId("confirmStrictMirror").disabled = true;
  openModal(elements.strictMirrorModal, byId("cancelStrictMirror"));
}

function enableStrictMirror() {
  if (!byId("strictMirrorAcknowledge").checked) return;
  state.strictMirror = true;
  updateStrictMirrorUI();
  closeModal(elements.strictMirrorModal);
}

function automaticPort(side) {
  return byId(`${side}Security`).value === "tls" ? 993 : 143;
}

function updatePortControl(side) {
  const mode = byId(`${side}PortMode`);
  const port = byId(`${side}Port`);
  const automatic = automaticPort(side);
  mode.querySelector("option[value='auto']").textContent = `${t("autoPort")} · ${automatic}`;
  const isAutomatic = mode.value === "auto";
  port.classList.toggle("hidden", isAutomatic);
  port.parentElement.classList.toggle("manual", !isAutomatic);
  if (isAutomatic) port.value = automatic;
}

function endpoint(side) {
  updatePortControl(side);
  return {
    host: byId(`${side}Host`).value.trim(),
    port: Number(byId(`${side}Port`).value),
    security: byId(`${side}Security`).value,
    username: byId(`${side}Username`).value.trim(),
    password: byId(`${side}Password`).value,
  };
}

function sameEndpoint(left, right) {
  return ["host", "port", "security", "username", "password"].every((field) => left[field] === right[field]);
}

function requestPayload() {
  return {
    source: endpoint("source"),
    destination: endpoint("destination"),
    options: {
      syncFlags: byId("syncFlags").checked,
      preserveDates: byId("preserveDates").checked,
      dryRun: byId("dryRun").checked,
      folders: [...state.selectedFolders],
      destinationSubfolder: byId("destinationSubfolder").value.trim(),
      strictMirror: state.strictMirror,
      strictMirrorConfirmed: state.strictMirror,
    },
  };
}

function setLaunchState() {
  const connectionsReady = state.verified.source && state.verified.destination;
  elements.launch.disabled = !state.available || !connectionsReady;
  if (!state.available) {
    elements.launch.title = t("engineUnavailable");
  } else if (!connectionsReady) {
    elements.launch.title = t("checkBoth");
  } else {
    elements.launch.removeAttribute("title");
  }
}

async function loadHealth() {
  try {
    const health = await api("/api/health");
    state.engine = health.engine;
    state.available = health.available;
    elements.enginePill.classList.remove("unavailable");
    if (health.available) {
      elements.enginePill.classList.add("ready");
      elements.engineLabel.textContent = health.engine === "demo" ? t("demoMode") : t("engineReady", { engine: health.engine });
      if (health.engine === "demo") fillDemoData();
    } else {
      elements.enginePill.classList.add("unavailable");
      elements.engineLabel.textContent = t("imapsyncMissing");
      elements.launch.title = t("installImapsync");
    }
    setLaunchState();
  } catch (error) {
    state.available = false;
    elements.enginePill.classList.add("unavailable");
    elements.engineLabel.textContent = t("apiUnavailable");
    setLaunchState();
  }
}

function fillDemoData() {
  const values = {
    sourceHost: "imap.old-company.test",
    sourceUsername: "anna@old-company.test",
    sourcePassword: "demo-source-password",
    destinationHost: "imap.new-company.test",
    destinationUsername: "anna@new-company.test",
    destinationPassword: "demo-destination-password",
  };
  Object.entries(values).forEach(([id, value]) => {
    if (!byId(id).value) byId(id).value = value;
  });
}

async function testConnection(side, button) {
  const status = byId(`${side}Status`);
  const fields = ["Host", "Port", "Username", "Password"].map((suffix) => byId(`${side}${suffix}`));
  if (fields.some((field) => !field.reportValidity())) return;
  const testedEndpoint = endpoint(side);
  const controls = [...button.closest(".connection-card").querySelectorAll("input, select")];
  const previouslyDisabled = controls.map((control) => control.disabled);
  controls.forEach((control) => { control.disabled = true; });
  button.classList.add("loading");
  button.disabled = true;
  status.className = "card-status";
  status.replaceChildren(document.createElement("i"), document.createTextNode(` ${t("checking")}`));
  try {
    await api("/api/connections/test", { method: "POST", body: JSON.stringify(testedEndpoint) });
    if (!sameEndpoint(testedEndpoint, endpoint(side))) throw new Error(t("settingsChangedDuringCheck"));
    state.verified[side] = true;
    status.className = "card-status success";
    status.replaceChildren(document.createElement("i"), document.createTextNode(` ${t("connected")}`));
    showToast(t("connectionEstablished"), side === "source" ? t("sourceReady") : t("destinationReady"));
  } catch (error) {
    state.verified[side] = false;
    status.className = "card-status error";
    status.replaceChildren(document.createElement("i"), document.createTextNode(` ${t("connectionError")}`));
    showToast(t("connectionFailed"), error.message, "error");
  } finally {
    controls.forEach((control, index) => { control.disabled = previouslyDisabled[index]; });
    button.classList.remove("loading");
    button.disabled = false;
    setLaunchState();
  }
}

async function startMigration(event) {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  if (!state.verified.source || !state.verified.destination) {
    showToast(t("verifyConnections"), t("verifyBeforeStart"), "error");
    setLaunchState();
    return;
  }
  elements.launch.disabled = true;
  try {
    const job = await api("/api/jobs", { method: "POST", body: JSON.stringify(requestPayload()) });
    state.currentJob = job.id;
    state.startedAt = new Date();
    openProgress(job);
    connectEvents(job.id);
    clearSensitiveFields();
  } catch (error) {
    showToast(t("migrationNotStarted"), error.message, "error");
    setLaunchState();
  }
}

function clearSensitiveFields() {
  ["source", "destination"].forEach((side) => {
    byId(`${side}Password`).value = "";
    state.verified[side] = false;
    const status = byId(`${side}Status`);
    status.className = "card-status";
    status.replaceChildren(document.createElement("i"), document.createTextNode(` ${t("verificationRequired")}`));
  });
  setLaunchState();
}

function openProgress(job) {
  elements.setup.classList.add("hidden");
  elements.progress.classList.remove("hidden", "completed", "failed");
  elements.finishedActions.classList.add("hidden");
  elements.cancel.classList.remove("hidden");
  elements.title.textContent = t("migratingMailbox");
  elements.route.textContent = `${job.source}  →  ${job.destination}`;
  resetLog();
  updateView(job);
  clearInterval(state.timer);
  state.timer = setInterval(updateTimer, 1000);
  window.scrollTo({ top: elements.progress.offsetTop - 24, behavior: "smooth" });
}

function connectEvents(id) {
  if (state.stream) state.stream.close();
  const stream = new EventSource(`/api/jobs/${id}/events`);
  state.stream = stream;
  stream.addEventListener("snapshot", (message) => updateView(JSON.parse(message.data)));
  stream.addEventListener("migration", (message) => {
    const event = JSON.parse(message.data);
    updateEvent(event, message.lastEventId);
    if (event.type === "finished") finishMigration(id);
  });
  stream.onerror = () => {
    clearTimeout(state.refreshTimer);
    if (state.currentJob) {
      state.refreshTimer = setTimeout(async () => {
        const exists = await refreshJob(id);
        if (!exists && state.stream) {
          state.stream.close();
          state.stream = null;
        }
      }, 1200);
    }
  };
}

function updateEvent(event, eventID = "") {
  if (event.type === "gap") {
    appendLog(t("logGap", { count: event.dropped || "?" }));
    return;
  }
  if (event.progress > 0) {
    setProgress(event.progress);
    setIndeterminate(false);
  } else if (event.type === "progress") {
    setIndeterminate(true);
  }
  if (event.phase) {
    elements.progressPhase.dataset.phase = event.phase;
    elements.progressPhase.textContent = phaseLabel(event.phase);
  }
  if (state.lastView) {
    for (const field of ["phase", "currentFolder", "progress", "transferred", "skipped", "bytes"]) {
      if (event[field] !== undefined) state.lastView[field] = event[field];
    }
  }
  if (event.currentFolder) elements.currentFolder.textContent = event.currentFolder;
  if (typeof event.transferred === "number") elements.transferred.textContent = event.transferred.toLocaleString(t("locale"));
  if (typeof event.skipped === "number") elements.skipped.textContent = event.skipped.toLocaleString(t("locale"));
  if (typeof event.bytes === "number") elements.bytes.textContent = formatBytes(event.bytes);
  if (event.message) appendLog(event.message, event.timestamp, event.sequence || eventID);
}

function updateView(job) {
  state.lastView = { ...job };
  setProgress(job.progress || 0);
  setIndeterminate(job.status === "running" && !(job.progress > 0));
  elements.progressPhase.dataset.phase = job.phase || "preparing";
  elements.progressPhase.textContent = phaseLabel(job.phase || "preparing");
  elements.currentFolder.textContent = job.currentFolder || t("scanningFolders");
  elements.transferred.textContent = (job.transferred || 0).toLocaleString(t("locale"));
  elements.skipped.textContent = (job.skipped || 0).toLocaleString(t("locale"));
  elements.bytes.textContent = formatBytes(job.bytes || 0);
  if (job.startedAt) state.startedAt = new Date(job.startedAt);
  (job.recentEvents || []).forEach((event) => {
    if (event.message) appendLog(event.message, event.timestamp, event.sequence);
  });
  if (["completed", "failed", "cancelled"].includes(job.status)) renderFinished(job);
}

function setProgress(value) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  elements.progressBar.style.width = `${safe}%`;
  elements.progressPercent.textContent = `${safe}%`;
}

function setIndeterminate(enabled) {
  elements.progress.querySelector(".progress-track").classList.toggle("indeterminate", enabled);
  if (enabled) elements.progressPercent.textContent = "…";
}

function resetLog() {
  elements.log.replaceChildren();
  state.logNodes = [];
  state.seenEvents.clear();
}

function appendLog(message, timestamp, eventID = "") {
  const signature = `event:${timestamp || ""}:${message}`;
  const idKey = eventID ? `id:${eventID}` : "";
  if (state.seenEvents.has(signature) || (idKey && state.seenEvents.has(idKey))) return;
  state.seenEvents.add(signature);
  if (idKey) state.seenEvents.add(idKey);
  while (state.seenEvents.size > MAX_SEEN_EVENTS) {
    const oldest = state.seenEvents.values().next().value;
    state.seenEvents.delete(oldest);
  }
  const time = timestamp ? new Date(timestamp).toLocaleTimeString(t("locale")) : new Date().toLocaleTimeString(t("locale"));
  const shouldScroll = elements.log.scrollHeight - elements.log.scrollTop - elements.log.clientHeight < 28;
  const node = document.createTextNode(`[${time}] ${message}\n`);
  elements.log.append(node);
  state.logNodes.push(node);
  while (state.logNodes.length > MAX_LOG_LINES) state.logNodes.shift().remove();
  if (shouldScroll) elements.log.scrollTop = elements.log.scrollHeight;
}

async function finishMigration(id) {
  if (state.stream) state.stream.close();
  state.stream = null;
  await refreshJob(id);
}

async function refreshJob(id) {
  try {
    const job = await api(`/api/jobs/${id}`);
    updateView(job);
    return true;
  } catch (error) {
    return error.status !== 404;
  }
}

function renderFinished(job) {
  clearInterval(state.timer);
  elements.cancel.classList.add("hidden");
  elements.finishedActions.classList.remove("hidden");
  const badgeText = elements.progress.querySelector(".live-badge");
  if (job.status === "completed") {
    elements.progress.classList.add("completed");
    badgeText.lastChild.textContent = t("migrationCompletedBadge");
    elements.title.textContent = t("mailTransferred");
    elements.progressPhase.dataset.phase = "completed";
    elements.progressPhase.textContent = phaseLabel("completed");
    setIndeterminate(false);
    setProgress(100);
    showToast(t("migrationCompleted"), t("transferredCount", { count: (job.transferred || 0).toLocaleString(t("locale")) }));
  } else {
    elements.progress.classList.add("failed");
    badgeText.lastChild.textContent = job.status === "cancelled" ? t("migrationCancelledBadge") : t("attentionBadge");
    elements.title.textContent = job.status === "cancelled" ? t("migrationStopped") : t("migrationFailed");
    elements.progressPhase.dataset.phase = job.phase || "failed";
    elements.progressPhase.textContent = phaseLabel(job.phase || "failed");
    setIndeterminate(false);
    if (job.error) appendLog(job.error);
    showToast(elements.title.textContent, job.error || t("jobStopped"), "error");
  }
  state.currentJob = null;
}

function updateTimer() {
  if (!state.startedAt) return;
  const seconds = Math.max(0, Math.floor((Date.now() - state.startedAt.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  elements.time.textContent = `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function formatBytes(value) {
  if (!value) return `0 ${t("byteUnits")[0]}`;
  const units = t("byteUnits");
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** index)).toLocaleString(t("locale"), { maximumFractionDigits: index ? 1 : 0 })} ${units[index]}`;
}

async function cancelMigration() {
  if (!state.currentJob) return;
  elements.cancel.disabled = true;
  try {
    await api(`/api/jobs/${state.currentJob}/cancel`, { method: "POST" });
  } catch (error) {
    showToast(t("cancelFailed"), error.message, "error");
  } finally {
    elements.cancel.disabled = false;
  }
}

function newMigration() {
  if (state.stream) state.stream.close();
  state.currentJob = null;
  elements.progress.classList.add("hidden");
  elements.setup.classList.remove("hidden");
  setLaunchState();
  window.scrollTo({ top: elements.setup.offsetTop - 22, behavior: "smooth" });
}

async function openHistory() {
  openModal(elements.historyModal, byId("closeHistory"));
  elements.historyList.innerHTML = `<div class="history-empty">${t("historyLoading")}</div>`;
  try {
    const jobs = await api("/api/jobs");
    renderHistory(jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    elements.historyList.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = error.message;
    elements.historyList.append(empty);
  }
}

function renderHistory(jobs) {
  elements.historyList.innerHTML = "";
  if (!jobs.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = t("historyEmpty");
    elements.historyList.append(empty);
    return;
  }
  jobs.forEach((job) => {
    const item = document.createElement("article");
    item.className = "history-item";
    const title = document.createElement("strong");
    title.textContent = `${job.source} → ${job.destination}`;
    const status = document.createElement("span");
    status.className = `history-status ${job.status}`;
    status.textContent = statusLabel(job.status);
    const details = document.createElement("p");
    details.textContent = `${new Date(job.createdAt).toLocaleString(t("locale"))} · ${job.transferred || 0} ${t("messages")} · ${formatBytes(job.bytes || 0)}`;
    item.append(title, status, details);
    elements.historyList.append(item);
  });
}

function statusLabel(status) {
  return ({ queued: t("statusQueued"), running: t("statusRunning"), completed: t("statusCompleted"), failed: t("statusFailed"), cancelled: t("statusCancelled") })[status] || status;
}

function phaseLabel(phase) {
  return ({
    queued: t("statusQueued"),
    preparing: t("phasePreparing"),
    connecting: t("phaseConnecting"),
    scanning: t("phaseScanning"),
    copying: t("phaseCopying"),
    verifying: t("phaseVerifying"),
    completed: t("statusCompleted"),
    cancelled: t("statusCancelled"),
    failed: t("statusFailed"),
  })[phase] || phase;
}

function applyLocale() {
  document.documentElement.lang = state.locale;
  document.title = state.locale === "ru" ? "MoveMailbox — перенос почты без лишней боли" : "MoveMailbox — email migration made clear";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-placeholder-i18n]").forEach((element) => {
    element.placeholder = t(element.dataset.placeholderI18n);
  });
  byId("languageButton").textContent = state.locale === "ru" ? "EN" : "RU";
  byId("languageButton").setAttribute("aria-label", t("switchLanguage"));
  document.querySelector(".brand").setAttribute("aria-label", t("homeLabel"));
  byId("closeHistory").setAttribute("aria-label", t("close"));
  byId("closeFolderModal").setAttribute("aria-label", t("close"));
  document.querySelectorAll(".reveal-button").forEach((button) => {
    const input = byId(button.dataset.target);
    button.setAttribute("aria-label", input.type === "text" ? t("hidePassword") : t("showPassword"));
  });
  if (elements.progressPhase.dataset.phase) {
    elements.progressPhase.textContent = phaseLabel(elements.progressPhase.dataset.phase);
  }
  if (state.lastView && !elements.progress.classList.contains("hidden")) {
    const job = state.lastView;
    elements.transferred.textContent = (job.transferred || 0).toLocaleString(t("locale"));
    elements.skipped.textContent = (job.skipped || 0).toLocaleString(t("locale"));
    elements.bytes.textContent = formatBytes(job.bytes || 0);
    if (["completed", "failed", "cancelled"].includes(job.status)) {
      const badgeText = elements.progress.querySelector(".live-badge");
      badgeText.lastChild.textContent = job.status === "completed"
        ? t("migrationCompletedBadge")
        : (job.status === "cancelled" ? t("migrationCancelledBadge") : t("attentionBadge"));
      elements.title.textContent = job.status === "completed"
        ? t("mailTransferred")
        : (job.status === "cancelled" ? t("migrationStopped") : t("migrationFailed"));
    }
  }
  if (state.engine) {
    elements.engineLabel.textContent = state.available
      ? (state.engine === "demo" ? t("demoMode") : t("engineReady", { engine: state.engine }))
      : t("imapsyncMissing");
  }
  ["source", "destination"].forEach(updatePortControl);
  updateFolderSummary();
  updateStrictMirrorUI();
  setLaunchState();
}

function resetEndpointVerification(side) {
  state.verified[side] = false;
  const status = byId(`${side}Status`);
  status.className = "card-status";
  status.replaceChildren(document.createElement("i"), document.createTextNode(` ${t("notChecked")}`));
  if (side === "source") {
    state.availableFolders = [];
    state.selectedFolders = [];
    updateFolderSummary();
  }
}

function swapMailboxes() {
  ["Host", "Port", "PortMode", "Security", "Username", "Password"].forEach((suffix) => {
    const source = byId(`source${suffix}`);
    const destination = byId(`destination${suffix}`);
    const value = source.value;
    source.value = destination.value;
    destination.value = value;
  });
  ["source", "destination"].forEach((side) => {
    updatePortControl(side);
    resetEndpointVerification(side);
  });
  setLaunchState();
}

function closeHistory() {
  closeModal(elements.historyModal);
}

document.querySelectorAll(".test-button").forEach((button) => button.addEventListener("click", () => testConnection(button.dataset.side, button)));
document.querySelectorAll(".reveal-button").forEach((button) => button.addEventListener("click", () => {
  const input = byId(button.dataset.target);
  input.type = input.type === "password" ? "text" : "password";
  button.classList.toggle("visible", input.type === "text");
  button.setAttribute("aria-label", input.type === "text" ? t("hidePassword") : t("showPassword"));
}));
document.querySelectorAll("select[id$='Security']").forEach((select) => select.addEventListener("change", () => {
  const side = select.id.replace("Security", "");
  updatePortControl(side);
}));
document.querySelectorAll("select[id$='PortMode']").forEach((select) => select.addEventListener("change", () => {
  updatePortControl(select.id.replace("PortMode", ""));
}));
document.querySelectorAll(".connection-card input, .connection-card select").forEach((input) => input.addEventListener("input", () => {
  const side = input.closest(".source-card") ? "source" : "destination";
  resetEndpointVerification(side);
  setLaunchState();
}));

elements.form.addEventListener("submit", startMigration);
elements.cancel.addEventListener("click", cancelMigration);
byId("newMigrationButton").addEventListener("click", newMigration);
byId("swapButton").addEventListener("click", swapMailboxes);
byId("folderSelectionButton").addEventListener("click", openFolderSelection);
byId("reloadFolders").addEventListener("click", loadFolders);
byId("selectAllFolders").addEventListener("click", () => folderCheckboxes().forEach((input) => { input.checked = true; }));
byId("clearAllFolders").addEventListener("click", () => folderCheckboxes().forEach((input) => { input.checked = false; }));
byId("applyFolderSelection").addEventListener("click", applyFolderSelection);
byId("closeFolderModal").addEventListener("click", () => closeModal(elements.folderModal));
byId("cancelFolderSelection").addEventListener("click", () => closeModal(elements.folderModal));
byId("strictMirrorButton").addEventListener("click", toggleStrictMirror);
byId("strictMirrorAcknowledge").addEventListener("change", (event) => { byId("confirmStrictMirror").disabled = !event.target.checked; });
byId("confirmStrictMirror").addEventListener("click", enableStrictMirror);
byId("cancelStrictMirror").addEventListener("click", () => closeModal(elements.strictMirrorModal));
byId("historyButton").addEventListener("click", openHistory);
byId("languageButton").addEventListener("click", () => {
  state.locale = state.locale === "ru" ? "en" : "ru";
  try { localStorage.setItem("movemailbox.locale", state.locale); } catch { /* storage may be unavailable */ }
  applyLocale();
});
byId("closeHistory").addEventListener("click", closeHistory);
elements.historyModal.addEventListener("click", (event) => {
  if (event.target === elements.historyModal) closeHistory();
});
elements.folderModal.addEventListener("click", (event) => {
  if (event.target === elements.folderModal) closeModal(elements.folderModal);
});
elements.strictMirrorModal.addEventListener("click", (event) => {
  if (event.target === elements.strictMirrorModal) closeModal(elements.strictMirrorModal);
});
document.addEventListener("keydown", (event) => {
  const activeModal = [elements.strictMirrorModal, elements.folderModal, elements.historyModal].find((modal) => !modal.classList.contains("hidden"));
  if (event.key === "Escape" && activeModal) closeModal(activeModal);
  if (event.key === "Tab" && activeModal) {
    const focusable = [...activeModal.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((element) => !element.disabled);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

applyLocale();
loadHealth();
