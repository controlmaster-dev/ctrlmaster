"use client";

import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 30_000;

/** Fuerza re-render periódico del estado de turnos (progreso, cola, día). */
export function useScheduleClock(intervalMs = DEFAULT_INTERVAL_MS): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);

    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      bump();
    }, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === "visible") bump();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);

  return tick;
}
