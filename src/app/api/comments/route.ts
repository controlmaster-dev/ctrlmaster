/**
 * Comments API route with input validation and typed error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { ApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';


const createCommentSchema = z.object({
  reportId: z.string().min(1, 'ID de reporte es requerido'),
  authorId: z.string().min(1, 'ID de autor es requerido'),
  content: z.string().min(1, 'El contenido del comentario es requerido').max(2000),
  parentId: z.string().optional(),
  mentionedUserIds: z.array(z.string()).optional(),
});


const BRAND_COLOR = '#FF0C60';
const CARD_COLOR = '#18181b';
const TEXT_COLOR = '#f8fafc';
const MUTED_COLOR = '#94a3b8';

function buildEmailTemplate(
  title: string,
  message: string,
  commentContent: string,
  ctaText: string,
  ctaUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="dark only">
      <style>
        body { margin: 0; padding: 0; background-color: #000 !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: ${CARD_COLOR}; border-radius: 16px; border: 1px solid #27272a; overflow: hidden; }
        .accent-bar { height: 4px; background-color: ${BRAND_COLOR}; }
        .header { padding: 32px 40px; border-bottom: 1px solid #27272a; }
        .brand { color: ${BRAND_COLOR}; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px; }
        .title { color: ${TEXT_COLOR}; margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 40px; }
        .message { color: ${MUTED_COLOR}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0; }
        .comment-box { background-color: rgba(255,255,255,0.03); border-left: 3px solid ${BRAND_COLOR}; padding: 20px; margin-bottom: 32px; border-radius: 0 8px 8px 0; }
        .comment-text { margin: 0; color: ${TEXT_COLOR}; font-style: italic; font-size: 15px; line-height: 1.6; }
        .cta-wrapper { text-align: center; }
        .cta-button { background-color: ${BRAND_COLOR}; color: #fff !important; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; }
        .footer { padding: 32px 40px; text-align: center; background-color: #121214; border-top: 1px solid #27272a; }
        .footer-text { margin: 0; color: ${MUTED_COLOR}; font-size: 11px; line-height: 1.5; }
      </style>
    </head>
    <body bgcolor="#000000">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="table-layout:fixed;">
        <tr>
          <td align="center" style="padding: 40px 10px;">
            <div class="container">
              <div class="accent-bar"></div>
              <div class="header">
                <span class="brand">ENLACE</span>
                <h1 class="title">${title}</h1>
              </div>
              <div class="content">
                <p class="message">${message}</p>
                <div class="comment-box">
                  <p class="comment-text">"${commentContent}"</p>
                </div>
                <div class="cta-wrapper">
                  <a href="${ctaUrl}" class="cta-button">${ctaText}</a>
                </div>
              </div>
              <div class="footer">
                <p class="footer-text">
                  Sistema de Reportes e Incidencias<br/>
                  <span style="opacity:0.6">© ${new Date().getFullYear()} Enlace - Control Master</span>
                </p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { reportId, authorId, content, parentId, mentionedUserIds } = result.data;

    // Create comment and include author details in one query
    const newComment = await prisma.comment.create({
      data: { reportId, authorId, content, parentId },
      include: { author: true },
    });

    // Send notifications asynchronously (fire-and-forget, don't block response)
    void sendCommentNotifications({
      reportId,
      authorId,
      authorName: newComment.author.name,
      authorEmail: newComment.author.email,
      commentContent: content,
      mentionedUserIds,
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/comments] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}


interface NotificationPayload {
  reportId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  commentContent: string;
  mentionedUserIds?: string[];
}

/**
 * Sends email notifications to the report owner and any mentioned users.
 * This runs fire-and-forget — errors are logged but do not affect the API response.
 */
async function sendCommentNotifications(payload: NotificationPayload): Promise<void> {
  const { reportId, authorId, authorName, authorEmail, commentContent, mentionedUserIds } = payload;

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { operator: true },
  });

  if (!report) return;

  const reportUrl = `https://enlacecr.dev/reportes?id=${reportId}`;
  const shortId = reportId.slice(0, 8);

  // Notify report owner (if different from commenter)
  if (report.operatorEmail && authorEmail !== report.operatorEmail) {
    try {
      await sendEmail({
        to: report.operatorEmail,
        subject: `Nuevo comentario: Reporte #${shortId}`,
        html: buildEmailTemplate(
          'Nuevo Comentario',
          `<strong>${authorName}</strong> ha comentado en tu reporte.`,
          commentContent,
          'Ver Reporte',
          reportUrl
        ),
      });
    } catch (err) {
      console.error('[comments] Failed to notify report owner:', err);
    }
  }

  // Notify mentioned users
  if (mentionedUserIds && mentionedUserIds.length > 0) {
    for (const userId of mentionedUserIds) {
      if (userId === authorId) continue;

      try {
        const userToNotify = await prisma.user.findUnique({ where: { id: userId } });
        if (userToNotify?.email) {
          await sendEmail({
            to: userToNotify.email,
            subject: `Te mencionaron en el reporte #${shortId}`,
            html: buildEmailTemplate(
              'Te han mencionado',
              `<strong>${authorName}</strong> te mencionó en un comentario.`,
              commentContent,
              'Ver Mención',
              reportUrl
            ),
          });
        }
      } catch (err) {
        console.error(`[comments] Failed to notify mentioned user ${userId}:`, err);
      }
    }
  }
}