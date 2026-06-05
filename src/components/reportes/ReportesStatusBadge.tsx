import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  resolved: "Resuelto",
  pending: "Pendiente",
  "in-progress": "En progreso",
};

export function ReportesStatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const dotClass =
    status === "resolved"
      ? "bg-emerald-500"
      : status === "pending"
        ? "bg-amber-500"
        : status === "in-progress"
          ? "bg-sky-500"
          : "bg-muted-foreground/50";

  return (
    <span className="inline-flex items-center gap-2 text-xs text-foreground/90">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotClass)} aria-hidden />
      {label}
    </span>
  );
}
