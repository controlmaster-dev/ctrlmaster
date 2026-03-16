import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { emailRateLimiter } from '@/lib/rateLimit';
import prisma from '@/lib/prisma';

export async function POST(req) {
  let reportId = "";
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) throw new Error('No se envió el archivo PDF');

    const buffer = Buffer.from(await file.arrayBuffer());
    reportId = formData.get('reportId');
    const operatorName = formData.get('operatorName');
    const operatorEmail = formData.get('operatorEmail');
    const category = formData.get('category');
    const priority = formData.get('priority');
    const status = formData.get('status');


    const limitCheck = emailRateLimiter.tryConsume(operatorEmail);
    if (!limitCheck.success) {
      console.warn(`⚠️ Rate limit exceeded for ${operatorEmail}. Retry after ${limitCheck.retryAfter}s`);
      return NextResponse.json(
        { success: false, error: `Demasiados intentos. Por favor espera ${limitCheck.retryAfter} segundos antes de enviar otro correo.` },
        { status: 429 }
      );
    }

    console.log('📨 Iniciando envío de reporte por correo (Resend)...');

    const shortReportId = reportId.slice(0, 8).toUpperCase();


    const categoryMap = {
      transmision: "Transmisión",
      audio: "Audio",
      video: "Video",
      equipos: "Equipos",
      software: "Software",
      infraestructura: "Infraestructura",
      otros: "Otros"
    };

    const statusMap = {
      'resolved': 'Resuelto',
      'pending': 'Pendiente',
      'in-progress': 'En Progreso'
    };



    const categoryList = category.split(',').map((c) => c.trim());
    const formattedCategories = categoryList.map((c) => {
      const mapped = categoryMap[c.toLowerCase()] || c;
      return `<span style="display:inline-block; background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:12px; font-size:12px; margin-right:4px; margin-bottom:4px; border:1px solid #e5e7eb;">${mapped}</span>`;
    }).join("");
    const formattedStatus = statusMap[status] || status;



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




    try {
      console.log('🚀 Intentando enviar vía Resend...');


      const { Resend } = await import('resend');

      if (!process.env.RESEND_API_KEY) throw new Error("No RESEND_API_KEY found");

      const resend = new Resend(process.env.RESEND_API_KEY);

      const recipientsJson = formData.get('recipients');
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
          content: buffer
        }]

      });

      if (data.error) {
        throw new Error(data.error.message);
      }

      console.log('✅ Correo enviado con ÉXITO vía Resend:', data.data?.id);


      await prisma.report.update({
        where: { id: reportId },
        data: {
          // @ts-ignore
          emailStatus: 'sent'
        }
      });

      return NextResponse.json({ success: true, messageId: data.data?.id, provider: 'resend' });

    } catch (resendError) {
      console.warn('⚠️ Falló el envío con Resend. Detalles:', resendError);
      console.warn('Iniciando protocolo de respaldo (Nodemailer)...');

    }




    console.log('🛡️ Usando sistema de respaldo (SMTP Office 365)...');



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

    const recipientsJson2 = formData.get('recipients');
    let toAddress = 'rjimenez@enlace.org, ingenieria@enlace.org';

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
      to: toAddress,
      replyTo: operatorEmail,
      subject: `Reporte - #${shortReportId}`,
      html: htmlContent,
      attachments: [
      {
        filename: `reporte_${reportId}.pdf`,
        content: buffer
      }]

    });




    console.log('✅ Correo enviado con éxito vía Nodemailer:', info.messageId);


    await prisma.report.update({
      where: { id: reportId },
      data: {
        // @ts-ignore
        emailStatus: 'sent'
      }
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('❌ Error enviando correo vía Nodemailer:', error);


    if (reportId) {
      await prisma.report.update({
        where: { id: reportId },
        data: {
          // @ts-ignore
          emailStatus: 'error'
        }
      });
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}