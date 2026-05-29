import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';
import { validateApiAuth, requireRole, requireCronAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testEmail = searchParams.get('email');
    const isTest = searchParams.get('test') === 'true';

    if (isTest) {

      const authResult = await validateApiAuth(req);
      if (authResult instanceof NextResponse) return authResult;
      const roleResult = requireRole(authResult.user, ['ADMIN', 'BOSS', 'ENGINEER']);
      if (roleResult instanceof NextResponse) return roleResult;
    } else {

      const cronCheck = requireCronAuth(req);
      if (cronCheck) return cronCheck;
    }

    const crTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" });
    const todayCR = new Date(crTimeStr);
    const targetDate = addDays(todayCR, 2);

    const baseScheduleData = await sql`
      SELECT ws.*, json_build_object('id', u."id", 'name', u."name") AS "user"
      FROM "WeeklySchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
    `;

    const baseScheduleMap = baseScheduleData.reduce((acc: any, curr: any) => {
      if (curr.user) acc[curr.dayOfWeek.toString()] = curr.user.name;
      return acc;
    }, {});

    const startRange = addDays(targetDate, -3);
    const endRange = addDays(targetDate, 3);

    const overridesData = await sql`
      SELECT ws.*, json_build_object('id', u."id", 'name', u."name") AS "user"
      FROM "WorkSchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
      WHERE ws."date" >= ${startRange.toISOString().split('T')[0]}::date
        AND ws."date" <= ${endRange.toISOString().split('T')[0]}::date
        AND ws."isOverride" = TRUE
    `;

    const overridesMap = overridesData.reduce((acc: any, curr: any) => {
      acc[curr.date.toISOString().split('T')[0]] = curr.user.name;
      return acc;
    }, {});

    const info = getBitcentralUser(targetDate, overridesMap, baseScheduleMap) as {
      name: string; isRotation: boolean; isOverride: boolean;
    };

    console.log(`[Shift Reminders] Target Date: ${targetDate.toISOString().split('T')[0]}, Assigned: ${info.name}`);

    if (info.name === "N/A" || !info.name) {
      return NextResponse.json({ message: 'No operator assigned for this date, skipping email.' });
    }

    const [user] = await sql`
      SELECT * FROM "User" WHERE "name" = ${info.name} LIMIT 1
    `;

    if (!user || (!user.email && !user.phone && !isTest)) {
      return NextResponse.json({ message: `No contact info found for operator ${info.name}` });
    }

    const operatorEmail = user.email || "";
    const recipient = isTest && testEmail ? testEmail : operatorEmail;
    const formattedDate = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    let tipoDeTurno = "Regular";
    if (info.isRotation) tipoDeTurno = "Rotativo";
    if (info.isOverride) tipoDeTurno = "Cambio Manual (Reemplazo)";

    let whatsappStatus = "Not attempted";
    if (user.phone) {
      try {
        const firstName = info.name.split(' ')[0];
        const waMessage = `Hola ${firstName}, ¿cómo estás? Te escribo para recordarte que tenés el turno de Pauta Bitcentral el ${formattedDate} (${tipoDeTurno.toLowerCase()}). Por fa acordate de segmentar y cuadrar los programas con tiempo. ¡Gracias!\n\nRevisá https://enlacecr.dev/ para verlo mejor.`;

        const waApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001';
        const waRes = await fetch(`${waApiUrl}/api/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-API-Key': process.env.WHATSAPP_API_KEY || '' },
          body: JSON.stringify({
            phone: user.phone,
            message: waMessage
          })
        });
        whatsappStatus = waRes.ok ? "Sent" : `Error: ${waRes.status}`;
      } catch (err) {
        whatsappStatus = "Exception";
      }
    }

    if (!recipient) {
      return NextResponse.json({ success: true, operator: info.name, whatsappParams: { sent: whatsappStatus, phone: user.phone } });
    }

    const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#333;"><div style="background:#0f172a;padding:20px;border-radius:6px 6px 0 0;"><h1 style="color:#fff;margin:0;font-size:18px;">Control Master</h1></div><div style="padding:30px;"><h2 style="color:#111;font-size:18px;">Recordatorio de Pauta Bitcentral</h2><p>Estimado/a <strong>${info.name.split(' ')[0]}</strong>,</p><p>Este correo es una notificación automática del sistema para recordarle que se encuentra asignado(a) a la programación de la Pauta Bitcentral dentro de 2 días.</p><table style="width:100%;border-collapse:collapse;margin:25px 0;background:#f8fafc;border:1px solid #e2e8f0;"><tr><td style="padding:12px 15px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Fecha asignada:</td><td style="padding:12px 15px;font-size:14px;font-weight:bold;color:#0f172a;">${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</td></tr><tr><td style="padding:12px 15px;font-size:14px;color:#64748b;">Modalidad:</td><td style="padding:12px 15px;font-size:14px;font-weight:bold;color:#0f172a;">${tipoDeTurno}</td></tr></table><p>Por favor, asegúrese de segmentar los programas con tiempo.</p></div><div style="border-top:1px solid #e2e8f0;padding:15px 30px;font-size:12px;color:#94a3b8;background:#f8fafc;border-radius:0 0 6px 6px;">Este es un mensaje automático generado por el sistema de Gestión de Turnos de Enlace.</div></div>`;

    const subject = `Recordatorio: Turno de Pauta Mañana (${formattedDate})`;

    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'Control Master <alertas@enlacecr.dev>',
        to: [recipient],
        subject,
        html: emailHtml,
      });
      if (data.error) throw new Error(data.error.message);
      return NextResponse.json({ success: true, provider: 'resend', operator: info.name, sentTo: recipient, date: formattedDate });
    } catch (resendError) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com', port: 587, secure: false,
        auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
        tls: { minVersion: 'TLSv1.2' }
      });
      const infoMail = await transporter.sendMail({
        from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
        to: recipient,
        subject,
        html: emailHtml,
      });
      return NextResponse.json({ success: true, provider: 'nodemailer', messageId: infoMail.messageId, operator: info.name, date: formattedDate });
    }

  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
