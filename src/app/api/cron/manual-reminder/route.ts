import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';
import { sendWhatsApp } from '@/lib/whatsapp';
import { validateApiAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { userId, method } = body;

    if (!userId || !method) {
      return NextResponse.json({ error: 'userId y method son requeridos' }, { status: 400 });
    }

    const [user] = await sql`SELECT * FROM "User" WHERE "id" = ${userId} LIMIT 1`;
    if (!user) {
      return NextResponse.json({ error: 'Operador no encontrado' }, { status: 404 });
    }

    const crTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" });
    const todayCR = new Date(crTimeStr);
    const targetDate = addDays(todayCR, 2);
    const formattedDate = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    const baseScheduleData = await sql`
      SELECT ws.*, json_build_object('id', u."id", 'name', u."name") AS "user"
      FROM "WeeklySchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
    `;

    const baseScheduleMap = baseScheduleData.reduce((acc: any, curr: any) => {
      if (curr.user) acc[curr.dayOfWeek.toString()] = curr.user.name;
      return acc;
    }, {});

    const overridesData = await sql`
      SELECT ws.*, json_build_object('id', u."id", 'name', u."name") AS "user"
      FROM "WorkSchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
      WHERE ws."date" >= ${addDays(targetDate, -3).toISOString().split('T')[0]}::date
        AND ws."date" <= ${addDays(targetDate, 3).toISOString().split('T')[0]}::date
        AND ws."isOverride" = TRUE
    `;

    const overridesMap = overridesData.reduce((acc: any, curr: any) => {
      acc[curr.date.toISOString().split('T')[0]] = curr.user.name;
      return acc;
    }, {});

    const info = getBitcentralUser(targetDate, overridesMap, baseScheduleMap) as {
      name: string; isRotation: boolean; isOverride: boolean;
    };

    let tipoDeTurno = "Regular";
    if (info.isRotation) tipoDeTurno = "Rotativo";
    if (info.isOverride) tipoDeTurno = "Cambio Manual (Reemplazo)";

    const senderName = authResult.user.name || "Un operador";
    const results: { whatsapp?: string; email?: string } = {};

    if ((method === 'whatsapp' || method === 'both') && user.phone) {
      const firstName = user.name.split(' ')[0];
      const whatsappMessage = `Hola ${firstName}, ¿cómo estás? Te escribe ${senderName} para recordarte que tenés el turno de Pauta Bitcentral el ${formattedDate} (${tipoDeTurno.toLowerCase()}). Por fa acordate de segmentar y cuadrar los programas con tiempo. ¡Gracias!\n\nRevisá https://enlacecr.dev/ para verlo mejor.`;
      try {
        const waResult = await sendWhatsApp(user.phone, whatsappMessage);
        results.whatsapp = waResult.success ? 'sent' : 'failed';
      } catch (err) {
        results.whatsapp = 'error';
      }
    }

    if (method === 'email' || method === 'both') {
      const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#333;"><div style="background:#0f172a;padding:20px;border-radius:6px 6px 0 0;"><h1 style="color:#fff;margin:0;font-size:18px;">Control Master</h1></div><div style="padding:30px;"><h2 style="color:#111;font-size:18px;">Recordatorio de Pauta Bitcentral</h2><p>Estimado/a <strong>${user.name.split(' ')[0]}</strong>,</p><p><strong>${senderName}</strong> te envía este recordatorio para indicarte que te encuentras asignado(a) a la programación de la Pauta Bitcentral.</p><table style="width:100%;border-collapse:collapse;margin:25px 0;background:#f8fafc;border:1px solid #e2e8f0;"><tr><td style="padding:12px 15px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Fecha asignada:</td><td style="padding:12px 15px;font-size:14px;font-weight:bold;color:#0f172a;">${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</td></tr><tr><td style="padding:12px 15px;font-size:14px;color:#64748b;">Modalidad de turno:</td><td style="padding:12px 15px;font-size:14px;font-weight:bold;color:#0f172a;">${tipoDeTurno}</td></tr></table><p>Por favor, asegúrese de segmentar los programas con tiempo.</p></div><div style="border-top:1px solid #e2e8f0;padding:15px 30px;font-size:12px;color:#94a3b8;background:#f8fafc;border-radius:0 0 6px 6px;">Este es un mensaje automático generado por el sistema de Gestión de Turnos de Enlace.</div></div>`;

      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'Control Master <alertas@enlacecr.dev>',
          to: [user.email],
          subject: `Recordatorio: Turno de Pauta Bitcentral (${formattedDate})`,
          html: emailHtml,
        });
        results.email = 'sent';
      } catch (resendError) {
        try {
          const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com', port: 587, secure: false,
            auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
            tls: { minVersion: 'TLSv1.2' }
          });
          await transporter.sendMail({
            from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
            to: user.email,
            subject: `Recordatorio: Turno de Pauta Bitcentral (${formattedDate})`,
            html: emailHtml,
          });
          results.email = 'sent';
        } catch (nodemailerError) {
          results.email = 'error';
        }
      }
    }

    return NextResponse.json({ success: true, operator: user.name, date: formattedDate, results });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
