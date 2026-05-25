import { app, BrowserWindow, protocol, shell } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const isDev = !app.isPackaged;
const APP_SCHEME = "app";
const VPS_ORIGIN = "http://187.127.88.146";

type CachedAsset = {
  body: Buffer;
  contentType: string;
  immutable: boolean;
};

const staticCache = new Map<string, CachedAsset>();
const MAX_CACHE_ENTRIES = 400;

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

app.setPath("userData", path.join(os.homedir(), ".alhayaa-admin-electron"));

function getOutRoot(): string {
  return path.join(__dirname, "..", "out");
}

function resolveStaticPath(urlPathname: string): string {
  const root = getOutRoot();
  let sub = decodeURIComponent(urlPathname);
  if (sub === "/" || sub === "") sub = "/index.html";
  if (sub.endsWith("/")) sub += "index.html";

  const candidate = path.join(root, sub.replace(/^\//, "").replace(/\//g, path.sep));
  if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return candidate;
  }

  const withIndex = path.join(candidate, "index.html");
  if (fs.existsSync(withIndex)) return withIndex;

  return path.join(root, "index.html");
}

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};

function rememberAsset(filePath: string, body: Buffer, contentType: string, immutable: boolean) {
  if (staticCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = staticCache.keys().next().value;
    if (firstKey) staticCache.delete(firstKey);
  }
  staticCache.set(filePath, { body, contentType, immutable });
}

async function registerAppProtocol() {
  await protocol.handle(APP_SCHEME, async (request) => {
    const { pathname } = new URL(request.url);
    const filePath = resolveStaticPath(pathname);
    const cached = staticCache.get(filePath);
    if (cached) {
      return new Response(new Uint8Array(cached.body), {
        headers: {
          "Content-Type": cached.contentType,
          ...(cached.immutable
            ? { "Cache-Control": "public, max-age=31536000, immutable" }
            : {}),
        },
      });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const data = await fs.promises.readFile(filePath);
    const immutable = pathname.includes("/_next/static/");
    rememberAsset(filePath, data, contentType, immutable);

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        ...(immutable ? { "Cache-Control": "public, max-age=31536000, immutable" } : {}),
      },
    });
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f5f5f7",
    title: "Alhayaa Admin",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("[load failed]", errorCode, errorDescription, validatedURL);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ${VPS_ORIGIN}; connect-src 'self' ${VPS_ORIGIN} http: https: data: blob:; img-src 'self' data: blob: ${VPS_ORIGIN} http: https:; font-src 'self' data: blob:; style-src 'self' 'unsafe-inline';`,
        ],
      },
    });
  });

  if (isDev) {
    await win.loadURL("http://localhost:3001/dashboard/");
  } else {
    await win.loadURL(`${APP_SCHEME}://local/dashboard/`);
  }
}

app.whenReady().then(async () => {
  if (!isDev) await registerAppProtocol();
  await createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
