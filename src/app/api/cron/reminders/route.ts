
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { format, addMinutes } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

interface ReminderTask {
    id: string
    title: string
    priority: string
    deadline: string
    scheduledDate: string
    status: string
    reminderSent: number | null
    userName: string
    userEmail: string
}

export async function GET() {
    try {
        console.log('[Cron Reminders] Starting...')
        // Assume server time needs adjustment or use consistent timezone
        // For simplicity in this v1, assuming server time aligns with user operations or using a specific TZ
        // User is likely in 'America/Mexico_City' or similar (-06:00)

        const now = new Date()
        const timeZone = 'America/Costa_Rica'
        const zonedNow = toZonedTime(now, timeZone)
        // const zonedNow = now // Fallback for debugging

        // Target: 1 minute from "now"
        const targetTime = addMinutes(zonedNow, 1)

        const dateStr = format(zonedNow, 'yyyy-MM-dd')
        const timeStr = format(targetTime, 'HH:mm') // e.g. "18:20"

        console.log(`[Cron Reminders] Current Time (CR): ${format(zonedNow, 'HH:mm')} | Looking for tasks at: ${timeStr} on ${dateStr}`)

        const tasks = await prisma.$queryRaw`
            SELECT 
                t.id, t.title, t.priority, t.deadline, t.scheduledDate, t.status, t.reminderSent,
                u.name as userName, u.email as userEmail
            FROM Task t
            JOIN User u ON t.userId = u.id
            WHERE t.scheduledDate = ${dateStr}
            AND t.deadline = ${timeStr}
            AND t.status = 'PENDING'
            AND (t.reminderSent = 0 OR t.reminderSent IS NULL)
        ` as ReminderTask[]

        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ message: 'No tasks found for reminder' })
        }

        const results = await Promise.all(tasks.map(async (task) => {
            if (!task.userEmail) return { id: task.id, status: 'no_email' }

            console.log(`Sending reminder for Task ${task.id} to ${task.userEmail} `)

            // Translate Priority
            const priorityMap: Record<string, string> = {
                'HIGH': 'Alta',
                'MEDIUM': 'Media',
                'LOW': 'Baja'
            }
            const priorityLabel = priorityMap[task.priority] || task.priority

            await sendEmail({
                to: task.userEmail,
                subject: `Recordatorio: ${task.title}`,
                html: `
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
                            .accent-bar { height: 4px; background-color: #FF0C60; }
                            .header { padding: 32px 40px; border-bottom: 1px solid #27272a; text-align: left; }
                            .brand { color: #FF0C60; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px; }
                            .title { margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
                            .content { padding: 40px; }
                            .greeting { font-size: 15px; color: #f8fafc; margin: 0 0 12px 0; text-align: left; }
                            .message { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 32px 0; text-align: left; }
                            .task-card { background-color: rgba(255, 255, 255, 0.03); border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 32px; text-align: left; }
                            .task-title { margin: 0 0 12px 0; font-size: 16px; color: #f8fafc; font-weight: 700; }
                            .task-meta { font-size: 12px; color: #94a3b8; }
                            .priority-tag { font-weight: 600; color: #FF0C60; }
                            .cta-wrapper { text-align: center; }
                            .cta-button { background-color: #FF0C60; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(255, 12, 96, 0.2); }
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
                                                    <span class="brand">RECORDATORIO</span>
                                                    <h1 class="title">Notificación de Tarea</h1>
                                                </div>

                                                <div class="content">
                                                    <p class="greeting">Hola <strong>${task.userName}</strong>,</p>
                                                    <p class="message">
                                                        Te recordamos que la siguiente tarea tiene un tiempo límite de entrega inminente (menos de 1 minuto).
                                                    </p>
                                                    
                                                    <div class="task-card" bgcolor="rgba(255, 255, 255, 0.03)">
                                                        <h2 class="task-title">${task.title}</h2>
                                                        <div class="task-meta">
                                                            Prioridad: <span class="priority-tag">${priorityLabel}</span>
                                                            ${task.deadline ? ` • Hora Límite: <span style="color: #f8fafc; font-weight: 600;">${task.deadline}</span>` : ''}
                                                        </div>
                                                    </div>
                                                    
                                                    <div class="cta-wrapper">
                                                        <a href="https://enlacecr.dev/tareas?openTask=${task.id}" class="cta-button">Ver Detalles</a>
                                                    </div>
                                                </div>

                                                <div class="footer" bgcolor="#121214">
                                                    <p class="footer-text">
                                                        Sistema de Control Master • Enlace<br/>
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
            })

            // Mark reminder as sent
            await prisma.$executeRaw`UPDATE Task SET reminderSent = 1 WHERE id = ${task.id}`

            return { id: task.id, status: 'sent' }
        }))

        return NextResponse.json({ success: true, processed: results.length, details: results })

    } catch (error) {
        console.error('[Cron Reminders] Error:', error)
        console.error('[Cron Reminders] Error:', error)
        return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
    }
}
