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

const logEl = $("log");
const statusEl = $("status");

function appendLog(entry) {
  const line = document.createElement("div");
  line.className = `log-${entry.level}`;
  const time = new Date(entry.at).toLocaleTimeString("ar-IQ");
  line.textContent = `[${time}] ${entry.message}`;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
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
    api: {
      baseUrl: fields.apiBase.value.trim(),
    },
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
  fields.autoMinutes.value = String(config.sync?.autoSyncMinutes ?? 2);
  fields.batchSize.value = String(config.sync?.batchSize ?? 300);
  fields.parallelUploads.value = String(config.sync?.parallelUploads ?? 4);
}

$("btnSave").addEventListener("click", async () => {
  await window.posSync.saveConfig(readForm());
  appendLog({ at: new Date().toISOString(), message: "تم حفظ الإعدادات", level: "success" });
});

$("btnTest").addEventListener("click", async () => {
  $("btnTest").disabled = true;
  try {
    await window.posSync.saveConfig(readForm());
    const { count, stats } = await window.posSync.testDb();
    appendLog({
      at: new Date().toISOString(),
      message: stats
        ? `اتصال ناجح — ${count} منتج للمزامنة (إجمالي ${stats.totalArticles}، بسعر ${stats.totalWithPrice}، بباركود ${stats.withBarcode}، عروض ${stats.productsOnOffer})`
        : `اتصال ناجح — ${count} منتج للمزامنة`,
      level: "success",
    });
  } catch (err) {
    appendLog({
      at: new Date().toISOString(),
      message: `فشل الاتصال: ${err.message ?? err}`,
      level: "error",
    });
  } finally {
    $("btnTest").disabled = false;
  }
});

$("btnSync").addEventListener("click", async () => {
  $("btnSync").disabled = true;
  try {
    await window.posSync.saveConfig(readForm());
    const result = await window.posSync.runSync();
    if (result.ok) {
      appendLog({
        at: new Date().toISOString(),
        message: `تمت المزامنة: ${result.synced}/${result.total}`,
        level: "success",
      });
    }
  } finally {
    $("btnSync").disabled = false;
  }
});

window.posSync.onLog(appendLog);
window.posSync.onStatus(({ running }) => {
  statusEl.textContent = running ? "جاري المزامنة..." : "جاهز";
  statusEl.className = running ? "status running" : "status";
  $("btnSync").disabled = running;
});

window.posSync.getConfig().then(({ config, configPath }) => {
  fillForm(config);
  $("configPath").textContent = configPath ? `ملف الإعدادات: ${configPath}` : "";
});
