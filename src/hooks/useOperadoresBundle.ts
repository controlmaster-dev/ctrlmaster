"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Operator } from "@/lib/types";
import { sortOperatorsByShiftQueue } from "@/lib/operadorSchedule";
import { fetchOperadoresBundle } from "@/lib/fetchOperadoresBundle";
import {
  getOperadoresBundle,
  getOperadoresWeekCache,
  setOperadoresBundle,
  setOperadoresWeekCache,
  invalidateOperadoresCache,
} from "@/lib/operadoresCache";

export function sortOperators(data: Operator[]): Operator[] {
  return sortOperatorsByShiftQueue(data);
}

export function useOperadoresBundle(currentWeekStart: string) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [allUsers, setAllUsers] = useState<Operator[]>([]);
  const [specialEvents, setSpecialEvents] = useState<unknown[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const applyBundle = useCallback(
    (bundle: NonNullable<Awaited<ReturnType<typeof fetchOperadoresBundle>>>) => {
      setOperators(bundle.operators);
      setAllUsers(bundle.allUsers);
      setSpecialEvents(bundle.specialEvents);
      setOperadoresBundle(bundle);
      setOperadoresWeekCache({
        weekStart: bundle.weekStart,
        operators: bundle.operators,
        fetchedAt: bundle.fetchedAt,
      });
    },
    []
  );

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setIsReady(false);

      const bundle = await fetchOperadoresBundle(currentWeekStart);
      if (!mountedRef.current) return;

      if (bundle) {
        applyBundle(bundle);
      }

      setIsReady(true);
    },
    [currentWeekStart, applyBundle]
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
      const bundle = await fetchOperadoresBundle(weekStart);
      if (!bundle) {
        if (!silent) setIsReady(true);
        return;
      }
      setOperators(bundle.operators);
      setOperadoresWeekCache({
        weekStart,
        operators: bundle.operators,
        fetchedAt: bundle.fetchedAt,
      });
      setIsReady(true);
    },
    [weekStart]
  );

  useEffect(() => {
    const cached = getOperadoresWeekCache(weekStart);
    if (cached) {
      setOperators(sortOperators(cached.operators as Operator[]));
      setIsReady(true);
      void fetchWeek(true);
      return;
    }
    void fetchWeek(false);
  }, [weekStart, fetchWeek]);

  return { operators, isReady, refresh: () => fetchWeek(true) };
}
