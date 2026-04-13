/**
 * Manual reminder endpoint for sending shift reminders on demand
 * Called from dashboard UI
 */

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';
import { sendWhatsApp } from '@/lib/whatsapp';
import { validateApiAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { userId, method } = body; // method: 'whatsapp' | 'email' | 'both'

    if (!userId || !method) {
      return NextResponse.json(
        { error: 'userId y method son requeridos' },
        { status: 400 }
      );
    }

    // Get the target user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'Operador no encontrado' }, { status: 404 });
    }

    // Calculate target date (2 days from now)
    const crTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" });
    const todayCR = new Date(crTimeStr);
    const targetDate = addDays(todayCR, 2);
    const formattedDate = format(targetDate, "EEEE d 'de' MMMM", { locale: es });

    // Determine shift type
    const baseScheduleData = await prisma.weeklySchedule.findMany({
      include: { user: true }
    });

    const baseScheduleMap = baseScheduleData.reduce((acc: any, curr: any) => {
      if (curr.user) acc[curr.dayOfWeek.toString()] = curr.user.name;
      return acc;
    }, {});

    const overridesData = await prisma.workSchedule.findMany({
      where: {
        date: { gte: addDays(targetDate, -3), lte: addDays(targetDate, 3) },
        isOverride: true
      },
      include: { user: true }
    });

    const overridesMap = overridesData.reduce((acc: any, curr: any) => {
      acc[curr.date.toISOString().split('T')[0]] = curr.user.name;
      return acc;
    }, {});

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

    // Send WhatsApp
    if ((method === 'whatsapp' || method === 'both') && user.phone) {
      const whatsappMessage = `*Recordatorio de Pauta Bitcentral*

Hola ${user.name.split(' ')[0]},

${senderName} te envía este recordatorio:

Fecha: *${formattedDate}*
Modalidad: ${tipoDeTurno}

Por favor, asegúrate de segmentar los programas con tiempo.

_Control Master - Enlace_`;

      try {
        const waResult = await sendWhatsApp(user.phone, whatsappMessage);
        results.whatsapp = waResult.success ? 'sent' : 'failed';
      } catch (err) {
        console.error('[Manual Reminder] WhatsApp error:', err);
        results.whatsapp = 'error';
      }
    }

    // Send Email
    if (method === 'email' || method === 'both') {
      const emailHtml = `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; color: #333333;">
          <div style="background-color: #0f172a; padding: 20px; text-align: left; border-top-left-radius: 6px; border-top-right-radius: 6px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: normal;">Control Master</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #111111; margin-top: 0; font-size: 18px;">Recordatorio de Pauta Bitcentral</h2>
            <p style="font-size: 14px; line-height: 1.6;">
              Estimado/a <strong>${user.name.split(' ')[0]}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6;">
              <strong>${senderName}</strong> te envía este recordatorio para indicarte que te encuentras asignado(a) a la programación de la Pauta Bitcentral.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0;">
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; width: 30%;">Fecha asignada:</td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; font-weight: bold; color: #0f172a;">${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; font-size: 14px; color: #64748b;">Modalidad de turno:</td>
                <td style="padding: 12px 15px; font-size: 14px; font-weight: bold; color: #0f172a;">${tipoDeTurno}</td>
              </tr>
            </table>

            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
              Por favor, asegúrese de segmentar los programas con tiempo y anotar si hay un programa faltante que no haya estado anotado.
            </p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding: 15px 30px; text-align: left; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;">
            Este es un mensaje automático generado por el sistema de Gestión de Turnos de Enlace.
          </div>
        </div>
      `;

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
        console.error('[Manual Reminder] Resend error:', resendError);

        // Fallback to Nodemailer
        try {
          const transporter = nodemailer.createTransport({
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.SMTP_EMAIL,
              pass: process.env.SMTP_PASSWORD
            },
            tls: { ciphers: 'SSLv3', rejectUnauthorized: false }
          });

          await transporter.sendMail({
            from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
            to: user.email,
            subject: `Recordatorio: Turno de Pauta Bitcentral (${formattedDate})`,
            html: emailHtml,
          });

          results.email = 'sent';
        } catch (nodemailerError) {
          console.error('[Manual Reminder] Nodemailer error:', nodemailerError);
          results.email = 'error';
        }
      }
    }

    return NextResponse.json({
      success: true,
      operator: user.name,
      date: formattedDate,
      results,
    });

  } catch (err: unknown) {
    console.error("[Manual Reminder] Exception:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
