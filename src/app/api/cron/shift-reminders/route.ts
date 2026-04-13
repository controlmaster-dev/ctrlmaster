import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getBitcentralUser } from '@/lib/schedule';

export const dynamic = 'force-dynamic';

// Force Vercel rebuild to pick up new vercel.json cron schedule 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const testEmail = searchParams.get('email');
    const isTest = searchParams.get('test') === 'true';

    // Vercel Crons sends a Bearer token in the Authorization header
    // If CRON_SECRET is not set, allow all requests (development mode)
    if (process.env.CRON_SECRET) {
      const authHeader = req.headers.get('authorization');
      if (!isTest && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Calcular la fecha objetivo usando zona horaria de Costa Rica para evitar bugs en servidores UTC
    const crTimeStr = new Date().toLocaleString("en-US", { timeZone: "America/Costa_Rica" });
    const todayCR = new Date(crTimeStr);
    const targetDate = addDays(todayCR, 2);
    
    // 1. Obtener Base Schedule de la semana
    const baseScheduleData = await prisma.weeklySchedule.findMany({
      include: { user: true }
    });
    
    // Convertir el schedule base al formato que espera getBitcentralUser
    const baseScheduleMap = baseScheduleData.reduce((acc: any, curr: any) => {
      if (curr.user) {
        acc[curr.dayOfWeek.toString()] = curr.user.name;
      }
      return acc;
    }, {});

    // Configurar el rango con varios días de holgura para evitar que la zona horaria oculte el registro
    const startRange = addDays(targetDate, -3);
    const endRange = addDays(targetDate, 3);

    // 2. Obtener Sobre-escrituras (Cambios manuales) para la fecha objetivo
    const overridesData = await prisma.workSchedule.findMany({
      where: {
        date: {
          gte: startRange,
          lte: endRange
        },
        isOverride: true
      },
      include: { user: true }
    });

    const overridesMap = overridesData.reduce((acc: any, curr: any) => {
      const dateKey = curr.date.toISOString().split('T')[0];
      acc[dateKey] = curr.user.name;
      return acc;
    }, {});
    
    // Obtener información del usuario en turno ejecutando la regla lógica  
    const info = getBitcentralUser(targetDate, overridesMap, baseScheduleMap) as { name: string; isRotation: boolean; isOverride: boolean };

    console.log(`[Shift Reminders] Target Date: ${targetDate.toISOString().split('T')[0]}, Assigned Operator: ${info.name}`);

    // Si nadie está asignado, devolvemos success temprano
    if (info.name === "N/A" || !info.name) {
      return NextResponse.json({ message: 'No operator assigned for this date, skipping email.' });
    }

    // 3. Obtener el email del usuario de la BD
    const user = await prisma.user.findFirst({
      where: { name: info.name }
    });

    if (!user || (!user.email && !user.phone && !isTest)) {
      console.warn(`[Shift Reminders] User ${info.name} not found or no contact info setup.`);
      return NextResponse.json({ message: `No contact info found for operator ${info.name}` });
    }

    const operatorEmail = user.email || "";
    const recipient = isTest && testEmail ? testEmail : operatorEmail;

    // Fecha formateada (ej. Lunes 15 de Octubre)
    const formattedDate = format(targetDate, "EEEE d 'de' MMMM", { locale: es });
    
    let tipoDeTurno = "Regular";
    if (info.isRotation) tipoDeTurno = "Rotativo";
    if (info.isOverride) tipoDeTurno = "Cambio Manual (Reemplazo)";

    // HTML del Correo (diseño sobrio y profesional)
    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 6px; background-color: #ffffff; color: #333333;">
        <div style="background-color: #0f172a; padding: 20px; text-align: left; border-top-left-radius: 6px; border-top-right-radius: 6px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: normal;">Control Master</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #111111; margin-top: 0; font-size: 18px;">Recordatorio de Pauta Bitcentral</h2>
          <p style="font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${info.name.split(' ')[0]}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6;">
            Este correo es una notificación automática del sistema para recordarle que se encuentra asignado(a) a la programación de la Pauta Bitcentral dentro de 2 días.
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
          
          ${isTest ? `<div style="padding: 15px; background-color: #f1f5f9; border-left: 3px solid #64748b; font-size: 12px; margin-bottom: 20px; color: #475569;"><strong>Aviso de Prueba del Sistema:</strong> Este es un envío de prueba dirigido temporalmente a ${testEmail}. El operador real detectado es ${info.name}.</div>` : ''}
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding: 15px 30px; text-align: left; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-bottom-left-radius: 6px; border-bottom-right-radius: 6px;">
          Este es un mensaje automático generado por el sistema de Gestión de Turnos de Enlace. Por favor, no responda a este correo.
        </div>
      </div>
    `;

    const subject = `Recordatorio: Turno de Pauta Mañana (${formattedDate})`;

    // 4. Enviar mensaje de WhatsApp (Si tiene número configurado)
    let whatsappStatus = "Not attempted";
    // Nota: Quitamos la restricción temporal de isTest para poder probar la API
    if (user.phone) {
      try {
        console.log(`[Shift Reminders] Intentando enviar WhatsApp a ${user.phone}...`);
        const whatsappMessage = 
`Hola ${info.name.split(' ')[0]}, te recordamos que tienes turno de Pauta Bitcentral:
Fecha: *${formattedDate}*
Modalidad: ${tipoDeTurno}

Por favor, asegúrate de segmentar los programas con tiempo.`;
        
        const waApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:3001';
        const waApiKey = process.env.WHATSAPP_API_KEY;
        const waRes = await fetch(`${waApiUrl}/api/send-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': waApiKey || '',
          },
          body: JSON.stringify({ phone: user.phone, message: whatsappMessage })
        });
        
        if (waRes.ok) {
          console.log('[OK] WhatsApp de recordatorio enviado con EXITO');
          whatsappStatus = "Sent";
        } else {
          console.warn('[WARN] Fallo de API WhatsApp. Status:', waRes.status);
          whatsappStatus = `Error: ${waRes.status}`;
        }
      } catch (err) {
        console.error('[ERROR] Error al enviar WhatsApp:', err);
        whatsappStatus = "Exception";
      }
    }

    // Si no hay correo al que enviar, devolvemos éxito temprano
    if (!recipient) {
       return NextResponse.json({ 
         success: true, 
         operator: info.name, 
         whatsappParams: { sent: whatsappStatus, phone: user.phone }
       });
    }

    // 5. Enviar usando Resend SDK con Fallback
    try {
      console.log(`[Shift Reminders] Intentando enviar vía Resend a ${recipient}...`);
      const { Resend } = await import('resend');
      
      if (!process.env.RESEND_API_KEY) throw new Error("No RESEND_API_KEY found");
      const resend = new Resend(process.env.RESEND_API_KEY);

      const data = await resend.emails.send({
        from: 'Control Master <alertas@enlacecr.dev>',
        to: [recipient as string],
        subject: subject,
        html: emailHtml,
      });

      if (data.error) {
        throw new Error(data.error.message);
      }

      console.log('✅ Correo de recordatorio enviado con ÉXITO vía Resend:', data.data?.id);
      
      return NextResponse.json({
        success: true,
        provider: 'resend',
        data: data.data,
        operator: info.name,
        sentTo: recipient,
        date: formattedDate,
        debug: isTest ? { targetDate: targetDate.toISOString(), overridesData } : undefined
      });

    } catch (resendError) {
      console.warn('⚠️ Falló el envío con Resend. Detalles:', resendError);
      console.warn('Iniciando protocolo de respaldo (Nodemailer)...');
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        },
        tls: {
          ciphers: 'SSLv3',
          rejectUnauthorized: false
        }
      });

      const infoMail = await transporter.sendMail({
        from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
        to: recipient as string,
        subject: subject,
        html: emailHtml,
      });

      console.log('✅ Correo enviado con éxito vía Nodemailer:', infoMail.messageId);

      return NextResponse.json({
        success: true,
        provider: 'nodemailer',
        messageId: infoMail.messageId,
        operator: info.name,
        sentTo: recipient,
        date: formattedDate
      });
    }

  } catch (err: unknown) {
    console.error("[Shift Reminders] Exception caught:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
