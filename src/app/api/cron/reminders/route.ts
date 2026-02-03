
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
                    <html>
                    <body style="margin: 0; padding: 0; background-color: #09090b; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f8fafc;">
                        <div style="max-width: 600px; margin: 40px auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden;">
                            <!-- Accent Bar -->
                            <div style="height: 4px; background-color: #FF0C60;"></div>
                            
                            <!-- Header -->
                            <div style="padding: 32px 40px; border-bottom: 1px solid #27272a;">
                                <span style="color: #FF0C60; font-weight: 800; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; display: block; margin-bottom: 8px;">RECORDATORIO</span>
                                <h1 style="margin: 0; color: #f8fafc; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">Notificación de Tarea</h1>
                            </div>

                            <div style="padding: 40px;">
                                <p style="font-size: 16px; color: #f8fafc; margin: 0 0 12px 0;">Hola <strong>${task.userName}</strong>,</p>
                                <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 0 0 32px 0;">
                                    Te recordamos que la siguiente tarea tiene un tiempo límite de entrega inminente (menos de 1 minuto).
                                </p>
                                
                                <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid #27272a; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                                    <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #f8fafc; font-weight: 700;">${task.title}</h2>
                                    <div style="font-size: 13px; color: #94a3b8;">
                                        Prioridad: <span style="font-weight: 600; color: #FF0C60;">${priorityLabel}</span>
                                        ${task.deadline ? ` • Hora Límite: <span style="font-weight: 600; color: #f8fafc;">${task.deadline}</span>` : ''}
                                    </div>
                                </div>
                                
                                <div style="text-align: center;">
                                    <a href="https://enlacecr.dev/tareas?openTask=${task.id}" style="background-color: #FF0C60; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(255, 12, 96, 0.2);">Ver Detalles</a>
                                </div>
                            </div>

                            <div style="padding: 32px 40px; background-color: #121214; border-top: 1px solid #27272a; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8;">Sistema de Control Master • Enlace</p>
                            </div>
                        </div>
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
