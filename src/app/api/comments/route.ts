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
            const reportUrl = `https://enlacemaster.live/reportes?id=${reportId}`
            const brandColor = "#FF0C60"
            const bgColor = "#09090b"
            const cardColor = "#18181b"
            const textColor = "#f8fafc"
            const mutedColor = "#94a3b8"

            const emailTemplate = (title: string, message: string, ctaText: string, ctaUrl: string) => `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: ${bgColor}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: ${cardColor}; border-radius: 16px; overflow: hidden; margin-top: 40px; border: 1px solid #27272a;">
                        <!-- Header -->
                        <div style="background-color: ${bgColor}; padding: 20px; text-align: center; border-bottom: 1px solid #27272a;">
                            <span style="color: ${brandColor}; font-weight: bold; font-size: 20px; letter-spacing: 1px;">ENLACE</span>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <h1 style="color: ${textColor}; margin: 0 0 20px 0; font-size: 24px; text-align: center;">${title}</h1>
                            
                            <p style="color: ${mutedColor}; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                                ${message}
                            </p>

                            <div style="background-color: ${bgColor}; border-left: 4px solid ${brandColor}; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
                                <p style="margin: 0; color: ${textColor}; font-style: italic;">"${content}"</p>
                            </div>

                            <div style="text-align: center;">
                                <a href="${ctaUrl}" style="background-color: ${brandColor}; color: white; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 600; display: inline-block;">
                                    ${ctaText}
                                </a>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div style="padding: 20px; text-align: center; background-color: ${bgColor}; border-top: 1px solid #27272a;">
                            <p style="margin: 0; color: ${mutedColor}; font-size: 12px;">
                                Sistema de Reportes e Incidencias<br/>
                                © 2025 Enlace Canal 23
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
