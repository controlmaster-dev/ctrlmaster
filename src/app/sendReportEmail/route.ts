import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { emailRateLimiter } from '@/lib/rateLimit'


export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) throw new Error('No se envió el archivo PDF')

    const buffer = Buffer.from(await file.arrayBuffer())
    const reportId = formData.get('reportId') as string
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

    // Configuración de colores Premium Dark
    const COLORS = {
      primary: '#FF0C60',
      background: '#09090b',
      card: '#18181b',
      border: '#27272a',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      white: '#FFFFFF'
    };

    // Template HTML Premium Dark (Mobile Optimized)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark only">
        <meta name="supported-color-schemes" content="dark only">
        <style>
          :root { color-scheme: dark only; supported-color-schemes: dark only; }
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: ${COLORS.background} !important; margin: 0; padding: 0; color: ${COLORS.text}; -webkit-font-smoothing: antialiased; }
          .container { max-width: 600px; margin: 0 auto; background: ${COLORS.card} !important; border: 1px solid ${COLORS.border}; border-radius: 16px; overflow: hidden; }
          .accent-bar { height: 4px; background: ${COLORS.primary}; }
          .header { padding: 32px 40px; text-align: left; border-bottom: 1px solid ${COLORS.border}; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: ${COLORS.text}; letter-spacing: -0.5px; }
          .header .brand { color: ${COLORS.primary}; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; display: block; }
          .content { padding: 40px; }
          .data-grid { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
          .data-row td { padding: 12px 0; border-bottom: 1px solid ${COLORS.border}; }
          .label { color: ${COLORS.textMuted}; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; width: 120px; }
          .value { color: ${COLORS.text}; font-size: 14px; font-weight: 500; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(255, 12, 96, 0.1); color: ${COLORS.primary}; border: 1px solid rgba(255, 12, 96, 0.2); font-size: 12px; font-weight: 600; text-transform: capitalize; }
          .footer { padding: 32px 40px; background: #121214; text-align: center; border-top: 1px solid ${COLORS.border}; }
          .footer p { color: ${COLORS.textMuted}; font-size: 11px; margin: 4px 0; }
          .attachment-info { background: rgba(255,255,255,0.03); border: 1px dashed ${COLORS.border}; border-radius: 12px; padding: 20px; text-align: center; margin-top: 24px; }
          
          @media only screen and (max-width: 600px) {
            .container { margin: 0 !important; border-radius: 0 !important; border: none !important; width: 100% !important; max-width: 100% !important; }
            .content, .header, .footer { padding: 24px !important; }
            .label { width: 100px !important; }
          }
        </style>
      </head>
      <body bgcolor="${COLORS.background}">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="${COLORS.background}" style="table-layout: fixed;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <div class="container" bgcolor="${COLORS.card}">
                <div class="accent-bar"></div>
                <div class="header">
                  <span class="brand">Control Master</span>
                  <h1>Reporte de Incidencia</h1>
                </div>
                
                <div class="content">
                  <p style="margin-bottom: 32px; font-size: 14px; line-height: 1.6; color: ${COLORS.textMuted}; text-align: left;">
                    Se ha generado un nuevo reporte en el sistema de monitoreo. A continuación los detalles técnicos procesados.
                  </p>
                  
                  <table class="data-grid" width="100%">
                    <tr class="data-row">
                      <td class="label">ID Reporte</td>
                      <td class="value" style="font-family: monospace;">#${shortReportId}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="label">Operador</td>
                      <td class="value">
                        ${operatorName}<br>
                        <span style="font-size: 12px; color: ${COLORS.textMuted}; font-weight: 400;">${operatorEmail}</span>
                      </td>
                    </tr>
                    <tr class="data-row">
                      <td class="label">Categoría</td>
                      <td class="value">${formattedCategories}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="label">Canal</td>
                      <td class="value">${priority}</td>
                    </tr>
                    <tr class="data-row" style="border-bottom: none;">
                      <td class="label" style="padding-top: 20px;">Estado</td>
                      <td class="value" style="padding-top: 20px;">
                        <span class="status-badge">${formattedStatus}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <div class="attachment-info" bgcolor="rgba(255,255,255,0.03)">
                    <p style="color: ${COLORS.text}; font-size: 13px; margin: 0; font-weight: 600;">Documentación PDF Adjunta</p>
                    <p style="color: ${COLORS.textMuted}; font-size: 12px; margin: 4px 0 0 0;">El reporte completo se encuentra disponible en los archivos adjuntos.</p>
                  </div>
                </div>

                <div class="footer" bgcolor="#121214">
                  <p>&copy; ${new Date().getFullYear()} Enlace - Control Master</p>
                  <p style="font-size: 10px; opacity: 0.6;">Este es un mensaje automatizado generado por el sistema.</p>
                </div>
              </div>
            </td>
          </tr>
        </table>
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

    const recipientsJson = formData.get('recipients') as string;
    let toAddress = 'rjimenez@enlace.org, ingenieria@enlace.org'; // Default

    if (recipientsJson) {
      try {
        const recipients = JSON.parse(recipientsJson);
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
    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error('❌ Error enviando correo vía Nodemailer:', error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}
