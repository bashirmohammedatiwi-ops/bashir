export {};

declare global {
  interface Window {
    posSync: {
      getConfig: () => Promise<{ config: unknown; configPath: string }>;
      saveConfig: (config: unknown) => Promise<{ ok: boolean }>;
      testDb: () => Promise<{ count: number }>;
      runSync: () => Promise<{ ok: boolean; synced: number; total: number }>;
      setAutoSyncMinutes: (minutes: number) => Promise<{ ok: boolean }>;
      onLog: (cb: (entry: { at: string; message: string; level: string }) => void) => () => void;
      onStatus: (cb: (status: { running: boolean; manual?: boolean }) => void) => () => void;
    };
  }
}
