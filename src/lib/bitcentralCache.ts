/** Caché de sesión para la Pauta Bitcentral (por semana, inicio lunes) */

import { addDays, format, startOfWeek } from "date-fns";
import { scheduleDateKey } from "@/lib/schedule";

const KEY = "cm_bitcentral_v1";
const TTL_MS = 5 * 60 * 1000;

export type BitcentralOverride = { date: string; user: { name: string } };
export type BitcentralEvent = {
  id: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
};
export type BitcentralBaseDay = {
  dayOfWeek: number;
  user?: { name: string; id: string };
  userId: string;
};

export interface BitcentralBundle {
  weekKey: string;
  overrides: BitcentralOverride[];
  events: BitcentralEvent[];
  baseSchedule: BitcentralBaseDay[];
  fetchedAt: number;
}

export function getBitcentralWeekStart(date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function weekKeyFromDate(weekStart: Date) {
  return weekStart.toISOString();
}

export function getBitcentralCache(weekStart: Date): BitcentralBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, BitcentralBundle>;
    const key = weekKeyFromDate(weekStart);
    const data = map[key];
    if (!data?.fetchedAt || Date.now() - data.fetchedAt > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function setBitcentralCache(bundle: BitcentralBundle) {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(KEY);
    const map: Record<string, BitcentralBundle> = raw ? JSON.parse(raw) : {};
    map[bundle.weekKey] = bundle;
    sessionStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function invalidateBitcentralCache(weekStart?: Date) {
  if (typeof window === "undefined") return;
  if (!weekStart) {
    sessionStorage.removeItem(KEY);
    return;
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const map = JSON.parse(raw) as Record<string, BitcentralBundle>;
    delete map[weekKeyFromDate(weekStart)];
    sessionStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/** Descarga y guarda en caché la pauta de una semana */
export async function prefetchBitcentralWeek(
  weekStart: Date,
  options?: { force?: boolean }
): Promise<BitcentralBundle | null> {
  if (!weekStart || isNaN(weekStart.getTime())) return null;

  const weekKey = weekKeyFromDate(weekStart);
  if (!options?.force) {
    const cached = getBitcentralCache(weekStart);
    if (cached) return cached;
  }

  const weekEnd = addDays(weekStart, 6);
  const startParam = format(weekStart, "yyyy-MM-dd");
  const endParam = format(weekEnd, "yyyy-MM-dd");

  try {
    const [overridesRes, eventsRes, configRes] = await Promise.all([
      fetch(`/api/schedule?start=${startParam}&end=${endParam}`),
      fetch("/api/special-events"),
      fetch("/api/schedule/config"),
    ]);

    const rawOverrides = overridesRes.ok ? await overridesRes.json() : [];
    const overrides = Array.isArray(rawOverrides)
      ? rawOverrides.map(
          (row: { date: string; user?: { name: string } }) => ({
            date: scheduleDateKey(row.date),
            user: { name: row.user?.name ?? "" },
          })
        )
      : [];
    const events = eventsRes.ok ? await eventsRes.json() : [];
    const rawConfig = configRes.ok ? await configRes.json() : [];
    const baseSchedule = Array.isArray(rawConfig)
      ? rawConfig.map((row: BitcentralBaseDay & { user?: { id: string; name: string } }) => ({
          dayOfWeek: row.dayOfWeek,
          userId: row.userId || row.user?.id || "",
          user: row.user,
        }))
      : [];

    const bundle: BitcentralBundle = {
      weekKey,
      overrides,
      events: Array.isArray(events) ? events : [],
      baseSchedule: Array.isArray(baseSchedule) ? baseSchedule : [],
      fetchedAt: Date.now(),
    };

    setBitcentralCache(bundle);
    return bundle;
  } catch {
    return null;
  }
}

/** Precarga semana actual y adyacentes (navegación más fluida) */
export async function prefetchBitcentralNearby(anchor = new Date()) {
  const current = getBitcentralWeekStart(anchor);
  await prefetchBitcentralWeek(current);
  void prefetchBitcentralWeek(addDays(current, -7));
  void prefetchBitcentralWeek(addDays(current, 7));
}
