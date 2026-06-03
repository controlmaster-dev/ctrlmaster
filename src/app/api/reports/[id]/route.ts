import { apiHandler } from "@/lib/api/handler";
import { NotFoundError } from "@/lib/errors";
import { getReportDetail } from "@/server/services/reportService";

export const dynamic = "force-dynamic";

export const GET = apiHandler({ auth: true }, async ({ route }) => {
  const rawId = route.params?.id;
  const id = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : undefined;
  if (!id) throw new NotFoundError("Report not found");

  return getReportDetail(id);
});
