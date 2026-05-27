import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export async function GET() {
  try {
    const adminEmail = 'knunez@enlace.org';

    const now = new Date();
    const timeZone = 'America/Costa_Rica';
    const zonedNow = toZonedTime(now, timeZone);
    const dateStr = format(zonedNow, 'yyyy-MM-dd');

    console.log(`[Cron Summary] Generating daily report for ${dateStr}`);

    const incompleteTasks = await sql`
      SELECT t.*, row_to_json(u.*) AS "user"
      FROM "Task" t
      JOIN "User" u ON u."id" = t."userId"
      WHERE t."scheduledDate" = ${dateStr}
        AND t."status" = 'PENDING'
    `;

    if (incompleteTasks.length === 0) {
      return NextResponse.json({ message: 'All tasks completed! No report needed.' });
    }

    const userMap = new Map<string, any[]>();

    incompleteTasks.forEach((task: any) => {
      const list = userMap.get(task.user.name) || [];
      list.push(task);
      userMap.set(task.user.name, list);
    });

    const getPriorityLabel = (p: string) => {
      const map: Record<string, string> = { 'HIGH': 'Alta', 'MEDIUM': 'Media', 'LOW': 'Baja' };
      return map[p] || p;
    };

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head><meta charset="utf-8"><meta name="color-scheme" content="dark only">
      <style>body{margin:0;padding:0;background:#000;font-family:'Inter',sans-serif;color:#f8fafc;}
      .container{max-width:600px;margin:0 auto;background:#18181b;border-radius:16px;border:1px solid #27272a;}
      .accent-bar{height:4px;background:#ef4444;}.header{padding:32px 40px;border-bottom:1px solid #27272a;}
      .brand{color:#ef4444;font-weight:800;font-size:11px;letter-spacing:2px;text-transform:uppercase;}
      .title{color:#f8fafc;font-size:20px;font-weight:700;}
      .content{padding:40px;}.operator-section{margin-bottom:40px;}
      .operator-name{color:#f8fafc;font-size:15px;font-weight:700;border-bottom:1px solid #27272a;padding-bottom:8px;}
      .task-row{padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.03);}
      .task-title{font-size:14px;font-weight:600;color:#f8fafc;}
      .task-meta{font-size:12px;color:#94a3b8;margin-top:6px;}
      .priority-tag{color:#ef4444;font-weight:600;}
      .footer{padding:32px 40px;background:#121214;border-top:1px solid #27272a;text-align:center;}
      .footer-text{font-size:11px;color:#94a3b8;}
      </style></head>
      <body>
      <div class="container">
      <div class="accent-bar"></div>
      <div class="header"><span class="brand">CONTROL MASTER</span><h1 class="title">Resumen de Incumplimiento Diario</h1><p style="color:#94a3b8;">${dateStr}</p></div>
      <div class="content"><p style="color:#94a3b8;">Las siguientes tareas programadas no fueron marcadas como completadas:</p>`;

    userMap.forEach((tasks: any[], userName: string) => {
      htmlContent += `<div class="operator-section"><h2 class="operator-name">${userName}</h2>`;
      tasks.forEach((t: any) => {
        htmlContent += `<div class="task-row"><div class="task-title">${t.title}</div><div class="task-meta">Prioridad: <span class="priority-tag">${getPriorityLabel(t.priority)}</span>${t.deadline ? ` • Hora: ${t.deadline}` : ''}</div></div>`;
      });
      htmlContent += `</div>`;
    });

    htmlContent += `</div><div class="footer"><p class="footer-text">Reporte generado automáticamente<br/>© ${new Date().getFullYear()} Enlace - Control Master</p></div></div></body></html>`;

    await sendEmail({
      to: adminEmail,
      subject: `Reporte de Tareas Incompletas - ${dateStr}`,
      html: htmlContent
    });

    return NextResponse.json({ success: true, incompleteCount: incompleteTasks.length });

  } catch (error) {
    console.error('[Cron Summary] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
