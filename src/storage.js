import { DEFAULT_SETTINGS, mergeSettings } from "./calculations.js";

export const STORAGE_KEY = "worktimeapp:v1";

export const initialState = {
  settings: DEFAULT_SETTINGS,
  entries: [],
  adjustments: [],
  activeView: "calendar",
  backup: {
    lastExportedAt: ""
  },
  cloud: {
    userId: "",
    lastSyncAt: "",
    remoteUpdatedAt: "",
    sessionToken: "",
    tokenExpiresAt: "",
    lastUsedAt: ""
  }
};

export function createId(prefix = "id") {
  if (globalThis.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredCloneSafe(initialState);
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      settings: mergeSettings(parsed.settings || {}),
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      adjustments: Array.isArray(parsed.adjustments) ? parsed.adjustments : [],
      backup: { ...initialState.backup, ...(parsed.backup || {}) },
      cloud: { ...initialState.cloud, ...(parsed.cloud || {}) }
    };
  } catch {
    return structuredCloneSafe(initialState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    settings: mergeSettings(state.settings || {}),
    entries: state.entries || [],
    adjustments: state.adjustments || [],
    activeView: state.activeView || "calendar",
    backup: { ...initialState.backup, ...(state.backup || {}) },
    cloud: {
      userId: String(state.cloud?.userId || ""),
      lastSyncAt: state.cloud?.lastSyncAt || "",
      remoteUpdatedAt: state.cloud?.remoteUpdatedAt || "",
      sessionToken: state.cloud?.sessionToken || "",
      tokenExpiresAt: state.cloud?.tokenExpiresAt || "",
      lastUsedAt: state.cloud?.lastUsedAt || ""
    }
  }));
}

export function structuredCloneSafe(value) {
  if (globalThis.structuredClone) return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function exportBackup(state) {
  if (state.backup) state.backup.lastExportedAt = new Date().toISOString();
  const blob = new Blob([JSON.stringify({
    exportedAt: new Date().toISOString(),
    app: "worktimeapp",
    version: 1,
    data: state
  }, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `工时备份_${dateStamp()}.json`);
}

export function importBackupText(text) {
  const parsed = JSON.parse(text);
  const data = parsed.data || parsed;
  return {
    ...initialState,
    ...data,
    settings: mergeSettings(data.settings || {}),
    cloud: { ...initialState.cloud, ...(data.cloud || {}) }
  };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function dateStamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${year}${month}${day}_${hour}${minute}`;
}
