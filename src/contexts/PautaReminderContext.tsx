"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getBitcentralUser, scheduleDateKey } from "@/lib/schedule";
import {
  getBitcentralWeekStart,
  prefetchBitcentralWeek,
} from "@/lib/bitcentralCache";
import {
  PautaReminderNotice,
  type PautaReminderInfo,
} from "@/components/PautaReminderNotice";

const SKIP_PATHS = ["/login"];

function shouldSkipPath(pathname: string) {
  return SKIP_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function PautaReminderProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [today, setToday] = useState(() => new Date());
  const [overrides, setOverrides] = useState<
    Array<{ date: string; user: { name: string } }>
  >([]);
  const [events, setEvents] = useState<
    Array<{
      id: string;
      name: string;
      isActive: boolean;
      startDate: string;
      endDate: string;
    }>
  >([]);
  const [baseSchedule, setBaseSchedule] = useState<
    Array<{ dayOfWeek: number; user?: { name: string } }>
  >([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [pautaReminder, setPautaReminder] = useState<PautaReminderInfo | null>(null);
  /** Solo en memoria: al recargar la página vuelve a mostrarse */
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    // Reuse the shared Bitcentral cache (same data the widget/prefetch use) to
    // avoid duplicate /api/schedule + /api/special-events + /api/schedule/config
    // requests. The reminder targets today/tomorrow, so cover current + next week.
    const currentWeek = getBitcentralWeekStart();
    const nextWeek = addDays(currentWeek, 7);

    try {
      const [current, next] = await Promise.all([
        prefetchBitcentralWeek(currentWeek),
        prefetchBitcentralWeek(nextWeek),
      ]);

      setOverrides([
        ...(current?.overrides ?? []),
        ...(next?.overrides ?? []),
      ]);
      setEvents(current?.events ?? next?.events ?? []);
      setBaseSchedule(current?.baseSchedule ?? []);
    } catch (error) {
      console.error("Pauta reminder fetch:", error);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || authLoading || shouldSkipPath(pathname)) {
      setPautaReminder(null);
      return;
    }

    setScheduleLoading(true);
    fetchSchedule();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      const now = new Date();
      setToday((prev) => (isSameDay(prev, now) ? prev : now));
      fetchSchedule();
    }, 5 * 60_000);

    return () => clearInterval(interval);
  }, [user, authLoading, pathname, fetchSchedule]);

  useEffect(() => {
    if (!user || authLoading || shouldSkipPath(pathname) || scheduleLoading) {
      return;
    }

    const baseScheduleMap = baseSchedule.reduce(
      (acc, curr) => {
        if (curr.user) acc[curr.dayOfWeek.toString()] = curr.user.name;
        return acc;
      },
      {} as Record<string, string>
    );

    const overrideMap = overrides.reduce(
      (acc, curr) => {
        const key = scheduleDateKey(curr.date);
        if (key && curr.user?.name) acc[key] = curr.user.name;
        return acc;
      },
      {} as Record<string, string>
    );

    const getDisplayInfo = (date: Date) => {
      const event = events.find((e) => {
        if (!e.isActive) return false;
        const start = new Date(e.startDate);
        const end = new Date(e.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        const check = new Date(date);
        check.setHours(12, 0, 0, 0);
        return check >= start && check <= end;
      });

      if (event) {
        return { name: event.name, isEvent: true as const };
      }

      const dateKey = scheduleDateKey(date);
      if (overrideMap[dateKey]) {
        return { name: overrideMap[dateKey], isEvent: false as const };
      }

      const legacy = getBitcentralUser(date, {}, baseScheduleMap);
      return { name: legacy.name, isEvent: false as const };
    };

    const now = new Date();
    let targetDate = new Date(now);
    if (now.getHours() >= 2) {
      targetDate = addDays(now, 1);
    }

    const info = getDisplayInfo(targetDate);

    if (info.isEvent) {
      setPautaReminder(null);
      return;
    }

    const dateLabel = format(targetDate, "EEEE", { locale: es });
    const formattedDateLabel =
      dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
    const dismissKey = `pauta-${format(targetDate, "yyyy-MM-dd")}-${info.name}`;

    setPautaReminder({
      operatorName: info.name,
      dateLabel: formattedDateLabel,
      dismissKey,
    });
  }, [
    user,
    authLoading,
    pathname,
    scheduleLoading,
    today,
    events,
    overrides,
    baseSchedule,
  ]);

  const showNotice =
    pautaReminder !== null && dismissedKey !== pautaReminder.dismissKey;

  return (
    <>
      {children}
      {showNotice && pautaReminder && (
        <PautaReminderNotice
          data={pautaReminder}
          onDismiss={() => setDismissedKey(pautaReminder.dismissKey)}
        />
      )}
    </>
  );
}
