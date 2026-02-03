import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function GET() {
    try {
        const adminEmail = 'knunez@enlace.org'

        const now = new Date()
        const timeZone = 'America/Costa_Rica'
        const zonedNow = toZonedTime(now, timeZone)
        const dateStr = format(zonedNow, 'yyyy-MM-dd')

        console.log(`[Cron Summary] Generating daily report for ${dateStr}`)

        // Find all tasks Scheduled for Today that are still PENDING
        const incompleteTasks = await prisma.task.findMany({
            where: {
                scheduledDate: dateStr,
                status: 'PENDING'
            },
            include: {
                user: true
            }
        })

        if (incompleteTasks.length === 0) {
            return NextResponse.json({ message: 'All tasks completed! No report needed.' })
        }

        // Group by User
        const userMap = new Map<string, typeof incompleteTasks>()

        incompleteTasks.forEach(task => {
            const list = userMap.get(task.user.name) || []
            list.push(task)
            userMap.set(task.user.name, list)
        })

        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
                <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
                    <!-- Accent Bar -->
                    <div style="height: 4px; background-color: #ef4444;"></div>
                    
                    <!-- Header -->
                    <div style="padding: 32px 40px; border-bottom: 1px solid #27272a;">
                        <span style="color: #ef4444; font-weight: 800; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px;">CONTROL MASTER</span>
                        <h1 style="margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Resumen de Incumplimiento Diario</h1>
                        <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Reporte para el día ${dateStr}</p>
                    </div>

                    <div style="padding: 40px;">
                        <p style="font-size: 15px; color: #94a3b8; margin: 0 0 32px 0; line-height: 1.6;">
                            Las siguientes tareas programadas no fueron marcadas como completadas al cierre de la jornada:
                        </p>
        `

        // Priority Translation Helper
        const getPriorityLabel = (p: string) => {
            const map: Record<string, string> = { 'HIGH': 'Alta', 'MEDIUM': 'Media', 'LOW': 'Baja' }
            return map[p] || p
        }

        userMap.forEach((tasks, userName) => {
            htmlContent += `
                <div style="margin-bottom: 40px;">
                    <h2 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 16px; font-weight: 700; border-bottom: 1px solid #27272a; padding-bottom: 8px;">${userName}</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${tasks.map(t => `
                            <tr>
                                <td style="padding: 16px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03);">
                                    <div style="font-size: 15px; font-weight: 600; color: #f8fafc;">${t.title}</div>
                                    <div style="font-size: 13px; color: #94a3b8; margin-top: 6px;">
                                        Prioridad: <span style="color: #ef4444; font-weight: 500;">${getPriorityLabel(t.priority)}</span>
                                        ${t.deadline ? ` • Hora: <span style="font-weight: 500; color: #f8fafc;">${t.deadline}</span>` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            `
        })

        htmlContent += `
                    </div>
                    <div style="padding: 32px 40px; background-color: #121214; border-top: 1px solid #27272a; text-align: center;">
                        <p style="margin: 0; font-size: 12px; color: #94a3b8;">Reporte generado automáticamente • Sistema de Control Master</p>
                    </div>
                </div>
            </body>
            </html>
        `

        await sendEmail({
            to: adminEmail,
            subject: `Reporte de Tareas Incompletas - ${dateStr}`,
            html: htmlContent
        })

        return NextResponse.json({ success: true, incompleteCount: incompleteTasks.length })

    } catch (error) {
        console.error('[Cron Summary] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
