/**
 * Execution history persistence using localStorage.
 * Tracks tool runs with tool ID, name, timestamp, status, and a summary.
 */

export interface HistoryEntry {
  id: string;
  toolId: string;
  toolName: string;
  timestamp: string;
  status: "success" | "error";
  summary: string;
}

const STORAGE_KEY = "leverage_execution_history";
const MAX_ENTRIES = 100;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export function addToHistory(entry: HistoryEntry): void {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    history.unshift(entry);
    // Keep only the latest MAX_ENTRIES
    if (history.length > MAX_ENTRIES) {
      history.length = MAX_ENTRIES;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage might be full or unavailable
    console.warn("Failed to save execution history");
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}