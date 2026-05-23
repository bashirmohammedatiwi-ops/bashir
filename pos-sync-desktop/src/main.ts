import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { createApiClient, chunkItems, formatApiError, pushBatchesParallel } from "./apiClient";
import { rowToSyncItem, type SyncItem } from "./pricing";
import { fetchArticles, testConnection, type SqlServerConfig } from "./sqlServer";
import {
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
    sync: { autoSyncMinutes: 2, batchSize: 300, parallelUploads: 4 },
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

async function runSync(manual = false): Promise<{ ok: boolean; synced: number; total: number }> {
  if (syncing) {
    log("المزامنة جارية بالفعل...", "info");
    return { ok: false, synced: 0, total: 0 };
  }
  if (!config) {
    log("لم يتم إعداد ملف الإعدادات config.json", "error");
    return { ok: false, synced: 0, total: 0 };
  }

  syncing = true;
  mainWindow?.webContents.send("sync:status", { running: true, manual });

  try {
    log(manual ? "بدء المزامنة اليدوية..." : "بدء المزامنة التلقائية...");
    const readStarted = Date.now();
    const rows = await fetchArticles(config.sqlServer);
    const items = rows.map(rowToSyncItem).filter((x): x is NonNullable<typeof x> => x != null);
    log(`قراءة SQL: ${items.length} منتج (${((Date.now() - readStarted) / 1000).toFixed(1)} ث)`);

    if (items.length === 0) {
      log("لا توجد منتجات بسعر في قاعدة البيانات", "error");
      return { ok: false, synced: 0, total: 0 };
    }

    const previousState = loadSyncState(app.getPath("userData"));
    const toSend = filterChangedItems(items, previousState);

    if (toSend.length === 0) {
      log("لا توجد تغييرات جديدة — البيانات محدّثة على السيرفر", "success");
      return { ok: true, synced: 0, total: items.length };
    }

    log(
      manual
        ? `مزامنة ${toSend.length} منتج من ${items.length}`
        : `تحديث ${toSend.length} منتج متغيّر من ${items.length}`,
    );

    const client = createApiClient(config.api);
    const batchSize = Math.max(50, Math.min(config.sync.batchSize || 300, 1000));
    const parallelUploads = Math.max(1, Math.min(config.sync.parallelUploads || 4, 8));
    const batches = chunkItems(toSend, batchSize);
    const uploadStarted = Date.now();

    log(`رفع ${toSend.length} منتج — ${batches.length} دفعة × ${batchSize} (×${parallelUploads} متوازي)`);

    const { synced, failed, pushed } = await pushBatchesParallel(
      client,
      batches,
      parallelUploads,
      (done, total) => {
        if (done === total || done % parallelUploads === 0) {
          log(`تقدّم الرفع: ${done}/${total} دفعة`);
        }
      },
    );

    if (pushed.length > 0) {
      saveSyncState(app.getPath("userData"), mergeSyncState(previousState, pushed));
    }

    if (failed > 0) {
      log(
        `اكتملت المزامنة جزئياً — ناجح: ${synced} | فاشل: ${failed} | ${((Date.now() - uploadStarted) / 1000).toFixed(1)} ث`,
        "error",
      );
      return { ok: synced > 0, synced, total: items.length };
    }

    log(
      `اكتملت المزامنة — ${synced} منتج في ${((Date.now() - uploadStarted) / 1000).toFixed(1)} ث`,
      "success",
    );
    return { ok: true, synced, total: items.length };
  } catch (err: any) {
    log(`فشلت المزامنة: ${formatApiError(err)}`, "error");
    return { ok: false, synced: 0, total: 0 };
  } finally {
    syncing = false;
    mainWindow?.webContents.send("sync:status", { running: false, manual });
  }
}

function restartAutoSync() {
  if (autoSyncTimer) clearInterval(autoSyncTimer);
  autoSyncTimer = null;

  const minutes = config?.sync?.autoSyncMinutes ?? 0;
  if (minutes > 0) {
    autoSyncTimer = setInterval(() => void runSync(false), minutes * 60_000);
    log(`المزامنة التلقائية كل ${minutes} دقيقة`);
  }
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
    width: 720,
    height: 640,
    minWidth: 560,
    minHeight: 480,
    title: "Alhayaa POS Sync",
    autoHideMenuBar: true,
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
