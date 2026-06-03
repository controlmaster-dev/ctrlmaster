import sql from "@/lib/db";
import { emailRateLimiter } from "@/lib/rateLimit";
import { ValidationError } from "@/lib/errors";
import { formatReportDisplayId } from "@/lib/reportCode";
import {
  renderReportNotificationEmail,
  renderReportNotificationPlainText,
} from "@/lib/emailTemplates";
import {
  isEmailNetworkError,
  sendTransactionalEmail,
} from "@/lib/emailDelivery";

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

  const [reportRow] = await sql<{ code: string | null }[]>`
    SELECT "code" FROM "Report" WHERE "id" = ${reportId} LIMIT 1
  `;
  const reportCode = formatReportDisplayId(reportId, reportRow?.code);
  const formattedCategories = category
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => CATEGORY_MAP[c.toLowerCase()] || c)
    .join(", ");
  const formattedStatus = STATUS_MAP[status] || status;

  const emailParams = {
    reportCode,
    operatorName,
    operatorEmail,
    formattedCategories,
    priority,
    formattedStatus,
  };
  const htmlContent = renderReportNotificationEmail(emailParams);
  const textContent = renderReportNotificationPlainText(emailParams);

  const recipientsJson = formData.get("recipients") as string | null;
  const toAddresses = parseRecipients(recipientsJson);

  const result = await sendTransactionalEmail({
    to: toAddresses,
    subject: `Reporte ${reportCode} — ${formattedStatus}`,
    html: htmlContent,
    text: textContent,
    replyTo: operatorEmail || undefined,
    attachments: [{ filename: `reporte_${reportCode}.pdf`, content: buffer }],
  });

  if (!result.success) {
    if (result.error && isEmailNetworkError(result.error)) {
      emailRateLimiter.refund(operatorEmail);
    }
    await markEmailStatus(reportId, "failed");
    return {
      success: false,
      error: result.error ?? "No se pudo enviar el correo",
      statusCode: 503,
    };
  }

  await markEmailStatus(reportId, "sent");
  return {
    success: true,
    messageId: result.messageId,
    provider: result.provider,
  };
}
