import { app, BrowserWindow, protocol, net, shell } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { pathToFileURL } from "url";

const isDev = !app.isPackaged;
const APP_SCHEME = "app";

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

app.setPath(
  "userData",
  path.join(os.homedir(), ".alhayaa-admin-electron"),
);

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

async function registerAppProtocol() {
  await protocol.handle(APP_SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const filePath = resolveStaticPath(pathname);
    return net.fetch(pathToFileURL(filePath).toString());
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

  win.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error("[load failed]", errorCode, errorDescription, validatedURL);
    },
  );

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Allow API calls to localhost from the packaged app.
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* http://127.0.0.1:*"],
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
