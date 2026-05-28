/** Caché en memoria para detalle de reportes (precarga instantánea al abrir modal) */

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown | null>>();

export function getReportDetailCache(id: string): unknown | null {
  const v = cache.get(id);
  return v && typeof v === 'object' && 'id' in (v as object) ? v : null;
}

export function setReportDetailCache(id: string, data: unknown) {
  if (data && typeof data === 'object' && 'id' in (data as object)) {
    cache.set(id, data);
  }
}

export function invalidateReportDetailCache(id: string) {
  cache.delete(id);
  inflight.delete(id);
}

export function prefetchReportDetail(id: string): Promise<unknown | null> {
  const hit = getReportDetailCache(id);
  if (hit) return Promise.resolve(hit);

  const pending = inflight.get(id);
  if (pending) return pending as Promise<unknown | null>;

  const promise = fetch(`/api/reports/${id}`, { cache: 'no-store' })
    .then(async (res) => {
      const data = await res.json();
      if (res.ok && data?.id) {
        setReportDetailCache(id, data);
        return data;
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      inflight.delete(id);
    });

  inflight.set(id, promise);
  return promise;
}

/**
 * Precarga unos pocos reportes (los más relevantes). El resto se precarga al
 * pasar el cursor (hover) sobre cada fila, evitando 10-20 requests por carga.
 */
const MAX_BULK_PREFETCH = 3;

export async function prefetchReportDetails(ids: string[]) {
  const todo = ids
    .filter((id) => !getReportDetailCache(id) && !inflight.has(id))
    .slice(0, MAX_BULK_PREFETCH);
  await Promise.all(todo.map((id) => prefetchReportDetail(id)));
}
