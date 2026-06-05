import { getBitcentralUser, scheduleDateKey } from "@/lib/schedule";
import type {
  BitcentralBaseDay,
  BitcentralEvent,
  BitcentralOverride,
} from "@/lib/bitcentralCache";

export type BitcentralDisplayInfo = {
  name: string;
  isEvent?: boolean;
  eventId?: string;
  isOverride?: boolean;
  isRotation?: boolean;
};

export function buildBaseScheduleMap(baseSchedule: BitcentralBaseDay[]) {
  return baseSchedule.reduce((acc, curr) => {
    if (curr.user) {
      acc[curr.dayOfWeek.toString()] = curr.user.name;
    }
    return acc;
  }, {} as Record<string, string>);
}

export function buildOverrideMap(overrides: BitcentralOverride[]) {
  return overrides.reduce((acc, curr) => {
    const key = scheduleDateKey(curr.date);
    if (key && curr.user?.name) {
      acc[key] = curr.user.name;
    }
    return acc;
  }, {} as Record<string, string>);
}

export function getDisplayInfo(
  date: Date,
  events: BitcentralEvent[],
  overrideMap: Record<string, string>,
  baseScheduleMap: Record<string, string>
): BitcentralDisplayInfo {
  const event = events.find((item) => {
    if (!item.isActive) return false;
    const start = new Date(item.startDate);
    const end = new Date(item.endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const check = new Date(date);
    check.setHours(12, 0, 0, 0);
    return check >= start && check <= end;
  });

  if (event) {
    return { name: event.name, isEvent: true, eventId: event.id };
  }

  const dateKey = scheduleDateKey(date);
  if (overrideMap[dateKey]) {
    return { name: overrideMap[dateKey], isOverride: true, isRotation: false };
  }

  return getBitcentralUser(date, {}, baseScheduleMap);
}

export function getInitials(name: string) {
  return (name || "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

export function dayUserId(entry?: BitcentralBaseDay) {
  return entry?.userId || entry?.user?.id || "default";
}
