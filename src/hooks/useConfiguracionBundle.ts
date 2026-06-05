"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getConfiguracionCache,
  setConfiguracionCache,
  invalidateConfiguracionCache,
  type SecurityCode,
} from "@/lib/configuracionCache";
import { fetchConfiguracionBundle } from "@/lib/fetchConfiguracionBundle";
import { invalidateOperadoresCache } from "@/lib/operadoresCache";

export function useConfiguracionBundle(weekStart: string, enabled: boolean) {
  const [users, setUsers] = useState<unknown[]>([]);
  const [securityCodes, setSecurityCodes] = useState<SecurityCode[]>([]);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const apply = useCallback(
    (bundle: { users: unknown[]; securityCodes: SecurityCode[] }) => {
      setUsers(bundle.users);
      setSecurityCodes(bundle.securityCodes);
    },
    []
  );

  const persist = useCallback(
    (bundle: { users: unknown[]; securityCodes: SecurityCode[] }) => {
      setConfiguracionCache({
        weekStart,
        users: bundle.users,
        securityCodes: bundle.securityCodes,
        fetchedAt: Date.now(),
      });
    },
    [weekStart]
  );

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!enabled) return;
      if (!silent) setIsReady(false);

      const bundle = await fetchConfiguracionBundle(weekStart);
      if (!mountedRef.current) return;

      if (bundle) {
        apply(bundle);
        persist(bundle);
      }

      setIsReady(true);
    },
    [weekStart, enabled, apply, persist]
  );

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled) {
      setIsReady(false);
      return;
    }

    const cached = getConfiguracionCache(weekStart);
    if (cached) {
      apply({
        users: cached.users,
        securityCodes: cached.securityCodes,
      });
      setIsReady(true);
      void fetchAll(true);
    } else {
      void fetchAll(false);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [weekStart, enabled, apply, fetchAll]);

  const refresh = useCallback(() => {
    invalidateConfiguracionCache();
    invalidateOperadoresCache();
    return fetchAll(true);
  }, [fetchAll]);

  return {
    users,
    securityCodes,
    isReady,
    refresh,
  };
}

export { invalidateConfiguracionCache };
