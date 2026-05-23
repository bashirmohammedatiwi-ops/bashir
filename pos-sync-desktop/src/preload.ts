import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("posSync", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (config: unknown) => ipcRenderer.invoke("config:save", config),
  testDb: () => ipcRenderer.invoke("db:test"),
  runSync: () => ipcRenderer.invoke("sync:run"),
  setAutoSyncMinutes: (minutes: number) => ipcRenderer.invoke("sync:auto", minutes),
  onLog: (cb: (entry: { at: string; message: string; level: string }) => void) => {
    const handler = (_: unknown, entry: { at: string; message: string; level: string }) => cb(entry);
    ipcRenderer.on("sync:log", handler);
    return () => ipcRenderer.removeListener("sync:log", handler);
  },
  onStatus: (cb: (status: { running: boolean; manual?: boolean }) => void) => {
    const handler = (_: unknown, status: { running: boolean; manual?: boolean }) => cb(status);
    ipcRenderer.on("sync:status", handler);
    return () => ipcRenderer.removeListener("sync:status", handler);
  },
});
