export const IMPORTED_QUEUE_KEY = "tva-review-imported-cves";
export const DISMISSED_QUEUE_KEY = "tva-review-dismissed-cves";

export function readStoredIds(key: string) {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeStoredIds(key: string, ids: string[]) {
  const unique = Array.from(new Set(ids));
  window.localStorage.setItem(key, JSON.stringify(unique));
  window.dispatchEvent(new Event("tva-queue-updated"));
  return unique;
}

export function readImportedIds() {
  return readStoredIds(IMPORTED_QUEUE_KEY);
}

export function writeImportedIds(ids: string[]) {
  return writeStoredIds(IMPORTED_QUEUE_KEY, ids);
}

export function readDismissedIds() {
  return readStoredIds(DISMISSED_QUEUE_KEY);
}

export function writeDismissedIds(ids: string[]) {
  return writeStoredIds(DISMISSED_QUEUE_KEY, ids);
}
