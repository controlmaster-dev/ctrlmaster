
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
                    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: Arial, sans-serif;">
                        <div style="max-width: 100%; margin: 0 auto; background-color: #ffffff;">
                            <div style="background-color: #FF0C60; padding: 20px; text-align: left;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">Recordatorio de Tarea</h1>
                            </div>
                            <div style="padding: 30px;">
                                <p style="font-size: 16px; color: #333333; margin-top: 0;">Hola <strong>${task.userName}</strong>,</p>
                                <p style="font-size: 15px; color: #555555; line-height: 1.5;">
                                    Esta tarea debería estar lista en menos de <strong>1 minuto</strong> y deberías terminarla pronto.
                                </p>
                                
                                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 25px 0;">
                                    <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">${task.title}</h2>
                                    <p style="margin: 0; font-size: 14px; color: #4b5563;">
                                        Prioridad: <span style="font-weight: 600; color: #111827;">${priorityLabel}</span>
                                    </p>
                                </div>
                                
                                <div style="margin-top: 30px;">
                                    <a href="http://94.72.126.17:3000/tareas?openTask=${task.id}" style="background-color: #000000; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: bold;">Ver Tarea</a>
                                </div>
                            </div>
                            <div style="padding: 20px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                                <p style="margin: 0; font-size: 12px; color: #999999;">Sistema de Control Master</p>
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
