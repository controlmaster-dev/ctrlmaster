import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { format, addMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface TaskQueryResult {
  id: string;
  title: string;
  priority: string;
  deadline: string;
  scheduledDate: string;
  status: string;
  reminderSent: number | null;
  userName: string;
  userEmail: string;
}

export async function GET() {
  try {
    console.log('[Cron Reminders] Starting...');
    const now = new Date();
    const timeZone = 'America/Costa_Rica';
    const zonedNow = toZonedTime(now, timeZone);

    const targetTime = addMinutes(zonedNow, 1);

    const dateStr = format(zonedNow, 'yyyy-MM-dd');
    const timeStr = format(targetTime, 'HH:mm');

    console.log(`[Cron Reminders] Current Time (CR): ${format(zonedNow, 'HH:mm')} | Looking for tasks at: ${timeStr} on ${dateStr}`);

    const tasks = await sql<TaskQueryResult[]>`
      SELECT
        t."id", t."title", t."priority", t."deadline",
        t."scheduledDate", t."status", t."reminderSent",
        u."name" AS "userName", u."email" AS "userEmail"
      FROM "Task" t
      JOIN "User" u ON t."userId" = u."id"
      WHERE t."scheduledDate" = ${dateStr}
        AND t."deadline" = ${timeStr}
        AND t."status" = 'PENDING'
        AND (t."reminderSent" = FALSE OR t."reminderSent" IS NULL)
    `;

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ message: 'No tasks found for reminder' });
    }

    const results = await Promise.all(tasks.map(async (task: TaskQueryResult) => {
      if (!task.userEmail) return { id: task.id, status: 'no_email' };

      console.log(`Sending reminder for Task ${task.id} to ${task.userEmail}`);

      const priorityMap: Record<string, string> = {
        'HIGH': 'Alta',
        'MEDIUM': 'Media',
        'LOW': 'Baja'
      };
      const priorityLabel = priorityMap[task.priority] || task.priority;

      await sendEmail({
        to: task.userEmail,
        subject: `Recordatorio: ${task.title}`,
        html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark only">
  <style>
    body { margin: 0; padding: 0; background-color: #000 !important; font-family: 'Inter', -apple-system, sans-serif; color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #18181b !important; border-radius: 16px; border: 1px solid #27272a; }
    .accent-bar { height: 4px; background-color: #FF0C60; }
    .header { padding: 32px 40px; border-bottom: 1px solid #27272a; }
    .brand { color: #FF0C60; font-weight: 800; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
    .title { color: #f8fafc; font-size: 20px; }
    .content { padding: 40px; }
    .task-card { background-color: rgba(255,255,255,0.03); border: 1px solid #27272a; border-radius: 12px; padding: 24px; }
    .footer { padding: 32px 40px; background-color: #121214; border-top: 1px solid #27272a; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="accent-bar"></div>
    <div class="header"><span class="brand">RECORDATORIO</span><h1 class="title">Notificación de Tarea</h1></div>
    <div class="content">
      <p>Hola <strong>${task.userName}</strong>,</p>
      <p>Te recordamos que la siguiente tarea tiene un tiempo límite de entrega inminente.</p>
      <div class="task-card">
        <h2>${task.title}</h2>
        <p>Prioridad: <span style="color:#FF0C60">${priorityLabel}</span>${task.deadline ? ` • Hora: ${task.deadline}` : ''}</p>
      </div>
      <p style="text-align:center; margin-top: 16px;">
        <a href="https://enlacecr.dev/tareas?openTask=${task.id}" style="background:#FF0C60;color:white;padding:14px 32px;border-radius:999px;text-decoration:none;">Ver Detalles</a>
      </p>
    </div>
    <div class="footer"><p style="font-size:11px;color:#94a3b8;">Sistema de Control Master • Enlace<br/>© ${new Date().getFullYear()} Enlace - Control Master</p></div>
  </div>
</body>
</html>`
      });

      await sql`UPDATE "Task" SET "reminderSent" = TRUE WHERE "id" = ${task.id}`;

      return { id: task.id, status: 'sent' };
    }));

    return NextResponse.json({ success: true, processed: results.length, details: results });

  } catch (error: unknown) {
    console.error('[Cron Reminders] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
