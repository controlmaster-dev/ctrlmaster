import sql from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { apiCreated, apiHandler } from '@/lib/api/handler';
import { z } from 'zod';

const createCommentSchema = z.object({
  reportId: z.string().min(1, 'ID de reporte es requerido'),
  content: z.string().min(1, 'El contenido del comentario es requerido').max(2000),
  parentId: z.string().nullable().optional(),
  mentionedUserIds: z.array(z.string()).nullable().optional(),
});

import { escapeHtml, renderCommentNotificationEmail } from '@/lib/emailTemplates';
import { formatReportDisplayId } from '@/lib/reportCode';

export const POST = apiHandler(
  { auth: true, bodySchema: createCommentSchema },
  async ({ user, body }) => {
    const { reportId, content, parentId, mentionedUserIds } = body;
    const authorId = String(user?.id ?? '');

    const [newComment] = await sql`
      INSERT INTO "Comment" ("id", "reportId", "authorId", "content", "parentId", "createdAt")
      VALUES (gen_random_uuid(), ${reportId}, ${authorId}, ${content}, ${parentId || null}, ${new Date().toISOString()})
      RETURNING *
    `;

    const [author] = await sql`
      SELECT * FROM "User" WHERE "id" = ${authorId} LIMIT 1
    `;

    const commentWithAuthor = { ...newComment, author };

    void sendCommentNotifications({
      reportId,
      authorId,
      authorName: author?.name || '',
      authorEmail: author?.email || '',
      commentContent: content,
      mentionedUserIds: mentionedUserIds ?? undefined,
    });

    return apiCreated(commentWithAuthor);
  }
);

interface NotificationPayload {
  reportId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  commentContent: string;
  mentionedUserIds?: string[];
}

async function sendCommentNotifications(payload: NotificationPayload): Promise<void> {
  const { reportId, authorId, authorName, authorEmail, commentContent, mentionedUserIds } = payload;

  const [report] = await sql`
    SELECT r.*, u."email" AS "operatorEmail"
    FROM "Report" r
    JOIN "User" u ON u."id" = r."operatorId"
    WHERE r."id" = ${reportId}
    LIMIT 1
  `;

  if (!report) return;

  const reportUrl = `https://enlacecr.dev/reportes?id=${reportId}`;
  const shortId = formatReportDisplayId(
    reportId,
    (report as { code?: string | null }).code
  );

  if (report.operatorEmail && authorEmail !== report.operatorEmail) {
    try {
      await sendEmail({
        to: report.operatorEmail,
        subject: `Nuevo comentario: Reporte #${shortId}`,
        html: renderCommentNotificationEmail({
          title: 'Nuevo comentario en tu reporte',
          messageHtml: `<strong>${escapeHtml(authorName)}</strong> dejó un comentario en el reporte <strong>#${escapeHtml(shortId)}</strong>.`,
          commentContent,
          ctaUrl: reportUrl,
          ctaLabel: 'Ver reporte',
        }),
      });
    } catch (err) {
      console.error('[comments] Failed to notify report owner:', err);
    }
  }

  if (mentionedUserIds && mentionedUserIds.length > 0) {
    for (const userId of mentionedUserIds) {
      if (userId === authorId) continue;

      try {
        const [userToNotify] = await sql`
          SELECT * FROM "User" WHERE "id" = ${userId} LIMIT 1
        `;
        if (userToNotify?.email) {
          await sendEmail({
            to: userToNotify.email,
            subject: `Te mencionaron en el reporte #${shortId}`,
            html: renderCommentNotificationEmail({
              title: 'Te mencionaron en un reporte',
              messageHtml: `<strong>${escapeHtml(authorName)}</strong> te mencionó en el reporte <strong>#${escapeHtml(shortId)}</strong>.`,
              commentContent,
              ctaUrl: reportUrl,
              ctaLabel: 'Ver mención',
            }),
          });
        }
      } catch (err) {
        console.error(`[comments] Failed to notify mentioned user ${userId}:`, err);
      }
    }
  }
}
