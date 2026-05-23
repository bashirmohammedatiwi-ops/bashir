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
  onStatus: (cb: (status: { running: boolean; manual?: boolean; auto?: boolean }) => void) => {
    const handler = (_: unknown, status: { running: boolean; manual?: boolean; auto?: boolean }) =>
      cb(status);
    ipcRenderer.on("sync:status", handler);
    return () => ipcRenderer.removeListener("sync:status", handler);
  },
  onTimer: (
    cb: (timer: { enabled: boolean; minutes?: number; secondsLeft?: number; syncing?: boolean }) => void,
  ) => {
    const handler = (
      _: unknown,
      timer: { enabled: boolean; minutes?: number; secondsLeft?: number; syncing?: boolean },
    ) => cb(timer);
    ipcRenderer.on("sync:timer", handler);
    return () => ipcRenderer.removeListener("sync:timer", handler);
  },
  onComplete: (
    cb: (payload: {
      manual?: boolean;
      auto?: boolean;
      ok: boolean;
      synced: number;
      total: number;
      changed: number;
      skipped: number;
    }) => void,
  ) => {
    const handler = (
      _: unknown,
      payload: {
        manual?: boolean;
        auto?: boolean;
        ok: boolean;
        synced: number;
        total: number;
        changed: number;
        skipped: number;
      },
    ) => cb(payload);
    ipcRenderer.on("sync:complete", handler);
    return () => ipcRenderer.removeListener("sync:complete", handler);
  },
});
