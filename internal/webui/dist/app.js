const byId = (id) => document.getElementById(id);

const state = {
  engine: null,
  available: false,
  currentJob: null,
  stream: null,
  timer: null,
  startedAt: null,
  toastTimer: null,
};

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
  if (!response.ok) throw new Error(payload?.error || `Ошибка HTTP ${response.status}`);
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

function endpoint(side) {
  return {
    host: byId(`${side}Host`).value.trim(),
    port: Number(byId(`${side}Port`).value),
    security: byId(`${side}Security`).value,
    username: byId(`${side}Username`).value.trim(),
    password: byId(`${side}Password`).value,
  };
}

function requestPayload() {
  return {
    source: endpoint("source"),
    destination: endpoint("destination"),
    options: {
      syncFlags: byId("syncFlags").checked,
      preserveDates: byId("preserveDates").checked,
      dryRun: byId("dryRun").checked,
    },
  };
}

async function loadHealth() {
  try {
    const health = await api("/api/health");
    state.engine = health.engine;
    state.available = health.available;
    elements.enginePill.classList.remove("unavailable");
    if (health.available) {
      elements.enginePill.classList.add("ready");
      elements.engineLabel.textContent = health.engine === "demo" ? "Демо-режим" : `${health.engine} готов`;
      elements.launch.disabled = false;
      if (health.engine === "demo") fillDemoData();
    } else {
      elements.enginePill.classList.add("unavailable");
      elements.engineLabel.textContent = "imapsync не найден";
      elements.launch.disabled = true;
      elements.launch.title = "Запустите приложение с установленным imapsync или в demo-режиме";
    }
  } catch (error) {
    elements.enginePill.classList.add("unavailable");
    elements.engineLabel.textContent = "API недоступен";
    elements.launch.disabled = true;
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
  button.classList.add("loading");
  button.disabled = true;
  status.className = "card-status";
  status.innerHTML = "<i></i> Проверяем…";
  try {
    await api("/api/connections/test", { method: "POST", body: JSON.stringify(endpoint(side)) });
    status.className = "card-status success";
    status.innerHTML = "<i></i> Подключено";
    showToast("Соединение установлено", side === "source" ? "Источник готов к миграции" : "Сервер назначения готов принимать почту");
  } catch (error) {
    status.className = "card-status error";
    status.innerHTML = "<i></i> Ошибка";
    showToast("Не удалось подключиться", error.message, "error");
  } finally {
    button.classList.remove("loading");
    button.disabled = false;
  }
}

async function startMigration(event) {
  event.preventDefault();
  if (!elements.form.reportValidity()) return;
  elements.launch.disabled = true;
  try {
    const job = await api("/api/jobs", { method: "POST", body: JSON.stringify(requestPayload()) });
    state.currentJob = job.id;
    state.startedAt = new Date();
    openProgress(job);
    connectEvents(job.id);
  } catch (error) {
    showToast("Миграция не запущена", error.message, "error");
    elements.launch.disabled = !state.available;
  }
}

function openProgress(job) {
  elements.setup.classList.add("hidden");
  elements.progress.classList.remove("hidden", "completed", "failed");
  elements.finishedActions.classList.add("hidden");
  elements.cancel.classList.remove("hidden");
  elements.title.textContent = "Переносим почтовый ящик";
  elements.route.textContent = `${job.source}  →  ${job.destination}`;
  elements.log.textContent = "";
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
    updateEvent(event);
    if (event.type === "finished") finishMigration(id);
  });
  stream.onerror = () => {
    if (state.currentJob) setTimeout(() => refreshJob(id), 800);
  };
}

function updateEvent(event) {
  if (event.progress) setProgress(event.progress);
  if (event.phase) elements.progressPhase.textContent = event.phase;
  if (event.currentFolder) elements.currentFolder.textContent = event.currentFolder;
  if (typeof event.transferred === "number") elements.transferred.textContent = event.transferred.toLocaleString("ru-RU");
  if (typeof event.skipped === "number") elements.skipped.textContent = event.skipped.toLocaleString("ru-RU");
  if (typeof event.bytes === "number") elements.bytes.textContent = formatBytes(event.bytes);
  if (event.message) appendLog(event.message, event.timestamp);
}

function updateView(job) {
  setProgress(job.progress || 0);
  elements.progressPhase.textContent = job.phase || "Подготовка";
  elements.currentFolder.textContent = job.currentFolder || "Сканируем папки";
  elements.transferred.textContent = (job.transferred || 0).toLocaleString("ru-RU");
  elements.skipped.textContent = (job.skipped || 0).toLocaleString("ru-RU");
  elements.bytes.textContent = formatBytes(job.bytes || 0);
  if (job.startedAt) state.startedAt = new Date(job.startedAt);
  (job.recentEvents || []).forEach((event) => {
    if (event.message && !elements.log.textContent.includes(event.message)) appendLog(event.message, event.timestamp);
  });
  if (["completed", "failed", "cancelled"].includes(job.status)) renderFinished(job);
}

function setProgress(value) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  elements.progressBar.style.width = `${safe}%`;
  elements.progressPercent.textContent = `${safe}%`;
}

function appendLog(message, timestamp) {
  const time = timestamp ? new Date(timestamp).toLocaleTimeString("ru-RU") : new Date().toLocaleTimeString("ru-RU");
  elements.log.textContent += `[${time}] ${message}\n`;
  elements.log.scrollTop = elements.log.scrollHeight;
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
  } catch { /* the next SSE reconnect or manual refresh will retry */ }
}

function renderFinished(job) {
  clearInterval(state.timer);
  elements.cancel.classList.add("hidden");
  elements.finishedActions.classList.remove("hidden");
  const badgeText = elements.progress.querySelector(".live-badge");
  if (job.status === "completed") {
    elements.progress.classList.add("completed");
    badgeText.lastChild.textContent = " МИГРАЦИЯ ЗАВЕРШЕНА";
    elements.title.textContent = "Почта успешно перенесена";
    elements.progressPhase.textContent = "Готово";
    setProgress(100);
    showToast("Миграция завершена", `Перенесено писем: ${(job.transferred || 0).toLocaleString("ru-RU")}`);
  } else {
    elements.progress.classList.add("failed");
    badgeText.lastChild.textContent = job.status === "cancelled" ? " МИГРАЦИЯ ОТМЕНЕНА" : " НУЖНО ВНИМАНИЕ";
    elements.title.textContent = job.status === "cancelled" ? "Миграция остановлена" : "Миграция завершилась с ошибкой";
    elements.progressPhase.textContent = job.phase || "Ошибка";
    if (job.error) appendLog(job.error);
    showToast(elements.title.textContent, job.error || "Задание остановлено", "error");
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
  if (!value) return "0 Б";
  const units = ["Б", "КБ", "МБ", "ГБ", "ТБ"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / (1024 ** index)).toLocaleString("ru-RU", { maximumFractionDigits: index ? 1 : 0 })} ${units[index]}`;
}

async function cancelMigration() {
  if (!state.currentJob) return;
  elements.cancel.disabled = true;
  try {
    await api(`/api/jobs/${state.currentJob}/cancel`, { method: "POST" });
  } catch (error) {
    showToast("Не удалось отменить", error.message, "error");
  } finally {
    elements.cancel.disabled = false;
  }
}

function newMigration() {
  if (state.stream) state.stream.close();
  state.currentJob = null;
  elements.progress.classList.add("hidden");
  elements.setup.classList.remove("hidden");
  elements.launch.disabled = !state.available;
  window.scrollTo({ top: elements.setup.offsetTop - 22, behavior: "smooth" });
}

async function openHistory() {
  elements.historyModal.classList.remove("hidden");
  elements.historyList.innerHTML = '<div class="history-empty">Загружаем историю…</div>';
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
    empty.textContent = "Здесь появятся ваши миграции";
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
    details.textContent = `${new Date(job.createdAt).toLocaleString("ru-RU")} · ${job.transferred || 0} писем · ${formatBytes(job.bytes || 0)}`;
    item.append(title, status, details);
    elements.historyList.append(item);
  });
}

function statusLabel(status) {
  return ({ queued: "В очереди", running: "В работе", completed: "Готово", failed: "Ошибка", cancelled: "Отменено" })[status] || status;
}

document.querySelectorAll(".test-button").forEach((button) => button.addEventListener("click", () => testConnection(button.dataset.side, button)));
document.querySelectorAll(".reveal-button").forEach((button) => button.addEventListener("click", () => {
  const input = byId(button.dataset.target);
  input.type = input.type === "password" ? "text" : "password";
  button.classList.toggle("visible", input.type === "text");
}));
document.querySelectorAll("select[id$='Security']").forEach((select) => select.addEventListener("change", () => {
  const side = select.id.replace("Security", "");
  const port = byId(`${side}Port`);
  if ([993, 143].includes(Number(port.value))) port.value = select.value === "tls" ? 993 : 143;
}));
document.querySelectorAll(".connection-card input, .connection-card select").forEach((input) => input.addEventListener("input", () => {
  const side = input.closest(".source-card") ? "source" : "destination";
  const status = byId(`${side}Status`);
  status.className = "card-status";
  status.innerHTML = "<i></i> Не проверено";
}));

elements.form.addEventListener("submit", startMigration);
elements.cancel.addEventListener("click", cancelMigration);
byId("newMigrationButton").addEventListener("click", newMigration);
byId("historyButton").addEventListener("click", openHistory);
byId("closeHistory").addEventListener("click", () => elements.historyModal.classList.add("hidden"));
elements.historyModal.addEventListener("click", (event) => {
  if (event.target === elements.historyModal) elements.historyModal.classList.add("hidden");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") elements.historyModal.classList.add("hidden");
});

loadHealth();
