import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api/errorResponse';
import sql from '@/lib/db';
import { sendTransactionalEmail } from '@/lib/emailDelivery';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';
import { sendWhatsApp } from '@/lib/whatsapp';
import { validateApiAuth } from '@/lib/apiAuth';
import { renderShiftReminderEmail } from '@/lib/emailTemplates';

interface ScheduleUser {
  id: string;
  name: string;
}

interface ScheduleRow {
  dayOfWeek: number;
  date: Date;
  user?: ScheduleUser | null;
}

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

    const baseScheduleMap = (baseScheduleData as unknown as ScheduleRow[]).reduce<Record<string, string>>((acc, curr) => {
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

    const overridesMap = (overridesData as unknown as ScheduleRow[]).reduce<Record<string, string>>((acc, curr) => {
      if (curr.user) acc[curr.date.toISOString().split('T')[0]] = curr.user.name;
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
      const dateTitle =
        formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      const emailHtml = renderShiftReminderEmail({
        firstName: user.name.split(" ")[0] || user.name,
        formattedDate: dateTitle,
        shiftType: tipoDeTurno,
        senderLine: senderName,
      });

      const sent = await sendTransactionalEmail({
        to: user.email,
        subject: `Recordatorio de pauta — ${dateTitle}`,
        html: emailHtml,
      });
      results.email = sent.success ? 'sent' : 'error';
      if (!sent.success) {
        console.warn('[manual-reminder] Email failed:', sent.error);
      }
    }

    return NextResponse.json({ success: true, operator: user.name, date: formattedDate, results });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
