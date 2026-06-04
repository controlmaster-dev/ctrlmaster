import type { OperatorDuty } from "@/types/operatorDuty";

/** Reordena tarjetas dentro de una columna (mover ítem antes de `toIndex`). */
export function reorderDutiesInList(
  duties: OperatorDuty[],
  draggedId: string,
  toIndex: number
): OperatorDuty[] {
  const fromIndex = duties.findIndex((d) => d.id === draggedId);
  if (fromIndex < 0) return duties;

  const next = [...duties];
  const [item] = next.splice(fromIndex, 1);
  const insertAt = fromIndex < toIndex ? toIndex - 1 : toIndex;
  const clamped = Math.max(0, Math.min(insertAt, next.length));
  next.splice(clamped, 0, item);
  return next;
}
