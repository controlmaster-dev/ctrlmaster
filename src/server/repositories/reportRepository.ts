import sql from '@/lib/db';
import type { CreateReportInput, UpdateReportInput } from '@/lib/validation';

export type ReportFilters = {
  page: number;
  limit: number;
  status?: string;
  priority?: string;
  operator?: string;
  category?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ReportListRow = {
  id: string;
  operatorName: string;
  operatorEmail: string;
  problemDescription: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  dateStarted: Date;
  dateResolved: Date | null;
  emailStatus: string;
  emailRecipients: string | null;
  commentCount: number;
  reactionCount: number;
};

export async function listReports(filters: ReportFilters) {
  const skip = (filters.page - 1) * filters.limit;

  const [reports, totalResult] = await Promise.all([
    sql<ReportListRow[]>`
      SELECT
        r."id",
        r."operatorName",
        r."operatorEmail",
        r."problemDescription",
        r."category",
        r."priority",
        r."status",
        r."createdAt",
        r."dateStarted",
        r."dateResolved",
        r."emailStatus",
        r."emailRecipients",
        COALESCE(cc."commentCount", 0)::int AS "commentCount",
        COALESCE(rc."reactionCount", 0)::int AS "reactionCount"
      FROM "Report" r
      LEFT JOIN (
        SELECT "reportId", COUNT(*) AS "commentCount" FROM "Comment" GROUP BY "reportId"
      ) cc ON cc."reportId" = r."id"
      LEFT JOIN (
        SELECT "reportId", COUNT(*) AS "reactionCount" FROM "Reaction" GROUP BY "reportId"
      ) rc ON rc."reportId" = r."id"
      WHERE 1=1
      ${filters.status && filters.status !== 'all' ? sql`AND r."status" = ${filters.status}` : sql``}
      ${filters.priority && filters.priority !== 'all' ? sql`AND r."priority" = ${filters.priority}` : sql``}
      ${filters.category && filters.category !== 'all' ? sql`AND r."category" = ${filters.category}` : sql``}
      ${filters.operator ? sql`AND (r."operatorName" ILIKE ${'%' + filters.operator + '%'} OR r."operatorEmail" ILIKE ${'%' + filters.operator + '%'})` : sql``}
      ${filters.search ? sql`AND (r."problemDescription" ILIKE ${'%' + filters.search + '%'} OR r."operatorName" ILIKE ${'%' + filters.search + '%'} OR r."id"::text ILIKE ${'%' + filters.search + '%'})` : sql``}
      ${filters.dateFrom ? sql`AND r."createdAt" >= ${new Date(filters.dateFrom).toISOString()}` : sql``}
      ${filters.dateTo ? sql`AND r."createdAt" <= ${new Date(filters.dateTo).toISOString()}` : sql``}
      ORDER BY r."createdAt" DESC
      LIMIT ${filters.limit} OFFSET ${skip}
    `,
    sql<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "Report" r
      WHERE 1=1
      ${filters.status && filters.status !== 'all' ? sql`AND r."status" = ${filters.status}` : sql``}
      ${filters.priority && filters.priority !== 'all' ? sql`AND r."priority" = ${filters.priority}` : sql``}
      ${filters.category && filters.category !== 'all' ? sql`AND r."category" = ${filters.category}` : sql``}
      ${filters.operator ? sql`AND (r."operatorName" ILIKE ${'%' + filters.operator + '%'} OR r."operatorEmail" ILIKE ${'%' + filters.operator + '%'})` : sql``}
      ${filters.search ? sql`AND (r."problemDescription" ILIKE ${'%' + filters.search + '%'} OR r."operatorName" ILIKE ${'%' + filters.search + '%'} OR r."id"::text ILIKE ${'%' + filters.search + '%'})` : sql``}
      ${filters.dateFrom ? sql`AND r."createdAt" >= ${new Date(filters.dateFrom).toISOString()}` : sql``}
      ${filters.dateTo ? sql`AND r."createdAt" <= ${new Date(filters.dateTo).toISOString()}` : sql``}
    `,
  ]);

  return {
    reports,
    total: totalResult[0]?.count ?? 0,
  };
}

export async function createReport(data: CreateReportInput) {
  return sql.begin(async (tx) => {
    const [newReport] = await tx`
      INSERT INTO "Report" (
        "operatorId", "operatorName", "operatorEmail",
        "problemDescription", "category", "priority",
        "status", "emailStatus", "emailRecipients",
        "dateStarted", "dateResolved"
      )
      VALUES (
        ${data.operatorId}, ${data.operatorName}, ${data.operatorEmail || ''},
        ${data.problemDescription}, ${data.category}, ${data.priority},
        ${data.status}, ${data.emailStatus || 'none'}, ${data.emailRecipients || null},
        ${new Date(data.dateStarted).toISOString()},
        ${data.dateResolved ? new Date(data.dateResolved).toISOString() : null}
      )
      RETURNING *
    `;

    const attachments = data.attachments?.length
      ? await tx`
          INSERT INTO "Attachment" ${tx(
            data.attachments.map((attachment) => ({
              url: attachment.url,
              type: attachment.type,
              data: attachment.data || null,
              reportId: newReport.id,
            })),
            'url',
            'type',
            'data',
            'reportId'
          )}
          RETURNING *
        `
      : [];

    return { ...newReport, attachments };
  });
}

export async function findReportId(id: string) {
  const [report] = await sql<Array<{ id: string }>>`
    SELECT "id" FROM "Report" WHERE "id" = ${id} LIMIT 1
  `;
  return report ?? null;
}

async function settled<T>(label: string, promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[getReportDetail] ${label} failed:`, error);
    return fallback;
  }
}

export async function getReportDetailById(id: string) {
  const [reportRows, comments, reactions, views, attachments] = await Promise.all([
    sql`SELECT * FROM "Report" WHERE "id" = ${id} LIMIT 1`,
    settled(
      "comments",
      sql`
        SELECT
          c."id", c."content", c."authorId", c."reportId", c."parentId", c."createdAt",
          json_build_object('id', a."id", 'name', a."name", 'image', a."image") AS author
        FROM "Comment" c
        JOIN "User" a ON a."id" = c."authorId"
        WHERE c."reportId" = ${id}
        ORDER BY c."createdAt" ASC
      `,
      [] as unknown[]
    ),
    settled(
      "reactions",
      sql`
        SELECT
          re."id", re."emoji", re."authorId", re."reportId", re."createdAt",
          json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS author
        FROM "Reaction" re
        JOIN "User" u ON u."id" = re."authorId"
        WHERE re."reportId" = ${id}
      `,
      [] as unknown[]
    ),
    settled(
      "views",
      sql`
        SELECT
          rv."id", rv."viewedAt",
          json_build_object('id', u."id", 'name', u."name") AS "user"
        FROM "ReportView" rv
        JOIN "User" u ON u."id" = rv."userId"
        WHERE rv."reportId" = ${id}
      `,
      [] as unknown[]
    ),
    settled(
      "attachments",
      sql`SELECT "id", "url", "type", "data", "reportId", "createdAt" FROM "Attachment" WHERE "reportId" = ${id}`,
      [] as unknown[]
    ),
  ]);

  const report = reportRows[0];
  if (!report) return null;

  type CommentRow = Record<string, unknown> & { id: string };
  const commentRows = comments as CommentRow[];
  const commentIds = commentRows.map((c) => String(c.id));
  let commentsWithReactions = commentRows.map((c) => ({ ...c, reactions: [] as unknown[] }));

  if (commentIds.length > 0) {
    const commentReactions = await settled(
      "commentReactions",
      sql`
        SELECT
          cr."id", cr."emoji", cr."authorId", cr."commentId", cr."createdAt",
          json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS author
        FROM "CommentReaction" cr
        JOIN "User" u ON u."id" = cr."authorId"
        WHERE cr."commentId" = ANY(${commentIds})
      `,
      [] as unknown[]
    );

    const byComment = new Map<string, unknown[]>();
    for (const r of commentReactions) {
      const row = r as { commentId: string };
      const list = byComment.get(row.commentId) || [];
      list.push(r);
      byComment.set(row.commentId, list);
    }

    commentsWithReactions = commentRows.map((c) => ({
      ...c,
      reactions: byComment.get(c.id) || [],
    }));
  }

  return {
    ...report,
    comments: commentsWithReactions,
    reactions,
    views,
    attachments,
  };
}

export async function deleteReport(id: string) {
  await sql`DELETE FROM "Report" WHERE "id" = ${id}`;
}

export async function updateReport(data: UpdateReportInput) {
  const updateData: Record<string, string | Date | null> = {};

  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'resolved' && !data.dateResolved) {
      updateData.dateResolved = new Date().toISOString();
    }
  }

  if (data.dateResolved !== undefined) {
    updateData.dateResolved = data.dateResolved;
  }

  const fields = Object.keys(updateData);
  if (fields.length === 0) return null;

  const [updatedReport] = await sql`
    UPDATE "Report"
    SET ${sql(updateData)}
    WHERE "id" = ${data.id}
    RETURNING *
  `;

  return updatedReport ?? null;
}
