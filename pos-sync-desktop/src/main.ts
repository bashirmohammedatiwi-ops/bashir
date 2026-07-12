import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createApiClient, chunkItems, formatApiError, pushBatchesParallel, reportSyncRun, retryFailedItems } from "./apiClient";
import { rowToSyncItem, type SyncItem } from "./pricing";
import { fetchArticles, testConnection, type SqlServerConfig } from "./sqlServer";
import {
  countSyncState,
  dedupeSyncItems,
  filterChangedItems,
  loadSyncState,
  mergeSyncState,
  saveSyncState,
} from "./syncState";

type AppConfig = {
  sqlServer: SqlServerConfig;
  api: { baseUrl: string };
  sync: { autoSyncMinutes: number; batchSize: number; parallelUploads?: number };
};

let mainWindow: BrowserWindow | null = null;
let autoSyncTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;
let nextAutoSyncAt: number | null = null;
let config: AppConfig | null = null;
let syncing = false;

function configPath(): string {
  return path.join(app.getPath("userData"), "config.json");
}

function defaultConfig(): AppConfig {
  return {
    sqlServer: {
      server: "localhost\\FOTSQLSERVER",
      database: "HAYAT2025.mdf",
      user: "",
      password: "",
      options: { encrypt: false, trustServerCertificate: true },
    },
    api: {
      baseUrl: "http://187.127.88.146/api/v1",
    },
    sync: { autoSyncMinutes: 5, batchSize: 300, parallelUploads: 2 },
  };
}

function loadConfig(): AppConfig | null {
  const userPath = configPath();
  if (fs.existsSync(userPath)) {
    return JSON.parse(fs.readFileSync(userPath, "utf8")) as AppConfig;
  }

  const bundledExample = path.join(__dirname, "..", "config.example.json");
  if (fs.existsSync(bundledExample)) {
    const cfg = JSON.parse(fs.readFileSync(bundledExample, "utf8")) as AppConfig;
    saveConfig(cfg);
    return cfg;
  }

  const cfg = defaultConfig();
  saveConfig(cfg);
  return cfg;
}

function saveConfig(next: AppConfig) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), "utf8");
  config = next;
  restartAutoSync();
}

function log(message: string, level: "info" | "error" | "success" = "info") {
  const entry = { at: new Date().toISOString(), message, level };
  mainWindow?.webContents.send("sync:log", entry);
  console.log(`[${level}] ${message}`);
}

async function runSync(manual = false): Promise<{
  ok: boolean;
  synced: number;
  total: number;
  changed: number;
  skipped: number;
  failed: number;
}> {
  if (syncing) {
    log("المزامنة جارية بالفعل...", "info");
    return { ok: false, synced: 0, total: 0, changed: 0, skipped: 0, failed: 0 };
  }
  if (!config) {
    log("لم يتم إعداد ملف الإعدادات config.json", "error");
    return { ok: false, synced: 0, total: 0, changed: 0, skipped: 0, failed: 0 };
  }

  const syncStarted = Date.now();
  let errorMessage: string | undefined;

  syncing = true;
  mainWindow?.webContents.send("sync:status", { running: true, manual, auto: !manual });
  broadcastTimer();

  let result = { ok: false, synced: 0, total: 0, changed: 0, skipped: 0, failed: 0 };

  try {
    log(manual ? "بدء المزامنة اليدوية..." : "بدء المزامنة التلقائية...");
    const readStarted = Date.now();
    const rows = await fetchArticles(config.sqlServer);
    const items = rows.map(rowToSyncItem).filter((x): x is NonNullable<typeof x> => x != null);
    log(`قراءة SQL: ${items.length} منتج (${((Date.now() - readStarted) / 1000).toFixed(1)} ث)`);

    if (items.length === 0) {
      log("لا توجد منتجات بسعر في قاعدة البيانات", "error");
      result = { ok: false, synced: 0, total: 0, changed: 0, skipped: 0, failed: 0 };
      return result;
    }

    const uniqueItems = dedupeSyncItems(items);
    const previousState = loadSyncState(app.getPath("userData"));
    const knownCount = countSyncState(previousState);
    const toSend = manual ? uniqueItems : filterChangedItems(uniqueItems, previousState);
    const skipped = manual ? 0 : uniqueItems.length - toSend.length;

    if (toSend.length === 0) {
      log(
        manual
          ? `لا توجد منتجات بسعر في قاعدة البيانات`
          : `لا توجد تغييرات — ${uniqueItems.length} منتج محدّث (${knownCount} في الذاكرة المحلية)`,
        manual ? "error" : "success",
      );
      result = { ok: true, synced: 0, total: uniqueItems.length, changed: 0, skipped, failed: 0 };
      return result;
    }

    log(
      manual
        ? `مزامنة كاملة — رفع ${toSend.length} منتج من ${uniqueItems.length}`
        : `تحديث ${toSend.length} متغيّر — ${skipped} بدون تغيير من ${uniqueItems.length}`,
    );

    const client = createApiClient(config.api);
    const batchSize = Math.max(50, Math.min(config.sync.batchSize || 300, 1000));
    const parallelUploads = Math.max(1, Math.min(config.sync.parallelUploads || 2, 4));
    const batches = chunkItems(toSend, batchSize);
    const uploadStarted = Date.now();

    log(`رفع ${toSend.length} منتج — ${batches.length} دفعة × ${batchSize} (×${parallelUploads} متوازي)`);

    const { synced, failed, pushed, failedItems, lastError } = await pushBatchesParallel(
      client,
      batches,
      parallelUploads,
      (done, total) => {
        if (done === total || done % parallelUploads === 0) {
          log(`تقدّم الرفع: ${done}/${total} دفعة`);
        }
      },
    );

    let finalSynced = synced;
    let finalFailed = failed;
    let finalPushed = [...pushed];

    if (failedItems.length > 0) {
      log(`إعادة محاولة ${failedItems.length} منتج فاشل — دفعات صغيرة...`);
      const retry = await retryFailedItems(client, failedItems, 50);
      finalSynced += retry.synced;
      finalPushed.push(...retry.pushed);
      finalFailed = retry.failedItems.length;
      if (retry.lastError) {
        log(`آخر خطأ في إعادة المحاولة: ${retry.lastError}`, "error");
      }
    }

    if (lastError && failed > 0) {
      log(`سبب فشل بعض الدفعات: ${lastError}`, "error");
    }

    if (finalPushed.length > 0) {
      const nextState = mergeSyncState(previousState, finalPushed);
      saveSyncState(app.getPath("userData"), nextState);
      log(`حُفظت حالة ${finalPushed.length} منتج — الإجمالي في الذاكرة: ${countSyncState(nextState)}`);
    } else if (finalSynced > 0) {
      log("تحذير: تم الرفع لكن لم تُحفظ الحالة المحلية — ستُعاد المزامنة", "error");
    }

    if (finalFailed > 0) {
      log(
        `اكتملت جزئياً — رُفع ${finalSynced} | فشل ${finalFailed} | حُفظ ${finalPushed.length} | ${((Date.now() - uploadStarted) / 1000).toFixed(1)} ث`,
        "error",
      );
      result = {
        ok: finalSynced > 0,
        synced: finalSynced,
        total: uniqueItems.length,
        changed: toSend.length,
        skipped,
        failed: finalFailed,
      };
      return result;
    }

    log(
      `اكتملت — رُفع ${finalSynced} | حُفظ ${finalPushed.length} | ${((Date.now() - uploadStarted) / 1000).toFixed(1)} ث`,
      "success",
    );
    result = {
      ok: true,
      synced: finalSynced,
      total: uniqueItems.length,
      changed: toSend.length,
      skipped,
      failed: 0,
    };
    return result;
  } catch (err: any) {
    errorMessage = formatApiError(err);
    log(`فشلت المزامنة: ${errorMessage}`, "error");
    result = { ok: false, synced: 0, total: 0, changed: 0, skipped: 0, failed: 0 };
    return result;
  } finally {
    syncing = false;
    mainWindow?.webContents.send("sync:status", { running: false, manual, auto: !manual });
    mainWindow?.webContents.send("sync:complete", { manual, auto: !manual, ...result });
    scheduleNextAutoSync();
    if (config) {
      void reportSyncRun(createApiClient(config.api), {
        manual,
        ok: result.ok,
        totalItems: result.total,
        changedItems: result.changed,
        syncedItems: result.synced,
        failedItems: result.failed,
        skippedItems: result.skipped,
        durationMs: Date.now() - syncStarted,
        errorMessage,
        sourceHost: os.hostname(),
      });
    }
  }
}

function broadcastTimer() {
  const minutes = config?.sync?.autoSyncMinutes ?? 0;
  if (minutes <= 0 || !nextAutoSyncAt) {
    mainWindow?.webContents.send("sync:timer", { enabled: false, syncing });
    return;
  }

  const secondsLeft = Math.max(0, Math.ceil((nextAutoSyncAt - Date.now()) / 1000));
  mainWindow?.webContents.send("sync:timer", {
    enabled: true,
    minutes,
    secondsLeft,
    syncing,
  });
}

function scheduleNextAutoSync() {
  const minutes = config?.sync?.autoSyncMinutes ?? 0;
  if (minutes <= 0) {
    nextAutoSyncAt = null;
    broadcastTimer();
    return;
  }

  nextAutoSyncAt = Date.now() + minutes * 60_000;
  broadcastTimer();
}

function restartAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  autoSyncTimer = null;
  countdownTimer = null;

  const minutes = config?.sync?.autoSyncMinutes ?? 0;
  if (minutes <= 0) {
    nextAutoSyncAt = null;
    broadcastTimer();
    return;
  }

  scheduleNextAutoSync();
  autoSyncTimer = setInterval(() => {
    if (!syncing) void runSync(false);
  }, minutes * 60_000);
  countdownTimer = setInterval(broadcastTimer, 1000);
  log(`المزامنة التلقائية كل ${minutes} دقيقة — الرفع التالي خلال ${minutes}:00`);
}

function resolveRendererHtml(): string {
  if (app.isPackaged) {
    return path.join(__dirname, "..", "renderer", "index.html");
  }
  return path.join(__dirname, "..", "renderer", "index.html");
}

function resolvePreload(): string {
  return path.join(__dirname, "preload.js");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 740,
    minWidth: 820,
    minHeight: 620,
    title: "Alhayaa POS Sync",
    autoHideMenuBar: true,
    backgroundColor: "#080a0f",
    show: false,
    webPreferences: {
      preload: resolvePreload(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());
  void mainWindow.loadFile(resolveRendererHtml());
}

app.setPath(
  "userData",
  path.join(app.getPath("appData"), "alhayaa-pos-sync"),
);

app.whenReady().then(() => {
  config = loadConfig();
  createWindow();
  restartAutoSync();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("config:get", () => ({
  config,
  configPath: configPath(),
}));

ipcMain.handle("config:save", (_e, next: AppConfig) => {
  saveConfig(next);
  return { ok: true };
});

ipcMain.handle("db:test", async () => {
  if (!config) throw new Error("Config not loaded");
  const { count, stats } = await testConnection(config.sqlServer);
  return { count, stats };
});

ipcMain.handle("sync:run", async () => runSync(true));

ipcMain.handle("sync:auto", (_e, minutes: number) => {
  if (!config) throw new Error("Config not loaded");
  config.sync.autoSyncMinutes = minutes;
  saveConfig(config);
  return { ok: true };
});
