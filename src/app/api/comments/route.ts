import { randomUUID } from "crypto";
import { z } from "zod";
import { connectMongo } from "@/lib/mongo";
import { sendEmail } from "@/lib/email";
import { apiCreated, apiHandler } from "@/lib/api/handler";
import { CommentModel, ReportModel, UserModel } from "@/models";
import { escapeHtml, renderCommentNotificationEmail } from "@/lib/emailTemplates";
import { formatReportDisplayId } from "@/lib/reportCode";

const createCommentSchema = z.object({
  reportId: z.string().min(1, "ID de reporte es requerido"),
  content: z.string().min(1, "El contenido del comentario es requerido").max(2000),
  parentId: z.string().nullable().optional(),
  mentionedUserIds: z.array(z.string()).nullable().optional(),
});

export const POST = apiHandler(
  { auth: true, bodySchema: createCommentSchema },
  async ({ user, body }) => {
    const { reportId, content, parentId, mentionedUserIds } = body;
    const authorId = String(user?.id ?? "");

    await connectMongo();
    const newComment = await CommentModel.create({
      _id: randomUUID(),
      reportId,
      authorId,
      content,
      parentId: parentId || null,
      createdAt: new Date(),
    });

    const author = await UserModel.findById(authorId).lean();
    const plain = newComment.toObject();
    const commentWithAuthor = {
      ...plain,
      id: String(plain._id),
      author,
    };

    void sendCommentNotifications({
      reportId,
      authorId,
      authorName: author?.name || "",
      authorEmail: author?.email || "",
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
  const { reportId, authorId, authorName, authorEmail, commentContent, mentionedUserIds } =
    payload;

  await connectMongo();
  const report = await ReportModel.findById(reportId).lean();
  if (!report) return;

  const operator = report.operatorId
    ? await UserModel.findById(report.operatorId).select("email").lean()
    : null;
  const operatorEmail = operator?.email ?? report.operatorEmail;

  const reportUrl = `https://enlacecr.dev/reportes?id=${reportId}`;
  const shortId = formatReportDisplayId(reportId, report.code);

  if (operatorEmail && authorEmail !== operatorEmail) {
    try {
      await sendEmail({
        to: operatorEmail,
        subject: `Nuevo comentario: Reporte #${shortId}`,
        html: renderCommentNotificationEmail({
          title: "Nuevo comentario en tu reporte",
          messageHtml: `<strong>${escapeHtml(authorName)}</strong> dejó un comentario en el reporte <strong>#${escapeHtml(shortId)}</strong>.`,
          commentContent,
          ctaUrl: reportUrl,
          ctaLabel: "Ver reporte",
        }),
      });
    } catch (err) {
      console.error("[comments] Failed to notify report owner:", err);
    }
  }

  if (mentionedUserIds && mentionedUserIds.length > 0) {
    for (const userId of mentionedUserIds) {
      if (userId === authorId) continue;

      try {
        const userToNotify = await UserModel.findById(userId).lean();
        if (userToNotify?.email) {
          await sendEmail({
            to: userToNotify.email,
            subject: `Te mencionaron en el reporte #${shortId}`,
            html: renderCommentNotificationEmail({
              title: "Te mencionaron en un reporte",
              messageHtml: `<strong>${escapeHtml(authorName)}</strong> te mencionó en el reporte <strong>#${escapeHtml(shortId)}</strong>.`,
              commentContent,
              ctaUrl: reportUrl,
              ctaLabel: "Ver mención",
            }),
          });
        }
      } catch (err) {
        console.error(`[comments] Failed to notify mentioned user ${userId}:`, err);
      }
    }
  }
}
