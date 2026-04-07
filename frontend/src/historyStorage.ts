import type { PredictResponse } from "./types";

const KEY = "bh-risk-history-v1";
const MAX_ENTRIES = 80;

export type HistoryEntry = {
  id: string;
  at: string;
  evidence: Record<string, string>;
  result: PredictResponse;
};

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is HistoryEntry =>
        x &&
        typeof x === "object" &&
        typeof (x as HistoryEntry).id === "string" &&
        typeof (x as HistoryEntry).at === "string"
    );
  } catch {
    return [];
  }
}

/**
 * React's `useSyncExternalStore` requires `getSnapshot()` to return the same
 * value (by reference) if nothing changed; otherwise it can re-render forever.
 * We keep a cached snapshot and update it only on storage / app events.
 */
let _cache: HistoryEntry[] = [];
let _cacheInit = false;

function _ensureCache(): void {
  if (_cacheInit) return;
  _cache = loadHistory();
  _cacheInit = true;
}

export function getHistorySnapshot(): HistoryEntry[] {
  _ensureCache();
  return _cache;
}

export function subscribeHistory(cb: () => void): () => void {
  _ensureCache();
  const handler = () => {
    _cache = loadHistory();
    cb();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("bh-history", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("bh-history", handler);
  };
}

function persist(entries: HistoryEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function notifyHistoryChanged(): void {
  window.dispatchEvent(new Event("bh-history"));
}

export function appendHistory(evidence: Record<string, string>, result: PredictResponse): void {
  const next: HistoryEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    evidence: { ...evidence },
    result: { ...result, heart_disease: { ...result.heart_disease } },
  };
  const updated = [next, ...loadHistory()];
  persist(updated);
  _cache = updated;
  notifyHistoryChanged();
}

export function deleteHistoryEntry(id: string): void {
  const updated = loadHistory().filter((e) => e.id !== id);
  persist(updated);
  _cache = updated;
  notifyHistoryChanged();
}

export function clearHistory(): void {
  localStorage.removeItem(KEY);
  _cache = [];
  notifyHistoryChanged();
}
