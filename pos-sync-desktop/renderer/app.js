const $ = (id) => document.getElementById(id);

const fields = {
  sqlServer: $("sqlServer"),
  sqlDatabase: $("sqlDatabase"),
  sqlUser: $("sqlUser"),
  sqlPassword: $("sqlPassword"),
  apiBase: $("apiBase"),
  autoMinutes: $("autoMinutes"),
  batchSize: $("batchSize"),
  parallelUploads: $("parallelUploads"),
};

const els = {
  log: $("log"),
  statusChip: $("statusChip"),
  statusText: $("statusText"),
  syncRingWrap: $("syncRingWrap"),
  syncRing: $("syncRing"),
  progressWrap: $("progressWrap"),
  progressFill: $("progressFill"),
  progressLabel: $("progressLabel"),
  logBadge: $("logBadge"),
  statTotal: $("statTotal"),
  statArticles: $("statArticles"),
  statOffers: $("statOffers"),
  statLastSync: $("statLastSync"),
  statLastDetail: $("statLastDetail"),
  infoSql: $("infoSql"),
  infoDb: $("infoDb"),
  infoApi: $("infoApi"),
  infoDbStatus: $("infoDbStatus"),
  infoAuto: $("infoAuto"),
  infoBatch: $("infoBatch"),
  infoParallel: $("infoParallel"),
  infoBarcode: $("infoBarcode"),
  configPath: $("configPath"),
  toastContainer: $("toastContainer"),
  syncDesc: $("syncDesc"),
  autoTimerCard: $("autoTimerCard"),
  timerLabel: $("timerLabel"),
  timerCountdown: $("timerCountdown"),
  timerRing: $("timerRing"),
};

let logCount = 0;
let dbStats = null;
let progressTimer = null;
let autoSyncMinutes = 5;

function fmtCountdown(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateAutoTimer({ enabled, minutes, secondsLeft, syncing: isSyncing }) {
  autoSyncMinutes = minutes ?? autoSyncMinutes;

  if (!enabled) {
    els.autoTimerCard.classList.add("disabled");
    els.autoTimerCard.classList.remove("running");
    els.timerLabel.textContent = "الرفع التلقائي معطّل";
    els.timerCountdown.textContent = "—";
    els.syncDesc.textContent = "المزامنة التلقائية معطّلة — استخدم «مزامنة» يدوياً";
    return;
  }

  els.autoTimerCard.classList.remove("disabled");
  els.autoTimerCard.classList.toggle("running", Boolean(isSyncing));
  els.syncDesc.textContent = `يبحث ويرفع تلقائياً كل ${minutes} دقائق — فقط المنتجات المتغيّرة`;

  if (isSyncing) {
    els.timerLabel.textContent = "جاري البحث والرفع التلقائي...";
    els.timerCountdown.textContent = "●●●";
  } else {
    els.timerLabel.textContent = "الرفع التلقائي خلال";
    els.timerCountdown.textContent = fmtCountdown(secondsLeft ?? 0);
  }
}

function showLogsTab() {
  const logsTab = document.querySelector('.tab[data-tab="logs"]');
  if (logsTab && !logsTab.classList.contains("active")) {
    logsTab.click();
  }
}

function fmt(n) {
  if (n == null || n === "—") return "—";
  return Number(n).toLocaleString("ar-IQ");
}

function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  els.toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function setStatus(running, text) {
  els.statusChip.className = `status-chip ${running ? "running" : "ready"}`;
  els.statusText.textContent = text ?? (running ? "جاري المزامنة..." : "جاهز");
  els.syncRingWrap.classList.toggle("running", running);
  els.syncRing.classList.toggle("active", running);
  $("btnSync").disabled = running;
}

function setProgress(visible, pct = 0, label = "") {
  els.progressWrap.classList.toggle("visible", visible);
  els.progressFill.style.width = `${Math.min(100, pct)}%`;
  if (label) els.progressLabel.textContent = label;
}

function simulateProgress(label = "جاري قراءة SQL ورفع البيانات...") {
  let pct = 8;
  setProgress(true, pct, label);
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    pct = Math.min(pct + Math.random() * 12, 92);
    setProgress(true, pct, label.includes("تلقائي") ? "جاري الرفع التلقائي إلى السيرفر..." : "جاري الرفع إلى السيرفر...");
  }, 600);
}

function stopProgress(done = true) {
  clearInterval(progressTimer);
  if (done) {
    setProgress(true, 100, "اكتمل!");
    setTimeout(() => setProgress(false), 800);
  } else {
    setProgress(false);
  }
}

function appendLog(entry) {
  const empty = els.log.querySelector(".log-empty");
  if (empty) empty.remove();

  const line = document.createElement("div");
  line.className = `log-line ${entry.level || "info"}`;

  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = new Date(entry.at).toLocaleTimeString("ar-IQ");

  const msg = document.createElement("span");
  msg.className = "log-msg";
  msg.textContent = entry.message;

  line.appendChild(time);
  line.appendChild(msg);
  els.log.appendChild(line);
  els.log.scrollTop = els.log.scrollHeight;

  logCount += 1;
  els.logBadge.hidden = false;
  els.logBadge.textContent = logCount > 99 ? "99+" : String(logCount);
}

function readForm() {
  return {
    sqlServer: {
      server: fields.sqlServer.value.trim(),
      database: fields.sqlDatabase.value.trim(),
      user: fields.sqlUser.value.trim(),
      password: fields.sqlPassword.value,
      options: { encrypt: false, trustServerCertificate: true },
    },
    api: { baseUrl: fields.apiBase.value.trim() },
    sync: {
      autoSyncMinutes: Number(fields.autoMinutes.value) || 0,
      batchSize: Number(fields.batchSize.value) || 300,
      parallelUploads: Number(fields.parallelUploads.value) || 4,
    },
  };
}

function fillForm(config) {
  if (!config) return;
  fields.sqlServer.value = config.sqlServer?.server ?? "";
  fields.sqlDatabase.value = config.sqlServer?.database ?? "";
  fields.sqlUser.value = config.sqlServer?.user ?? "";
  fields.sqlPassword.value = config.sqlServer?.password ?? "";
  fields.apiBase.value = config.api?.baseUrl ?? "";
  fields.autoMinutes.value = String(config.sync?.autoSyncMinutes ?? 5);
  fields.batchSize.value = String(config.sync?.batchSize ?? 300);
  fields.parallelUploads.value = String(config.sync?.parallelUploads ?? 4);
  updateInfoPanel(config);
}

function updateInfoPanel(config) {
  if (!config) return;
  els.infoSql.textContent = config.sqlServer?.server || "—";
  els.infoDb.textContent = config.sqlServer?.database || "—";
  els.infoApi.textContent = config.api?.baseUrl || "—";
  const mins = config.sync?.autoSyncMinutes ?? 0;
  autoSyncMinutes = mins;
  els.infoAuto.innerHTML =
    mins > 0
      ? `<span class="badge badge-success">كل ${mins} د</span>`
      : `<span class="badge badge-muted">معطّل</span>`;
  if (mins > 0) {
    els.syncDesc.textContent = `يبحث ويرفع تلقائياً كل ${mins} دقائق — فقط المنتجات المتغيّرة`;
  }
  els.infoBatch.textContent = fmt(config.sync?.batchSize ?? 300);
  els.infoParallel.textContent = `${config.sync?.parallelUploads ?? 4}×`;
}

function updateStats(stats, count) {
  if (stats) {
    dbStats = stats;
    els.statTotal.textContent = fmt(stats.totalWithPrice ?? count);
    els.statArticles.textContent = fmt(stats.totalArticles);
    els.statOffers.textContent = fmt(stats.productsOnOffer);
    els.infoBarcode.textContent = fmt(stats.withBarcode);
    els.infoDbStatus.innerHTML = `<span class="badge badge-success">متصل</span>`;
  } else if (count != null) {
    els.statTotal.textContent = fmt(count);
    els.infoDbStatus.innerHTML = `<span class="badge badge-success">متصل</span>`;
  }
}

function updateLastSync(result) {
  if (!result) return;
  const now = new Date().toLocaleTimeString("ar-IQ");
  els.statLastSync.textContent = now;

  if (result.changed === 0) {
    els.statLastDetail.textContent = `كل ${fmt(result.total)} منتج محدّث`;
  } else {
    els.statLastDetail.textContent = `رُفع ${fmt(result.synced)} من ${fmt(result.changed)} متغيّر`;
  }
}

async function testDb(showToast = true) {
  $("btnTest").disabled = true;
  $("btnRefreshStats").disabled = true;
  try {
    await window.posSync.saveConfig(readForm());
    const { count, stats } = await window.posSync.testDb();
    updateStats(stats, count);
    const msg = stats
      ? `متصل — ${fmt(count)} منتج (عروض: ${fmt(stats.productsOnOffer)})`
      : `متصل — ${fmt(count)} منتج`;
    appendLog({ at: new Date().toISOString(), message: msg, level: "success" });
    if (showToast) toast("اتصال SQL ناجح", "success");
    return { count, stats };
  } catch (err) {
    els.infoDbStatus.innerHTML = `<span class="badge badge-muted" style="color:var(--error)">فشل</span>`;
    appendLog({
      at: new Date().toISOString(),
      message: `فشل الاتصال: ${err.message ?? err}`,
      level: "error",
    });
    if (showToast) toast("فشل اتصال SQL", "error");
    throw err;
  } finally {
    $("btnTest").disabled = false;
    $("btnRefreshStats").disabled = false;
  }
}

async function runSync() {
  setStatus(true);
  simulateProgress();
  try {
    await window.posSync.saveConfig(readForm());
    const result = await window.posSync.runSync();
    stopProgress(true);
    updateLastSync(result);

    if (result.ok) {
      if (result.changed === 0) {
        toast(`كل المنتجات محدّثة (${fmt(result.total)})`, "success");
      } else {
        toast(`رُفع ${fmt(result.synced)} منتج`, "success");
      }
    }
    return result;
  } catch (err) {
    stopProgress(false);
    toast("فشلت المزامنة", "error");
    throw err;
  } finally {
    setStatus(false);
  }
}

/* ── Tabs ── */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`panel-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "logs") els.logBadge.hidden = true;
  });
});

/* ── Actions ── */
$("btnSave").addEventListener("click", async () => {
  await window.posSync.saveConfig(readForm());
  updateInfoPanel(readForm());
  appendLog({ at: new Date().toISOString(), message: "تم حفظ الإعدادات", level: "success" });
  toast("تم حفظ الإعدادات", "success");
});

$("btnTest").addEventListener("click", () => testDb(true));
$("btnRefreshStats").addEventListener("click", () => testDb(true));
$("btnSync").addEventListener("click", () => runSync());

$("btnClearLog").addEventListener("click", () => {
  els.log.innerHTML = `<div class="log-empty">تم مسح السجل</div>`;
  logCount = 0;
  els.logBadge.hidden = true;
});

window.posSync.onLog(appendLog);

window.posSync.onStatus(({ running, manual, auto }) => {
  if (running) {
    const text = auto ? "رفع تلقائي جاري..." : "جاري المزامنة...";
    setStatus(true, text);
    simulateProgress(auto ? "جاري البحث والرفع التلقائي..." : "جاري قراءة SQL ورفع البيانات...");
    if (auto) {
      showLogsTab();
      toast("بدء الرفع التلقائي", "success");
    }
    updateAutoTimer({
      enabled: autoSyncMinutes > 0,
      minutes: autoSyncMinutes,
      secondsLeft: 0,
      syncing: true,
    });
  } else {
    setStatus(false);
    stopProgress(true);
  }
});

window.posSync.onComplete(({ auto, ...result }) => {
  updateLastSync(result);
  if (auto) {
    if (result.ok) {
      if (result.changed === 0) {
        toast(`الرفع التلقائي — كل المنتجات محدّثة (${fmt(result.total)})`, "success");
      } else {
        toast(`الرفع التلقائي — رُفع ${fmt(result.synced)} منتج`, "success");
      }
    } else {
      toast("فشل الرفع التلقائي", "error");
    }
  }
});

window.posSync.onTimer(updateAutoTimer);

window.posSync.getConfig().then(async ({ config, configPath }) => {
  fillForm(config);
  els.configPath.textContent = configPath ? `📁 ${configPath}` : "";
  appendLog({
    at: new Date().toISOString(),
    message: "مرحباً — Alhayaa POS Sync جاهز",
    level: "info",
  });

  try {
    await testDb(false);
  } catch {
    appendLog({
      at: new Date().toISOString(),
      message: "اضغط «اختبار SQL» للتحقق من الاتصال",
      level: "info",
    });
  }
});
