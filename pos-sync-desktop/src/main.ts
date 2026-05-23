import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import * as path from "path";
import { createApiClient, pushBulk } from "./apiClient";
import { rowToSyncItem } from "./pricing";
import { fetchArticles, testConnection, type SqlServerConfig } from "./sqlServer";

type AppConfig = {
  sqlServer: SqlServerConfig;
  api: { baseUrl: string };
  sync: { autoSyncMinutes: number; batchSize: number };
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
    sync: { autoSyncMinutes: 5, batchSize: 100 },
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
    const rows = await fetchArticles(config.sqlServer);
    const items = rows.map(rowToSyncItem).filter((x): x is NonNullable<typeof x> => x != null);

    if (items.length === 0) {
      log("لا توجد منتجات بباركود في قاعدة البيانات", "error");
      return { ok: false, synced: 0, total: 0 };
    }

    const client = createApiClient(config.api);
    const batchSize = config.sync.batchSize || 100;
    let synced = 0;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const result = await pushBulk(client, batch);
      synced += result.synced ?? batch.length;
      log(`تم إرسال ${Math.min(i + batch.length, items.length)} / ${items.length} منتج`);
    }

    log(`اكتملت المزامنة — ${synced} منتج`, "success");
    return { ok: true, synced, total: items.length };
  } catch (err: any) {
    log(`فشلت المزامنة: ${err?.message ?? err}`, "error");
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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 640,
    minWidth: 560,
    minHeight: 480,
    title: "Alhayaa POS Sync",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

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
  const count = await testConnection(config.sqlServer);
  return { count };
});

ipcMain.handle("sync:run", async () => runSync(true));

ipcMain.handle("sync:auto", (_e, minutes: number) => {
  if (!config) throw new Error("Config not loaded");
  config.sync.autoSyncMinutes = minutes;
  saveConfig(config);
  return { ok: true };
});
