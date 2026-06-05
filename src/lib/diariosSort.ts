import type { DiariosPriority } from "@/lib/diariosPriority";

/** Menor número = más arriba en la columna */
export const DIARIOS_PRIORITY_RANK: Record<DiariosPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function compareDutyPriority(a: DiariosPriority, b: DiariosPriority): number {
  return DIARIOS_PRIORITY_RANK[a] - DIARIOS_PRIORITY_RANK[b];
}

export function sortDutyIdsByPriority<T extends { id: string; priority: DiariosPriority }>(
  duties: T[],
  orderMap?: Map<string, number>
): string[] {
  return [...duties]
    .sort((a, b) => {
      const byPriority = compareDutyPriority(a.priority, b.priority);
      if (byPriority !== 0) return byPriority;
      const ao = orderMap?.get(a.id) ?? 0;
      const bo = orderMap?.get(b.id) ?? 0;
      if (ao !== bo) return ao - bo;
      return a.id.localeCompare(b.id);
    })
    .map((d) => d.id);
}
