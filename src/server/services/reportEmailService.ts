import nodemailer from "nodemailer";
import sql from "@/lib/db";
import { emailRateLimiter } from "@/lib/rateLimit";
import { ValidationError } from "@/lib/errors";

const CATEGORY_MAP: Record<string, string> = {
  transmision: "Transmisión",
  audio: "Audio",
  video: "Video",
  equipos: "Equipos",
  software: "Software",
  infraestructura: "Infraestructura",
  otros: "Otros",
};

const STATUS_MAP: Record<string, string> = {
  resolved: "Resuelto",
  pending: "Pendiente",
  "in-progress": "En Progreso",
};

const DEFAULT_RECIPIENTS = ["rjimenez@enlace.org", "ingenieria@enlace.org"];

function buildReportEmailHtml(params: {
  shortReportId: string;
  operatorName: string;
  operatorEmail: string;
  formattedCategories: string;
  priority: string;
  formattedStatus: string;
}) {
  const { shortReportId, operatorName, operatorEmail, formattedCategories, priority, formattedStatus } =
    params;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Incidencia</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; background-color: #ffffff; margin: 0; padding: 40px 20px; color: #111111; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { padding-bottom: 20px; border-bottom: 2px solid #FF0C60; margin-bottom: 30px; }
        .brand { font-size: 14px; font-weight: bold; color: #FF0C60; text-transform: uppercase; letter-spacing: 1px; }
        h1 { font-size: 22px; margin: 10px 0 0 0; color: #111111; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .info-table td { padding: 12px 0; border-bottom: 1px solid #eeeeee; vertical-align: top; }
        .label { width: 140px; font-size: 12px; color: #666666; font-weight: bold; text-transform: uppercase; }
        .value { font-size: 14px; color: #111111; }
        .attachment-box { background-color: #f9f9f9; border: 1px solid #eeeeee; padding: 15px; font-size: 13px; color: #444444; margin-bottom: 30px; }
        .footer { font-size: 11px; color: #888888; border-top: 1px solid #eeeeee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">Control Master</div>
          <h1>Reporte generado</h1>
        </div>
        <p style="margin-bottom: 30px;">Un operador ha generado un reporte. Detalles a continuación:</p>
        <table class="info-table">
          <tr><td class="label">ID del reporte</td><td class="value">#${shortReportId}</td></tr>
          <tr><td class="label">Operador</td><td class="value">${operatorName}<br><span style="color: #666666; font-size: 12px;">${operatorEmail}</span></td></tr>
          <tr><td class="label">Categoría</td><td class="value">${formattedCategories}</td></tr>
          <tr><td class="label">Canal afectado</td><td class="value" style="text-transform: capitalize;">${priority}</td></tr>
          <tr><td class="label">Estado</td><td class="value" style="text-transform: capitalize; font-weight: bold;">${formattedStatus}</td></tr>
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
}

function parseRecipients(json: string | null): string[] {
  if (!json) return DEFAULT_RECIPIENTS;
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as string[];
  } catch (e) {
    console.error("Error parsing recipients", e);
  }
  return DEFAULT_RECIPIENTS;
}

async function markEmailStatus(reportId: string, status: "sent" | "failed") {
  if (!reportId) return;
  await sql`UPDATE "Report" SET "emailStatus" = ${status} WHERE "id" = ${reportId}`;
}

export type SendReportEmailResult = {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  retryAfter?: number;
  statusCode?: number;
};

export async function sendReportEmailFromForm(
  formData: FormData
): Promise<SendReportEmailResult> {
  const file = formData.get("file") as File | null;
  if (!file) throw new ValidationError("No se envió el archivo PDF");

  const buffer = Buffer.from(await file.arrayBuffer());
  const reportId = (formData.get("reportId") as string) || "";
  const operatorName = (formData.get("operatorName") as string) || "Operador";
  const operatorEmail = (formData.get("operatorEmail") as string) || "";
  const category = (formData.get("category") as string) || "otros";
  const priority = (formData.get("priority") as string) || "BAJA";
  const status = (formData.get("status") as string) || "pending";

  const limitCheck = emailRateLimiter.tryConsume(operatorEmail);
  if (!limitCheck.success) {
    return {
      success: false,
      error: `Demasiados intentos. Por favor espera ${limitCheck.retryAfter} segundos antes de enviar otro correo.`,
      retryAfter: limitCheck.retryAfter,
      statusCode: 429,
    };
  }

  const shortReportId = reportId.slice(0, 8).toUpperCase();
  const categoryList = category.split(",").map((c) => c.trim());
  const formattedCategories = categoryList
    .map((c) => {
      const mapped = CATEGORY_MAP[c.toLowerCase()] || c;
      return `<span style="display:inline-block; background:#f3f4f6; color:#4b5563; padding:2px 8px; border-radius:12px; font-size:12px; margin-right:4px; margin-bottom:4px; border:1px solid #e5e7eb;">${mapped}</span>`;
    })
    .join("");
  const formattedStatus = STATUS_MAP[status] || status;

  const htmlContent = buildReportEmailHtml({
    shortReportId,
    operatorName,
    operatorEmail,
    formattedCategories,
    priority,
    formattedStatus,
  });

  const recipientsJson = formData.get("recipients") as string | null;
  const toAddresses = parseRecipients(recipientsJson);
  const attachment = { filename: `reporte_${reportId}.pdf`, content: buffer };

  try {
    const { Resend } = await import("resend");
    if (!process.env.RESEND_API_KEY) throw new Error("No RESEND_API_KEY found");

    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: "Control Master <alertas@enlacecr.dev>",
      to: toAddresses,
      subject: `Reporte - #${shortReportId}`,
      html: htmlContent,
      attachments: [attachment],
    });

    if (data.error) throw new Error(data.error.message);

    await markEmailStatus(reportId, "sent");
    return { success: true, messageId: data.data?.id, provider: "resend" };
  } catch (resendError) {
    console.warn("Falló Resend, usando SMTP:", resendError);
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: { minVersion: "TLSv1.2" },
  });

  const info = await transporter.sendMail({
    from: `"Control Master" <${process.env.SMTP_EMAIL}>`,
    to: toAddresses.join(", "),
    replyTo: operatorEmail,
    subject: `Reporte - #${shortReportId}`,
    html: htmlContent,
    attachments: [attachment],
  });

  await markEmailStatus(reportId, "sent");
  return { success: true, messageId: info.messageId, provider: "smtp" };
}
