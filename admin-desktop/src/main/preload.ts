import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("alhayaa", {
  version: "1.0.0",
  platform: process.platform,
});
