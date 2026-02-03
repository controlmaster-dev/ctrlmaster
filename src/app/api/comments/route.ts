import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { reportId, authorId, content, parentId } = body

        if (!reportId || !authorId || !content) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const newComment = await prisma.comment.create({
            data: {
                reportId,
                authorId,
                content,
                parentId
            },
            include: {
                author: true
            }
        })

        // Email Notification Logic
        // 1. Fetch Report Author
        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { operator: true }
        })

        if (report) {
            const commenter = newComment.author.name
            const reportUrl = `https://enlacecr.dev/reportes?id=${reportId}`
            const brandColor = "#FF0C60"
            const bgColor = "#09090b"
            const cardColor = "#18181b"
            const textColor = "#f8fafc"
            const mutedColor = "#94a3b8"

            const emailTemplate = (title: string, message: string, ctaText: string, ctaUrl: string) => `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="max-width: 600px; margin: 40px auto; background-color: ${cardColor}; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
                        <!-- Accent Bar -->
                        <div style="height: 4px; background-color: ${brandColor};"></div>
                        
                        <!-- Header -->
                        <div style="padding: 32px 40px; border-bottom: 1px solid #27272a;">
                            <span style="color: ${brandColor}; font-weight: 800; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px;">ENLACE</span>
                            <h1 style="color: ${textColor}; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px;">
                            <p style="color: ${mutedColor}; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                ${message}
                            </p>

                            <div style="background-color: rgba(255, 255, 255, 0.03); border-left: 3px solid ${brandColor}; padding: 20px; margin-bottom: 32px; border-radius: 0 8px 8px 0;">
                                <p style="margin: 0; color: ${textColor}; font-style: italic; font-size: 15px; line-height: 1.6;">"${content}"</p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${ctaUrl}" style="background-color: ${brandColor}; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 12, 96, 0.2);">
                                    ${ctaText}
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 32px 40px; text-align: center; background-color: #121214; border-top: 1px solid #27272a;">
                            <p style="margin: 0; color: ${mutedColor}; font-size: 12px;">
                                Sistema de Reportes e Incidencias<br/>
                                <span style="opacity: 0.7;">© ${new Date().getFullYear()} Enlace - Control Master</span>
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `

            // Notify Report Author if someone else commented
            // Using operatorEmail field from Report model for reliability
            if (report.operatorEmail && newComment.author.email !== report.operatorEmail) {
                await sendEmail({
                    to: report.operatorEmail,
                    subject: `Nuevo comentario: Reporte #${report.id.slice(0, 8)}`,
                    html: emailTemplate(
                        "Nuevo Comentario",
                        `<strong>${commenter}</strong> ha comentado en tu reporte.`,
                        "Ver Reporte",
                        reportUrl
                    )
                })
            }

            // Notify Mentioned Users
            if (body.mentionedUserIds && body.mentionedUserIds.length > 0) {
                const mentionedIds: string[] = body.mentionedUserIds

                for (const userId of mentionedIds) {
                    // Don't notify if self-mention (though UI shouldn't allow/user wouldn't do it typically)
                    if (userId === authorId) continue

                    const userToNotify = await prisma.user.findUnique({ where: { id: userId } })

                    if (userToNotify && userToNotify.email) {
                        await sendEmail({
                            to: userToNotify.email,
                            subject: `Te mencionaron en el reporte #${report.id.slice(0, 8)}`,
                            html: emailTemplate(
                                "Te han mencionado",
                                `<strong>${commenter}</strong> te mencionó en un comentario.`,
                                "Ver Mención",
                                reportUrl
                            )
                        })
                    }
                }
            }
        }

        return NextResponse.json(newComment)
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: (error as Error).message }, { status: 500 })
    }
}
