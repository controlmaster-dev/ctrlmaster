"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Operator } from "@/lib/types";
import {
  getOperadoresBundle,
  setOperadoresBundle,
  getOperadoresWeekCache,
  setOperadoresWeekCache,
  invalidateOperadoresCache,
} from "@/lib/operadoresCache";

export function sortOperators(data: Operator[]): Operator[] {
  return [...data].sort((a, b) => {
    const isAvail = (op: Operator) =>
      !!op.shifts?.some((s) => {
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        const end = s.end === 0 ? 24 : s.end;
        return s.days.includes(currentDay) && currentHour >= s.start && currentHour < end;
      });
    const aAvail = isAvail(a);
    const bAvail = isAvail(b);
    if (aAvail && !bAvail) return -1;
    if (!aAvail && bAvail) return 1;
    return 0;
  });
}

export function useOperadoresBundle(currentWeekStart: string) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [allUsers, setAllUsers] = useState<Operator[]>([]);
  const [specialEvents, setSpecialEvents] = useState<unknown[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setIsReady(false);

      try {
        const [weekRes, allRes, eventsRes] = await Promise.all([
          fetch(`/api/users?weekStart=${currentWeekStart}`, { cache: "no-store" }),
          fetch("/api/users"),
          fetch("/api/special-events"),
        ]);

        const weekData = weekRes.ok ? await weekRes.json() : [];
        const allData = allRes.ok ? await allRes.json() : [];
        const eventsData = eventsRes.ok ? await eventsRes.json() : [];

        if (!mountedRef.current) return;

        const ops = sortOperators(Array.isArray(weekData) ? weekData : []);
        const all = Array.isArray(allData) ? allData : [];
        const events = Array.isArray(eventsData) ? eventsData : [];

        setOperators(ops);
        setAllUsers(all);
        setSpecialEvents(events);

        const bundle = {
          weekStart: currentWeekStart,
          operators: ops,
          allUsers: all,
          specialEvents: events,
          fetchedAt: Date.now(),
        };
        setOperadoresBundle(bundle);
        setOperadoresWeekCache({
          weekStart: currentWeekStart,
          operators: ops,
          fetchedAt: Date.now(),
        });
        setIsReady(true);
      } catch (e) {
        console.error("Operadores fetch error", e);
        if (!mountedRef.current) return;
        if (!silent) setIsReady(true);
      }
    },
    [currentWeekStart]
  );

  useEffect(() => {
    mountedRef.current = true;
    const cached = getOperadoresBundle(currentWeekStart);
    if (cached) {
      setOperators(sortOperators(cached.operators as Operator[]));
      setAllUsers(cached.allUsers as Operator[]);
      setSpecialEvents(cached.specialEvents);
      setIsReady(true);
      void fetchAll(true);
    } else {
      void fetchAll(false);
    }

    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      void fetchAll(true);
    }, 60000);
    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [currentWeekStart, fetchAll]);

  const refresh = useCallback(() => {
    invalidateOperadoresCache();
    return fetchAll(true);
  }, [fetchAll]);

  return { operators, allUsers, specialEvents, isReady, refresh, setOperators };
}

export function useOperadoresWeek(weekStart: string) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isReady, setIsReady] = useState(false);

  const fetchWeek = useCallback(
    async (silent = false) => {
      if (!silent) setIsReady(false);
      try {
        const res = await fetch(`/api/users?weekStart=${weekStart}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("week fetch failed");
        const data = await res.json();
        const ops = sortOperators(Array.isArray(data) ? data : []);
        setOperators(ops);
        setOperadoresWeekCache({
          weekStart,
          operators: ops,
          fetchedAt: Date.now(),
        });
        setIsReady(true);
      } catch (e) {
        console.error(e);
        setIsReady(true);
      }
    },
    [weekStart]
  );

  useEffect(() => {
    const cached = getOperadoresWeekCache(weekStart);
    if (cached) {
      setOperators(sortOperators(cached.operators as Operator[]));
      setIsReady(true);
      void fetchWeek(true);
    } else {
      void fetchWeek(false);
    }
  }, [weekStart, fetchWeek]);

  return { operators, isReady };
}

export { invalidateOperadoresCache };
