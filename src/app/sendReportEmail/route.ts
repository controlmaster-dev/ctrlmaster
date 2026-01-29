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

    // Configuración de colores
    const COLORS = {
      primary: '#FF0C60',
      background: '#F4F4F7',
      text: '#333333',
      textLight: '#718096',
      white: '#FFFFFF',
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ECC94B',
      danger: '#F56565'
    };

    // Template HTML Premium
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${COLORS.background}; margin: 0; padding: 0; color: ${COLORS.text}; }
          /* Contenedor más ancho como solicitado (800px) */
          .container { max-width: 800px; margin: 40px auto; background: ${COLORS.white}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background-color: ${COLORS.primary}; padding: 30px 20px; text-align: center; }
          .header h1 { color: ${COLORS.white}; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; }
          .info-grid { width: 100%; border-collapse: separate; border-spacing: 0 12px; }
          .label { color: ${COLORS.textLight}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; width: 40%; vertical-align: top; padding-top: 4px; }
          .value { color: ${COLORS.text}; font-size: 16px; font-weight: 500; }
          .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; background-color: #FEF2F6; color: ${COLORS.primary}; font-weight: 600; font-size: 14px; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.border}; }
          .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
          
          @media only screen and (max-width: 600px) {
            .container { margin: 0; border-radius: 0; width: 100% !important; max-width: 100% !important; }
            .content { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Reporte de Incidencia</h1>
          </div>
          
          <!-- Content -->
          <div class="content">
            <p style="margin-bottom: 25px; font-size: 16px; line-height: 1.5;">
              Se ha generado un nuevo reporte en el sistema <strong>Control Master</strong>.
              A continuación se presentan los detalles principales.
            </p>
            
            <table class="info-grid">
              <tr>
                <td class="label">ID Reporte</td>
                <td class="value">#${shortReportId}</td>
              </tr>
              <tr>
                <td class="label">Operador</td>
                <td class="value">${operatorName}<br><span style="font-size: 13px; color: ${COLORS.textLight};">${operatorEmail}</span></td>
              </tr>
              <tr>
                <td class="label">Categoría</td>
                <td class="value">${formattedCategories}</td>
              </tr>
              <tr>
                <td class="label">Canal</td>
                <td class="value">${priority}</td>
              </tr>
              <tr>
                <td class="label">Estado Actual</td>
                <td class="value"><span class="status-badge">${formattedStatus}</span></td>
              </tr>
            </table>
            
            <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid ${COLORS.border}; text-align: center;">
              <p style="color: ${COLORS.textLight}; font-size: 14px; margin-bottom: 10px;">
                El documento PDF detallado se encuentra adjunto a este correo.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Este es un mensaje automático. Por favor no responder.</p>
            <p style="margin-top: 5px;">&copy; ${new Date().getFullYear()} Enlace - Control Master</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Configurar transporter de Nodemailer (Office 365)
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
