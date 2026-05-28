import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;

    const [reportRows, comments, reactions, views, attachments] =
      await Promise.all([
        sql`SELECT * FROM "Report" WHERE "id" = ${id} LIMIT 1`,

        sql`
          SELECT
            c."id", c."content", c."authorId", c."reportId", c."parentId", c."createdAt",
            json_build_object(
              'id', a."id",
              'name', a."name",
              'image', a."image"
            ) AS author
          FROM "Comment" c
          JOIN "User" a ON a."id" = c."authorId"
          WHERE c."reportId" = ${id}
          ORDER BY c."createdAt" ASC
        `,

        sql`
          SELECT
            re."id", re."emoji", re."authorId", re."reportId", re."createdAt",
            json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS author
          FROM "Reaction" re
          JOIN "User" u ON u."id" = re."authorId"
          WHERE re."reportId" = ${id}
        `,

        sql`
          SELECT
            rv."id", rv."viewedAt",
            json_build_object('id', u."id", 'name', u."name") AS "user"
          FROM "ReportView" rv
          JOIN "User" u ON u."id" = rv."userId"
          WHERE rv."reportId" = ${id}
        `,

        sql`SELECT "id", "url", "type", "data", "reportId", "createdAt" FROM "Attachment" WHERE "reportId" = ${id}`,
      ]);

    const report = reportRows[0];
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Comment reactions in one query (if any comments)
    const commentIds = comments.map((c) => String(c.id));
    let commentsWithReactions = comments.map((c) => ({ ...c, reactions: [] as unknown[] }));

    if (commentIds.length > 0) {
      const commentReactions = await sql`
        SELECT
          cr."id", cr."emoji", cr."authorId", cr."commentId", cr."createdAt",
          json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS author
        FROM "CommentReaction" cr
        JOIN "User" u ON u."id" = cr."authorId"
        WHERE cr."commentId" = ANY(${commentIds})
      `;

      const byComment = new Map<string, unknown[]>();
      for (const r of commentReactions) {
        const list = byComment.get(r.commentId) || [];
        list.push(r);
        byComment.set(r.commentId, list);
      }

      commentsWithReactions = comments.map((c) => ({
        ...c,
        reactions: byComment.get(c.id) || [],
      }));
    }

    return NextResponse.json({
      ...report,
      comments: commentsWithReactions,
      reactions,
      views,
      attachments,
    });
  } catch (error: unknown) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
