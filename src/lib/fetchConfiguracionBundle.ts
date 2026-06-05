import type { ConfiguracionBundle } from "@/lib/configuracionCache";
import { setConfiguracionCache } from "@/lib/configuracionCache";
import { setOperadoresBundle, setOperadoresWeekCache } from "@/lib/operadoresCache";
import { fetchOperadoresBundle } from "@/lib/fetchOperadoresBundle";

export async function fetchConfiguracionBundle(
  weekStart: string
): Promise<ConfiguracionBundle | null> {
  try {
    const res = await fetch(
      `/api/configuracion/bootstrap?weekStart=${encodeURIComponent(weekStart)}`,
      { credentials: "include", cache: "no-store" }
    );
    if (!res.ok) return null;

    const data = (await res.json()) as ConfiguracionBundle;

    return {
      weekStart,
      users: Array.isArray(data.users) ? data.users : [],
      securityCodes: Array.isArray(data.securityCodes) ? data.securityCodes : [],
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/** Precarga operadores + panel de configuración (admin). */
export async function prefetchConfiguracionAdmin(weekStart: string): Promise<void> {
  const [operadores, configuracion] = await Promise.all([
    fetchOperadoresBundle(weekStart),
    fetchConfiguracionBundle(weekStart),
  ]);

  if (operadores) {
    setOperadoresBundle(operadores);
    setOperadoresWeekCache({
      weekStart: operadores.weekStart,
      operators: operadores.operators,
      fetchedAt: operadores.fetchedAt,
    });
  }

  if (configuracion) {
    setConfiguracionCache(configuracion);
  }
}
