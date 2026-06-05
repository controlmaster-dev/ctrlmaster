import { invalidateConfiguracionCache } from "@/lib/configuracionCache";
import { invalidateDashboardCache } from "@/lib/dashboardCache";
import { invalidateReportDetailCache } from "@/lib/reportDetailCache";
import { invalidateReportesListCache } from "@/lib/reportesListCache";

/** Invalida caches de reportes en todas las vistas. */
export function invalidateAllReportCaches(reportId?: string) {
  invalidateConfiguracionCache();
  invalidateDashboardCache();
  invalidateReportesListCache();
  if (reportId) invalidateReportDetailCache(reportId);
}

/** Notifica a dashboard y reportes que deben recargar datos. */
export function notifyReportDataChanged(reportId?: string) {
  invalidateAllReportCaches(reportId);
  void import("@/hooks/useDashboardData").then(({ triggerRefetch }) => {
    triggerRefetch("dashboard");
    triggerRefetch("reports");
  });
}
