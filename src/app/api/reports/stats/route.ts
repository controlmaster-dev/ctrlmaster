import { apiHandler } from "@/lib/api/handler";
import { getReportStats } from "@/server/services/reportService";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async () => getReportStats());
