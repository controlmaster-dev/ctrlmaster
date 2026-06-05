export const DIARIOS_PRIORITY_VALUES = ["low", "medium", "high", "urgent"] as const;

export type DiariosPriority = (typeof DIARIOS_PRIORITY_VALUES)[number];

export const DIARIOS_PRIORITY_DEFAULT: DiariosPriority = "medium";

export const DIARIOS_PRIORITY_OPTIONS: {
  value: DiariosPriority;
  label: string;
  badgeClass: string;
  /** Clase en la tarjeta completa (borde + fondo) */
  cardClass: string;
}[] = [
  {
    value: "low",
    label: "Baja",
    badgeClass:
      "bg-[#e8edf2] text-[#5a6b7d] dark:bg-[#2a323c] dark:text-[#a8b4c4]",
    cardClass: "diarios-card--priority-low",
  },
  {
    value: "medium",
    label: "Media",
    badgeClass:
      "bg-[#d8f3e5] text-[#2f6b4f] dark:bg-[#1e3d32] dark:text-[#9fd4b8]",
    cardClass: "diarios-card--priority-medium",
  },
  {
    value: "high",
    label: "Alta",
    badgeClass:
      "bg-[#fff4d6] text-[#7a6528] dark:bg-[#3d3520] dark:text-[#f0d998]",
    cardClass: "diarios-card--priority-high",
  },
  {
    value: "urgent",
    label: "Urgente",
    badgeClass:
      "bg-[#ffe3e3] text-[#9b5050] dark:bg-[#3d2828] dark:text-[#f5b0b0]",
    cardClass: "diarios-card--priority-urgent",
  },
];

const PRIORITY_SET = new Set<string>(DIARIOS_PRIORITY_VALUES);

export function normalizeDiariosPriority(value: unknown): DiariosPriority {
  if (typeof value === "string" && PRIORITY_SET.has(value)) {
    return value as DiariosPriority;
  }
  return DIARIOS_PRIORITY_DEFAULT;
}

export function getDiariosPriorityMeta(priority: unknown) {
  const p = normalizeDiariosPriority(priority);
  return (
    DIARIOS_PRIORITY_OPTIONS.find((o) => o.value === p) ??
    DIARIOS_PRIORITY_OPTIONS[1]
  );
}
