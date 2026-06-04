import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errorResponse";
import { connectMongo } from "@/lib/mongo";
import { UserModel } from "@/models";
import { sendTransactionalEmail } from "@/lib/emailDelivery";
import { addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { getBitcentralUser } from "@/lib/schedule";
import { sendWhatsApp } from "@/lib/whatsapp";
import { validateApiAuth } from "@/lib/apiAuth";
import { renderShiftReminderEmail } from "@/lib/emailTemplates";
import {
  loadWeeklyScheduleNameMap,
  loadWorkScheduleOverrideMap,
} from "@/lib/scheduleMaps";

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { userId, method } = body;

    if (!userId || !method) {
      return NextResponse.json({ error: "userId y method son requeridos" }, { status: 400 });
    }

    await connectMongo();
    const user = await UserModel.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ error: "Operador no encontrado" }, { status: 404 });
    }

    const crTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" });
    const todayCR = new Date(crTimeStr);
    const targetDate = addDays(todayCR, 2);
    const formattedDate = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    const baseScheduleMap = await loadWeeklyScheduleNameMap();
    const overridesMap = await loadWorkScheduleOverrideMap(
      addDays(targetDate, -3).toISOString().split("T")[0],
      addDays(targetDate, 3).toISOString().split("T")[0]
    );

    const info = getBitcentralUser(targetDate, overridesMap, baseScheduleMap) as {
      name: string;
      isRotation: boolean;
      isOverride: boolean;
    };

    let tipoDeTurno = "Regular";
    if (info.isRotation) tipoDeTurno = "Rotativo";
    if (info.isOverride) tipoDeTurno = "Cambio Manual (Reemplazo)";

    const senderName = authResult.user.name || "Un operador";
    const results: { whatsapp?: string; email?: string } = {};

    if ((method === "whatsapp" || method === "both") && user.phone) {
      const firstName = user.name.split(" ")[0];
      const whatsappMessage = `Hola ${firstName}, ¿cómo estás? Te escribe ${senderName} para recordarte que tenés el turno de Pauta Bitcentral el ${formattedDate} (${tipoDeTurno.toLowerCase()}). Por fa acordate de segmentar y cuadrar los programas con tiempo. ¡Gracias!\n\nRevisá https://enlacecr.dev/ para verlo mejor.`;
      try {
        const waResult = await sendWhatsApp(user.phone, whatsappMessage);
        results.whatsapp = waResult.success ? "sent" : "failed";
      } catch {
        results.whatsapp = "error";
      }
    }

    if (method === "email" || method === "both") {
      const dateTitle = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
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
      results.email = sent.success ? "sent" : "error";
      if (!sent.success) {
        console.warn("[manual-reminder] Email failed:", sent.error);
      }
    }

    return NextResponse.json({
      success: true,
      operator: user.name,
      date: formattedDate,
      results,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err);
  }
}
