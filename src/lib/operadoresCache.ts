const BUNDLE_KEY = "cm_operadores_bundle_v1";
const WEEK_KEY = "cm_operadores_week_v1";
const TTL_MS = 5 * 60 * 1000;

export interface OperadoresBundle {
  weekStart: string;
  operators: unknown[];
  allUsers: unknown[];
  specialEvents: unknown[];
  fetchedAt: number;
}

export interface OperadoresWeekSlice {
  weekStart: string;
  operators: unknown[];
  fetchedAt: number;
}

export function getOperadoresBundle(weekStart: string): OperadoresBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BUNDLE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as OperadoresBundle;
    if (
      !data?.fetchedAt ||
      data.weekStart !== weekStart ||
      Date.now() - data.fetchedAt > TTL_MS
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setOperadoresBundle(bundle: OperadoresBundle) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(BUNDLE_KEY, JSON.stringify(bundle));
  } catch {

  }
}

export function getOperadoresWeekCache(weekStart: string): OperadoresWeekSlice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WEEK_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, OperadoresWeekSlice>;
    const slice = map[weekStart];
    if (!slice?.fetchedAt || Date.now() - slice.fetchedAt > TTL_MS) return null;
    return slice;
  } catch {
    return null;
  }
}

export function setOperadoresWeekCache(slice: OperadoresWeekSlice) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(WEEK_KEY);
    const map: Record<string, OperadoresWeekSlice> = raw ? JSON.parse(raw) : {};
    map[slice.weekStart] = slice;
    sessionStorage.setItem(WEEK_KEY, JSON.stringify(map));
  } catch {

  }
}

export function invalidateOperadoresCache() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(BUNDLE_KEY);
  sessionStorage.removeItem(WEEK_KEY);
}
