import { z } from "zod";
import { NextResponse } from "next/server";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { withDbRetry } from "@/lib/dbRetry";
import { fetchRecentComments, reportListPipeline } from "@/lib/reportAggregations";
import { CACHE_HEADERS } from "@/lib/httpCache";
import { ReportModel } from "@/models";
import { getReportStats } from "@/server/services/reportService";
import { listUsers } from "@/server/repositories/userRepository";
import type { UserRole } from "@/server/repositories/userRepository";

export const dynamic = "force-dynamic";

const bootstrapQuerySchema = z.object({
  reportsLimit: z.coerce.number().int().min(1).max(50).optional().default(25),
  commentsLimit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

interface BootstrapReportRow {
  commentCount: number;
  reactionCount: number;
  [key: string]: unknown;
}

export const GET = apiHandler(
  { auth: true, querySchema: bootstrapQuerySchema },
  async ({ query }) => {
  await connectMongo();
  const [reportsRaw, recentComments, stats, usersRaw] = await withDbRetry(() =>
    Promise.all([
      ReportModel.aggregate(reportListPipeline({ limit: query.reportsLimit })),
      fetchRecentComments(query.commentsLimit),
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
    { headers: CACHE_HEADERS.privateShort(15) }
  );
});
