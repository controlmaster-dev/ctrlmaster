import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { withDbRetry } from "@/lib/dbRetry";
import { fetchRecentComments, reportListPipeline } from "@/lib/reportAggregations";
import { ReportModel } from "@/models";
import { getReportStats } from "@/server/services/reportService";
import { listUsers } from "@/server/repositories/userRepository";
import type { UserRole } from "@/server/repositories/userRepository";

export const dynamic = "force-dynamic";

interface BootstrapReportRow {
  commentCount: number;
  reactionCount: number;
  [key: string]: unknown;
}

export const GET = apiHandler({ auth: true }, async () => {
  await connectMongo();
  const [reportsRaw, recentComments, stats, usersRaw] = await withDbRetry(() =>
    Promise.all([
      ReportModel.aggregate(reportListPipeline({ limit: 50 })),
      fetchRecentComments(10),
      getReportStats(),
      listUsers(),
    ])
  );

  const users = usersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    username: u.username ?? "",
    role: u.role as UserRole,
    image: u.image ?? undefined,
    avatar: u.image ?? undefined,
    birthday: u.birthday ?? undefined,
    phone: u.phone,
  }));

  const reports = (reportsRaw as unknown as BootstrapReportRow[]).map((r) => ({
    ...r,
    _count: { comments: r.commentCount, reactions: r.reactionCount },
  }));

  return NextResponse.json(
    { reports, recentComments, stats, users },
    { headers: { "Cache-Control": "private, max-age=15" } }
  );
});
