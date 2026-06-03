import { CheckCircle2, Clock } from "lucide-react";

export function ReportesStatusBadge({ status }: { status: string }) {
  const base =
    "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide";
  switch (status) {
    case "resolved":
      return (
        <span className={`${base} border-border/60 bg-muted/30 text-foreground`}>
          <CheckCircle2 className="h-3 w-3" /> Resuelto
        </span>
      );
    case "pending":
      return (
        <span className={`${base} border-border/60 bg-muted/40 text-muted-foreground`}>
          <Clock className="h-3 w-3" /> Pendiente
        </span>
      );
    default:
      return (
        <span className={`${base} border-border text-muted-foreground`}>Desconocido</span>
      );
  }
}
