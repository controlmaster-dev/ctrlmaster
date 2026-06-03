import { createClientCache } from "@/lib/clientCache";
import type { Credential } from "@/components/claves/CredentialCard";

const TTL_MS = 5 * 60 * 1000;
const store = createClientCache<ClavesCache>(TTL_MS);

export interface ClavesCache {
  credentials: Credential[];
  fetchedAt: number;
}

export function getClavesCache(): ClavesCache | null {
  return store.get();
}

export function setClavesCache(cache: ClavesCache) {
  store.set(cache);
}

export function invalidateClavesCache() {
  store.invalidate();
}
