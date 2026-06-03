const DEFAULT_TTL_MS = 5 * 60 * 1000;

export type WithFetchedAt = { fetchedAt: number };

export function createClientCache<T extends WithFetchedAt>(ttlMs = DEFAULT_TTL_MS) {
  let entry: T | null = null;

  return {
    get(): T | null {
      if (!entry || Date.now() - entry.fetchedAt > ttlMs) {
        entry = null;
        return null;
      }
      return entry;
    },
    set(data: T) {
      entry = { ...data, fetchedAt: data.fetchedAt ?? Date.now() };
    },
    invalidate() {
      entry = null;
    },
  };
}

export function createClientCacheMap<T extends WithFetchedAt>(ttlMs = DEFAULT_TTL_MS) {
  const map = new Map<string, T>();

  return {
    get(key: string): T | null {
      const entry = map.get(key);
      if (!entry || Date.now() - entry.fetchedAt > ttlMs) {
        map.delete(key);
        return null;
      }
      return entry;
    },
    set(key: string, data: T) {
      map.set(key, { ...data, fetchedAt: data.fetchedAt ?? Date.now() });
    },
    invalidate(key?: string) {
      if (key) map.delete(key);
      else map.clear();
    },
  };
}
