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
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="dark only">
                <meta name="supported-color-schemes" content="dark only">
                <style>
                    :root { color-scheme: dark only; supported-color-schemes: dark only; }
                    body { margin: 0; padding: 0; background-color: #000000 !important; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc; -webkit-font-smoothing: antialiased; }
                    .outer-wrapper { background-color: #000000 !important; }
                    .container { max-width: 600px; width: 100%; margin: 0 auto; background-color: #18181b !important; border-radius: 16px; overflow: hidden; border: 1px solid #27272a; }
                    .accent-bar { height: 4px; background-color: #ef4444; }
                    .header { padding: 32px 40px; border-bottom: 1px solid #27272a; text-align: left; }
                    .brand { color: #ef4444; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px; }
                    .title { margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.2; }
                    .subtitle { margin: 8px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 400; }
                    .content { padding: 40px; }
                    .intro { font-size: 14px; color: #94a3b8; margin: 0 0 32px 0; line-height: 1.6; text-align: left; }
                    .operator-section { margin-bottom: 40px; }
                    .operator-name { margin: 0 0 16px 0; color: #f8fafc; font-size: 15px; font-weight: 700; border-bottom: 1px solid #27272a; padding-bottom: 8px; text-align: left; }
                    .task-table { width: 100%; border-collapse: collapse; }
                    .task-row td { padding: 16px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
                    .task-title { font-size: 14px; font-weight: 600; color: #f8fafc; text-align: left; }
                    .task-meta { font-size: 12px; color: #94a3b8; margin-top: 6px; text-align: left; }
                    .priority-tag { color: #ef4444; font-weight: 600; }
                    .footer { padding: 32px 40px; background-color: #121214; border-top: 1px solid #27272a; text-align: center; }
                    .footer-text { margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5; }
                    
                    @media only screen and (max-width: 600px) {
                        .outer-padding { padding: 16px !important; }
                        .container { border-radius: 16px !important; }
                        .content, .header, .footer { padding: 24px !important; }
                    }
                </style>
            </head>
            <body bgcolor="#000000">
                <table class="outer-wrapper" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#000000" style="table-layout: fixed;">
                    <tr>
                        <td align="center" class="outer-padding" style="padding: 40px 10px;">
                            <table class="container" width="600" border="0" cellspacing="0" cellpadding="0" bgcolor="#18181b" style="max-width: 600px; width: 100%; border-radius: 16px; border: 1px solid #27272a;">
                                <tr>
                                    <td>
                                        <div class="accent-bar"></div>
                                        <div class="header">
                                            <span class="brand">CONTROL MASTER</span>
                                            <h1 class="title">Resumen de Incumplimiento Diario</h1>
                                            <p class="subtitle">Reporte para el día ${dateStr}</p>
                                        </div>

                                        <div class="content">
                                            <p class="intro">
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
                <div class="operator-section">
                    <h2 class="operator-name">${userName}</h2>
                    <table class="task-table" width="100%">
                        ${tasks.map(t => `
                            <tr class="task-row">
                                <td align="left">
                                    <div class="task-title">${t.title}</div>
                                    <div class="task-meta">
                                        Prioridad: <span class="priority-tag">${getPriorityLabel(t.priority)}</span>
                                        ${t.deadline ? ` • Hora: <span style="color: #f8fafc;">${t.deadline}</span>` : ''}
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
                                        <div class="footer" bgcolor="#121214">
                                            <p class="footer-text">
                                                Reporte generado automáticamente<br/>
                                                <span style="opacity: 0.6;">© ${new Date().getFullYear()} Enlace - Control Master</span>
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
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
