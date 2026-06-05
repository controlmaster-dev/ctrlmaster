"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Credential } from "@/components/claves/CredentialCard";
import {
  getClavesCache,
  setClavesCache,
  invalidateClavesCache,
} from "@/lib/clavesCache";

export function useClavesBundle(enabled: boolean) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setIsReady(false);

      try {
        const res = await fetch("/api/credentials");
        if (!res.ok) throw new Error("Failed to fetch credentials");
        const data = await res.json();
        if (!mountedRef.current) return;

        const list: Credential[] = Array.isArray(data) ? data : [];
        setCredentials(list);
        setClavesCache({ credentials: list, fetchedAt: Date.now() });
        setIsReady(true);
      } catch (e) {
        console.error("Claves fetch error", e);
        if (!mountedRef.current) return;
        if (!silent) setIsReady(true);
      }
    },
    [enabled]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const cached = getClavesCache();
    if (cached) {
      setCredentials(cached.credentials);
      setIsReady(true);
      void fetchAll(true);
    } else {
      void fetchAll(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [enabled, fetchAll]);

  const refresh = useCallback(() => {
    invalidateClavesCache();
    return fetchAll(true);
  }, [fetchAll]);

  return { credentials, isReady, refresh };
}

export { invalidateClavesCache };
