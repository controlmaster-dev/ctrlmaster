import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { validateApiAuth, requireRole, requireCronAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const { emails } = body;
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json({ error: 'Invalid emails array' }, { status: 400 });
    }

    return await generateAndSendReport(emails, 'CURRENT');
  } catch (error: unknown) {
    console.error('[Weekly Report] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const cronCheck = requireCronAuth(req);
  if (cronCheck) return cronCheck;

  return await generateAndSendReport(['knunez@enlace.org'], 'LAST');
}

async function generateAndSendReport(recipients: string[], mode: 'LAST' | 'CURRENT' = 'LAST') {
  try {
    console.log(`[Weekly Report] Starting... Mode: ${mode}`);

    const timeZone = 'America/Costa_Rica';
    const now = toZonedTime(new Date(), timeZone);

    let start: Date, end: Date;

    if (mode === 'LAST') {
      start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    } else {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    }

    const dateStartStr = format(start, 'yyyy-MM-dd');
    const dateEndStr = format(end, 'yyyy-MM-dd');

    console.log(`[Weekly Report] Range: ${dateStartStr} to ${dateEndStr}`);

    const operators = await sql`
      SELECT "id", "name", "email" FROM "User" WHERE "role" = 'OPERATOR'
    `;

    const tasks = await sql`
      SELECT * FROM "Task"
      WHERE "scheduledDate" >= ${dateStartStr}
        AND "scheduledDate" <= ${dateEndStr}
    `;

    const stats = operators.map((op: any) => {
      const userTasks = tasks.filter((t: any) => t.userId === op.id);
      const total = userTasks.length;
      const completed = userTasks.filter((t: any) => t.status === 'COMPLETED').length;
      const incomplete = userTasks.filter((t: any) => t.status === 'INCOMPLETE').length;
      const pending = userTasks.filter((t: any) => t.status === 'PENDING').length;
      const percentage = total > 0 ? Math.round(completed / total * 100) : 0;

      return { name: op.name, total, completed, incomplete, pending, percentage };
    });

    stats.sort((a, b) => b.percentage - a.percentage);

    const doc = new jsPDF();

    doc.setFontSize(24);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    doc.text("REPORTE DE RENDIMIENTO", 20, 30);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(format(now, "d 'de' MMMM 'de' yyyy", { locale: es }), 190, 30, { align: "right" });
    doc.setFontSize(12);
    doc.setTextColor(255, 12, 96);
    doc.text("INFORMACIÓN GENERAL", 20, 55);
    doc.line(20, 58, 190, 58);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "bold");
    doc.text("PERIODO", 20, 70);
    doc.text("TOTAL OPERADORES", 110, 70);
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.text(`${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}`, 20, 76);
    doc.text(`${operators.length}`, 110, 76);

    const bestPerformer = stats.length > 0 ? stats[0] : null;
    if (bestPerformer) {
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(20, 110, 170, 35, 3, 3, "F");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.setFont("helvetica", "bold");
      doc.text("MEJOR RENDIMIENTO SEMANAL:", 35, 122);
      doc.setFontSize(14);
      doc.setTextColor(255, 12, 96);
      doc.text(`${bestPerformer.name}`, 35, 132);
      doc.setFontSize(12);
      doc.text(`${bestPerformer.percentage}% Cumplimiento`, 110, 132);
    }

    doc.setFontSize(12);
    doc.setTextColor(255, 12, 96);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLE DEL EQUIPO", 20, 165);
    doc.line(20, 168, 190, 168);

    const tableData = stats.map((s) => [s.name, s.total, s.completed, s.incomplete, s.pending, `${s.percentage}%`]);

    autoTable(doc, {
      head: [['OPERADOR', 'TOTAL', 'COMPLETADAS', 'JUSTIFICADAS', 'PENDIENTES', 'RENDIMIENTO']],
      body: tableData,
      startY: 175,
      theme: 'plain',
      headStyles: { fillColor: [255, 255, 255], textColor: [100, 100, 100], fontStyle: 'bold', fontSize: 8, halign: 'left' },
      styles: { fontSize: 10, cellPadding: 5, textColor: [80, 80, 80], lineColor: [240, 240, 240], lineWidth: { bottom: 0.1 } },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, textColor: [50, 50, 50] }, 5: { fontStyle: 'bold', halign: 'right' } },
      didParseCell: function (data: any) {
        if (data.section === 'body' && data.column.index === 5) {
          const val = parseInt(String(data.cell.raw));
          if (val >= 80) data.cell.styles.textColor = [22, 163, 74];
          else if (val >= 50) data.cell.styles.textColor = [234, 179, 8];
          else data.cell.styles.textColor = [220, 38, 38];
        }
      }
    });

    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(255, 12, 96);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 20, 190, pageHeight - 20);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generado automáticamente por Sistema de Control Master", 20, pageHeight - 12);
    doc.text("CONFIDENCIAL", 190, pageHeight - 12, { align: "right" });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    await sendEmail({
      to: recipients,
      subject: `Reporte de Rendimiento: ${format(start, "d MMM")} - ${format(end, "d MMM")}`,
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>body{margin:0;padding:0;background:#f8fafc;font-family:'Inter',sans-serif;color:#334155;}.container{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;}.accent-bar{height:4px;background:#FF0C60;}.header{padding:32px 40px;border-bottom:1px solid #f1f5f9;}.brand{color:#FF0C60;font-weight:800;font-size:11px;letter-spacing:2px;text-transform:uppercase;}.title{color:#1e293b;font-size:22px;font-weight:700;}.content{padding:40px;}.date-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;margin-bottom:32px;}.footer{padding:32px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;}</style></head><body><div class="container"><div class="accent-bar"></div><div class="header"><span class="brand">Control Master</span><h1 class="title">Reporte de Rendimiento Semanal</h1></div><div class="content"><p>Hola,<br><br>Se ha generado el reporte consolidado de rendimiento correspondiente al periodo:</p><div class="date-box"><span>${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}</span></div><p>El documento PDF adjunto contiene el análisis detallado.</p></div><div class="footer"><p>Sistema de Control Master • Generado Automáticamente<br/>© ${new Date().getFullYear()} Enlace - Control Master</p></div></div></body></html>`,
      attachments: [{ filename: `Reporte_Semanal_${format(start, 'yyyy-MM-dd')}.pdf`, content: pdfBuffer }]
    });

    return NextResponse.json({ success: true, count: stats.length });

  } catch (error: unknown) {
    console.error('[Weekly Report] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
