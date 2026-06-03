import type { Operator } from "@/lib/types";
import { createClientCache, createClientCacheMap } from "@/lib/clientCache";

const TTL_MS = 5 * 60 * 1000;

const bundleStore = createClientCache<OperadoresBundle>(TTL_MS);
const weekStore = createClientCacheMap<OperadoresWeekSlice>(TTL_MS);

export interface OperadoresBundle {
  weekStart: string;
  operators: Operator[];
  allUsers: Operator[];
  specialEvents: unknown[];
  fetchedAt: number;
}

export interface OperadoresWeekSlice {
  weekStart: string;
  operators: Operator[];
  fetchedAt: number;
}

export function getOperadoresBundle(weekStart: string): OperadoresBundle | null {
  const data = bundleStore.get();
  if (!data || data.weekStart !== weekStart) return null;
  return data;
}

export function setOperadoresBundle(bundle: OperadoresBundle) {
  bundleStore.set(bundle);
}

export function getOperadoresWeekCache(weekStart: string): OperadoresWeekSlice | null {
  return weekStore.get(weekStart);
}

export function setOperadoresWeekCache(slice: OperadoresWeekSlice) {
  weekStore.set(slice.weekStart, slice);
}

export function invalidateOperadoresCache() {
  bundleStore.invalidate();
  weekStore.invalidate();
}
