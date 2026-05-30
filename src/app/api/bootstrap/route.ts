import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

interface BootstrapReportRow {
  commentCount: number;
  reactionCount: number;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const [reportsRaw, recentComments, statsRows] = await Promise.all([
      sql`
        SELECT
          r."id", r."operatorName", r."operatorEmail", r."problemDescription",
          r."category", r."priority", r."status", r."createdAt",
          r."dateStarted", r."dateResolved", r."emailStatus", r."emailRecipients",
          COALESCE(cc."commentCount", 0)::int AS "commentCount",
          COALESCE(rc."reactionCount", 0)::int AS "reactionCount"
        FROM "Report" r
        LEFT JOIN (
          SELECT "reportId", COUNT(*) AS "commentCount" FROM "Comment" GROUP BY "reportId"
        ) cc ON cc."reportId" = r."id"
        LEFT JOIN (
          SELECT "reportId", COUNT(*) AS "reactionCount" FROM "Reaction" GROUP BY "reportId"
        ) rc ON rc."reportId" = r."id"
        ORDER BY r."createdAt" DESC
        LIMIT 50
      `,
      sql`
        SELECT c."id", c."content", c."authorId", c."reportId", c."parentId", c."createdAt",
               json_build_object('name', a."name", 'image', a."image") AS "author",
               json_build_object('id', r."id", 'problemDescription', r."problemDescription") AS "report"
        FROM "Comment" c
        JOIN "User" a ON a."id" = c."authorId"
        JOIN "Report" r ON r."id" = c."reportId"
        ORDER BY c."createdAt" DESC
        LIMIT 10
      `,
      sql`
        SELECT
          COUNT(*)::int AS "total",
          COUNT(*) FILTER (WHERE "status" = 'pending')::int AS "pending",
          COUNT(*) FILTER (WHERE "status" = 'resolved')::int AS "resolved"
        FROM "Report"
      `,
    ]);

    const reports = (reportsRaw as unknown as BootstrapReportRow[]).map((r) => ({
      ...r,
      _count: { comments: r.commentCount, reactions: r.reactionCount },
    }));

    const stats = statsRows[0] ?? { total: 0, pending: 0, resolved: 0 };

    return NextResponse.json(
      { reports, recentComments, stats },
      { headers: { 'Cache-Control': 'private, max-age=15' } }
    );
  } catch (error) {
    console.error('[GET /api/bootstrap] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
