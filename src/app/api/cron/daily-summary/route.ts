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
            <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
                <div style="max-width: 100%; margin: 0 auto; background-color: #ffffff;">
                    <div style="background-color: #ef4444; padding: 20px; text-align: left;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">Resumen de Incumplimiento Diario</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="font-size: 15px; color: #333333; margin-top: 0;">Las siguientes tareas programadas para hoy <strong>${dateStr}</strong> no fueron marcadas como completadas:</p>
                        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;">
        `

        // Priority Translation Helper
        const getPriorityLabel = (p: string) => {
            const map: Record<string, string> = { 'HIGH': 'Alta', 'MEDIUM': 'Media', 'LOW': 'Baja' }
            return map[p] || p
        }

        userMap.forEach((tasks, userName) => {
            htmlContent += `
                <div style="margin-bottom: 30px;">
                    <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; border-bottom: 2px solid #ef4444; padding-bottom: 8px; display: inline-block;">${userName}</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        ${tasks.map(t => `
                            <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                                    <div style="font-size: 15px; font-weight: 600; color: #1f2937;">${t.title}</div>
                                    <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                                        Prioridad: <span style="color: #374151;">${getPriorityLabel(t.priority)}</span>
                                        ${t.deadline ? ` • Hora: <span style="font-weight: 500;">${t.deadline}</span>` : ''}
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
                    <div style="padding: 20px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; font-size: 12px; color: #999999;">Reporte generado automáticamente • Sistema de Control Master</p>
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
