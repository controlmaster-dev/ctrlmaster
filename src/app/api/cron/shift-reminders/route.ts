import { NextRequest, NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/api/errorResponse';
import sql from '@/lib/db';
import { sendTransactionalEmail } from '@/lib/emailDelivery';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';
import { validateApiAuth, requireRole, requireCronAuth } from '@/lib/apiAuth';
import { renderShiftReminderEmail } from '@/lib/emailTemplates';

export const dynamic = 'force-dynamic';

interface ScheduleUser {
  id: string;
  name: string;
}

interface ScheduleRow {
  dayOfWeek: number;
  date: Date;
  user?: ScheduleUser | null;
}

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

    const baseScheduleMap = (baseScheduleData as unknown as ScheduleRow[]).reduce<Record<string, string>>((acc, curr) => {
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

    const overridesMap = (overridesData as unknown as ScheduleRow[]).reduce<Record<string, string>>((acc, curr) => {
      if (curr.user) acc[curr.date.toISOString().split('T')[0]] = curr.user.name;
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

    const dateTitle =
      formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    const emailHtml = renderShiftReminderEmail({
      firstName: info.name.split(" ")[0] || info.name,
      formattedDate: dateTitle,
      shiftType: tipoDeTurno,
    });

    const subject = `Recordatorio de pauta — ${dateTitle}`;

    const sent = await sendTransactionalEmail({
      to: recipient,
      subject,
      html: emailHtml,
    });

    if (!sent.success) {
      return NextResponse.json(
        { success: false, error: sent.error ?? 'No se pudo enviar el correo' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: sent.provider,
      messageId: sent.messageId,
      operator: info.name,
      sentTo: recipient,
      date: formattedDate,
    });

  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
