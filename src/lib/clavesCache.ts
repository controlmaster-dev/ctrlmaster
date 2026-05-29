const KEY = "cm_claves_v1";
const TTL_MS = 5 * 60 * 1000;

export interface ClavesCache {
  credentials: unknown[];
  fetchedAt: number;
}

export function getClavesCache(): ClavesCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ClavesCache;
    if (!data?.fetchedAt || Date.now() - data.fetchedAt > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setClavesCache(cache: ClavesCache) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cache));
  } catch {

  }
}

export function invalidateClavesCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
