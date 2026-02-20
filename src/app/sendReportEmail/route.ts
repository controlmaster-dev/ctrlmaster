import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { emailRateLimiter } from '@/lib/rateLimit'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  let reportId = ""
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) throw new Error('No se envió el archivo PDF')

    const buffer = Buffer.from(await file.arrayBuffer())
    reportId = formData.get('reportId') as string
    const operatorName = formData.get('operatorName') as string
    const operatorEmail = formData.get('operatorEmail') as string
    const category = formData.get('category') as string
    const priority = formData.get('priority') as string
    const status = formData.get('status') as string

    // Rate Limiting Check
    const limitCheck = emailRateLimiter.tryConsume(operatorEmail);
    if (!limitCheck.success) {
      console.warn(`⚠️ Rate limit exceeded for ${operatorEmail}. Retry after ${limitCheck.retryAfter}s`);
      return NextResponse.json(
        { success: false, error: `Demasiados intentos. Por favor espera ${limitCheck.retryAfter} segundos antes de enviar otro correo.` },
        { status: 429 }
      );
    }

    console.log('📨 Iniciando envío de reporte por correo (Resend)...')

    const shortReportId = reportId.slice(0, 8).toUpperCase();

    // Mapeos para formato legible
    const categoryMap: { [key: string]: string } = {
      transmision: "Transmisión",
      audio: "Audio",
      video: "Video",
      equipos: "Equipos",
      software: "Software",
      infraestructura: "Infraestructura",
      otros: "Otros"
    };

    const statusMap: { [key: string]: string } = {
      'resolved': 'Resuelto',
      'pending': 'Pendiente',
      'in-progress': 'En Progreso'
    };

    // Preparar valores formateados
    // Parse categories (handle multiple)
    const categoryList = category.split(',').map(c => c.trim());
    const formattedCategories = categoryList.map(c => {
      const mapped = categoryMap[c.toLowerCase()] || c;
      return `<span style="display:inline-block; background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:12px; font-size:12px; margin-right:4px; margin-bottom:4px; border:1px solid #e5e7eb;">${mapped}</span>`;
    }).join("");
    const formattedStatus = statusMap[status] || status;


    // Template HTML Professional Standard (No Emojis, No Dark Mode Hacks)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte de Incidencia</title>
        <style>
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            background-color: #ffffff; 
            margin: 0; 
            padding: 40px 20px; 
            color: #111111;
            line-height: 1.5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
          }
          .header {
            padding-bottom: 20px;
            border-bottom: 2px solid #FF0C60;
            margin-bottom: 30px;
          }
          .brand {
            font-size: 14px;
            font-weight: bold;
            color: #FF0C60;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          h1 {
            font-size: 22px;
            margin: 10px 0 0 0;
            color: #111111;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .info-table td {
            padding: 12px 0;
            border-bottom: 1px solid #eeeeee;
            vertical-align: top;
          }
          .label {
            width: 140px;
            font-size: 12px;
            color: #666666;
            font-weight: bold;
            text-transform: uppercase;
          }
          .value {
            font-size: 14px;
            color: #111111;
          }
          .attachment-box {
            background-color: #f9f9f9;
            border: 1px solid #eeeeee;
            padding: 15px;
            font-size: 13px;
            color: #444444;
            margin-bottom: 30px;
          }
          .footer {
            font-size: 11px;
            color: #888888;
            border-top: 1px solid #eeeeee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">Control Master</div>
            <h1>Reporte generado</h1>
          </div>

          <p style="margin-bottom: 30px;">
            Un operador ha generado un reporte. Detalles a continuación:
          </p>

          <table class="info-table">
            <tr>
              <td class="label">ID del reporte</td>
              <td class="value">#${shortReportId}</td>
            </tr>
            <tr>
              <td class="label">Operador</td>
              <td class="value">
                ${operatorName}<br>
                <span style="color: #666666; font-size: 12px;">${operatorEmail}</span>
              </td>
            </tr>
            <tr>
              <td class="label">Categoría</td>
              <td class="value">${formattedCategories}</td>
            </tr>
            <tr>
              <td class="label">Canal afectado</td>
              <td class="value" style="text-transform: capitalize;">${priority}</td>
            </tr>
            <tr>
              <td class="label">Estado</td>
              <td class="value" style="text-transform: capitalize; font-weight: bold;">${formattedStatus}</td>
            </tr>
          </table>

          <div class="attachment-box">
            <strong>Documentación Adjunta:</strong><br>
            El archivo PDF con el reporte completo se encuentra adjunto a este correo.
          </div>

          <div class="footer">
            &copy; ${new Date().getFullYear()} Enlace - Control Master<br>
            Este mensaje fue generado automáticamente.
          </div>
        </div>
      </body>
      </html>
    `;

    // ---------------------------------------------------------
    // INTENTO 1: RESEND (Prioridad)
    // ---------------------------------------------------------
    try {
      console.log('🚀 Intentando enviar vía Resend...')

      // Dynamic import to avoid issues if dependency is missing, though checked package.json
      const { Resend } = await import('resend')

      if (!process.env.RESEND_API_KEY) throw new Error("No RESEND_API_KEY found")

      const resend = new Resend(process.env.RESEND_API_KEY)

      const recipientsJson = formData.get('recipients') as string;
      let toAddresses = ['rjimenez@enlace.org', 'ingenieria@enlace.org'];

      if (recipientsJson) {
        try {
          const parsed = JSON.parse(recipientsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            toAddresses = parsed;
          }
        } catch (e) {
          console.error("Error parsing recipients for Resend", e);
        }
      }
      const data = await resend.emails.send({
        from: 'Control Master <alertas@enlacecr.dev>',
        to: toAddresses,
        subject: `Reporte - #${shortReportId}`,
        html: htmlContent,
        attachments: [
          {
            filename: `reporte_${reportId}.pdf`,
            content: buffer,
          },
        ],
      })

      if (data.error) {
        throw new Error(data.error.message)
      }

      console.log('✅ Correo enviado con ÉXITO vía Resend:', data.data?.id)

      // Update Report Status
      await prisma.report.update({
        where: { id: reportId },
        data: {
          // @ts-ignore
          emailStatus: 'sent'
        }
      })

      return NextResponse.json({ success: true, messageId: data.data?.id, provider: 'resend' })

    } catch (resendError) {
      console.warn('⚠️ Falló el envío con Resend. Detalles:', resendError)
      console.warn('Iniciando protocolo de respaldo (Nodemailer)...')
      // No retornamos, dejamos que el código siga hacia abajo (Nodemailer)
    }

    // ---------------------------------------------------------
    // INTENTO 2: NODEMAILER (Respaldo)
    // ---------------------------------------------------------
    console.log('🛡️ Usando sistema de respaldo (SMTP Office 365)...')

    // Configurar transporter de Nodemailer (Office 365)
    // ... (sigue el código original)
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_EMAIL, // Debe ser knunez@enlace.org
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    })

    const recipientsJson2 = formData.get('recipients') as string;
    let toAddress = 'rjimenez@enlace.org, ingenieria@enlace.org'; // Default

    if (recipientsJson2) {
      try {
        const recipients = JSON.parse(recipientsJson2);
        if (Array.isArray(recipients) && recipients.length > 0) {
          toAddress = recipients.join(', ');
        }
      } catch (e) {
        console.error("Error parsing recipients", e);
      }
    }

    const info = await transporter.sendMail({
      from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
      to: toAddress, // Dynamic recipients
      replyTo: operatorEmail, // Responder al operador
      subject: `Reporte - #${shortReportId}`,
      html: htmlContent,
      attachments: [
        {
          filename: `reporte_${reportId}.pdf`,
          content: buffer,
        },
      ],
    })


    // if (error) logic removed since sendMail throws on error or returns info

    console.log('✅ Correo enviado con éxito vía Nodemailer:', info.messageId)

    // Update Report Status
    await prisma.report.update({
      where: { id: reportId },
      data: {
        // @ts-ignore
        emailStatus: 'sent'
      }
    })

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('❌ Error enviando correo vía Nodemailer:', error)

    // Update Report Status to Error
    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          // @ts-ignore
          emailStatus: 'error'
        }
      })
    }

    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
