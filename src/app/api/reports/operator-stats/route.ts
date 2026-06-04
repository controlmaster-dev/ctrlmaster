import { apiHandler } from "@/lib/api/handler";
import { getOperatorReportStats } from "@/server/services/reportService";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => {
  const operators = await getOperatorReportStats();
  return { operators };
});
