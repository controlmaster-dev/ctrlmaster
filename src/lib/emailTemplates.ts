/**
 * Correos transaccionales en HTML simple + texto plano.
 * Sin temas, sin modo oscuro, sin CSS en <head>: solo estilos inline básicos.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enlacecr.dev";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const P =
  'style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#000000;"';
const TD_LABEL =
  'style="padding:8px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;color:#000000;border:1px solid #999999;vertical-align:top;"';
const TD_VALUE =
  'style="padding:8px 10px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;border:1px solid #999999;vertical-align:top;"';
const TABLE =
  'border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;"';

type EmailLayoutOptions = {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const year = new Date().getFullYear();
  const cta =
    options.ctaLabel && options.ctaUrl
      ? `<p ${P}><a href="${escapeHtml(options.ctaUrl)}" style="color:#0000ee;">${escapeHtml(options.ctaLabel)}</a></p>`
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#000000;background:#ffffff;">
  <p ${P}><strong>Control Master</strong></p>
  <p ${P}><strong>${escapeHtml(options.title)}</strong></p>
  ${options.bodyHtml}
  ${cta}
  <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.4;color:#555555;">
    ${options.footerNote || "Mensaje automático enviado por Control Master."}<br>
    Enlace, ${year}
  </p>
</body>
</html>`;
}

function dataTable(rows: { label: string; value: string }[]): string {
  const trs = rows
    .map(
      (row) =>
        `<tr>
          <td ${TD_LABEL}>${escapeHtml(row.label)}</td>
          <td ${TD_VALUE}>${row.value}</td>
        </tr>`
    )
    .join("");
  return `<table ${TABLE} width="100%">${trs}</table>`;
}

function plainFooter(note?: string): string {
  return `\n--\n${note || "Control Master (mensaje automático)"}`;
}

function plainLink(label: string, url: string): string {
  return `${label}: ${url}`;
}

export function renderReportNotificationEmail(params: {
  reportCode: string;
  operatorName: string;
  operatorEmail: string;
  formattedCategories: string;
  priority: string;
  formattedStatus: string;
}): string {
  const operator =
    params.operatorEmail || params.operatorName
      ? params.operatorEmail
        ? `${escapeHtml(params.operatorName)} &lt;${escapeHtml(params.operatorEmail)}&gt;`
        : escapeHtml(params.operatorName)
      : "—";

  const body = `
  <p ${P}>Se registró un nuevo reporte de incidencia. El detalle completo está en el PDF adjunto.</p>
  ${dataTable([
    { label: "Código", value: escapeHtml(params.reportCode) },
    { label: "Operador", value: operator },
    { label: "Canal", value: escapeHtml(params.priority) },
    { label: "Tipo", value: escapeHtml(params.formattedCategories) },
    { label: "Estado", value: escapeHtml(params.formattedStatus) },
  ])}`;

  return renderEmailLayout({
    title: "Notificación de reporte de incidencia",
    bodyHtml: body,
    ctaLabel: "Ver reportes en el sistema",
    ctaUrl: `${APP_URL}/reportes`,
  });
}

export function renderReportNotificationPlainText(params: {
  reportCode: string;
  operatorName: string;
  operatorEmail: string;
  formattedCategories: string;
  priority: string;
  formattedStatus: string;
}): string {
  const operator = params.operatorEmail
    ? `${params.operatorName} <${params.operatorEmail}>`
    : params.operatorName;

  return [
    "Control Master",
    "Notificación de reporte de incidencia",
    "",
    "Se registró un nuevo reporte de incidencia. El detalle completo está en el PDF adjunto.",
    "",
    `Código: ${params.reportCode}`,
    `Operador: ${operator}`,
    `Canal: ${params.priority}`,
    `Tipo: ${params.formattedCategories}`,
    `Estado: ${params.formattedStatus}`,
    "",
    plainLink("Ver reportes", `${APP_URL}/reportes`),
    plainFooter(),
  ].join("\n");
}

export function renderShiftReminderEmail(params: {
  firstName: string;
  formattedDate: string;
  shiftType: string;
  senderLine?: string;
}): string {
  const intro = params.senderLine
    ? `${escapeHtml(params.senderLine)} le recuerda su próximo turno de pauta.`
    : "Recordatorio de su próximo turno de pauta.";

  const body = `
  <p ${P}>Estimado/a ${escapeHtml(params.firstName)},</p>
  <p ${P}>${intro}</p>
  ${dataTable([
    { label: "Fecha", value: escapeHtml(params.formattedDate) },
    { label: "Modalidad", value: escapeHtml(params.shiftType) },
  ])}
  <p ${P}>Ante cualquier consulta, comuníquese con ingeniería.</p>`;

  return renderEmailLayout({
    title: "Recordatorio de turno de pauta",
    bodyHtml: body,
    ctaLabel: "Calendario",
    ctaUrl: APP_URL,
  });
}

export function renderCommentNotificationEmail(params: {
  title: string;
  messageHtml: string;
  commentContent: string;
  ctaUrl: string;
  ctaLabel?: string;
}): string {
  const body = `
  <p ${P}>${params.messageHtml}</p>
  <p ${P}><strong>Comentario:</strong></p>
  <p ${P}>${escapeHtml(params.commentContent)}</p>`;

  return renderEmailLayout({
    title: params.title,
    bodyHtml: body,
    ctaLabel: params.ctaLabel || "Ver reporte",
    ctaUrl: params.ctaUrl,
  });
}

export function renderSecurityAlertEmail(params: {
  userName: string;
  userEmail: string;
  country: string;
  ip: string;
  timestamp: string;
}): string {
  const body = `
  <p ${P}>Inicio de sesión desde una ubicación no habitual:</p>
  ${dataTable([
    { label: "Usuario", value: escapeHtml(params.userName) },
    { label: "Correo", value: escapeHtml(params.userEmail) },
    { label: "País", value: escapeHtml(params.country) },
    { label: "IP", value: escapeHtml(params.ip) },
    { label: "Fecha", value: escapeHtml(params.timestamp) },
  ])}
  <p ${P}>Si no fue usted, cambie la contraseña y avise al administrador.</p>`;

  return renderEmailLayout({
    title: "Alerta de inicio de sesión",
    bodyHtml: body,
    footerNote: "Correo de seguridad. No responda a este mensaje.",
  });
}

export function renderNewReportSummaryEmail(params: {
  operatorName: string;
  description: string;
  priority: string;
  category: string;
}): string {
  const body = `
  <p ${P}>Reporte registrado:</p>
  ${dataTable([
    { label: "Operador", value: escapeHtml(params.operatorName) },
    { label: "Canal", value: escapeHtml(params.priority) },
    { label: "Categoría", value: escapeHtml(params.category) },
  ])}
  <p ${P}><strong>Descripción</strong></p>
  <p ${P}>${escapeHtml(params.description)}</p>`;

  return renderEmailLayout({
    title: "Reporte registrado",
    bodyHtml: body,
    ctaLabel: "Ver reportes",
    ctaUrl: `${APP_URL}/reportes`,
  });
}

export function renderDailySummaryEmail(params: {
  date: string;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
}): string {
  return renderEmailLayout({
    title: `Resumen de reportes — ${params.date}`,
    bodyHtml: `
  <p ${P}>Resumen del día:</p>
  ${dataTable([
    { label: "Total", value: String(params.totalReports) },
    { label: "Resueltos", value: String(params.resolvedReports) },
    { label: "Pendientes", value: String(params.pendingReports) },
  ])}`,
    ctaLabel: "Panel de reportes",
    ctaUrl: `${APP_URL}/reportes`,
  });
}

export function renderWeeklySummaryEmail(params: {
  startDate: string;
  endDate: string;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
}): string {
  return renderEmailLayout({
    title: "Resumen semanal de reportes",
    bodyHtml: `
  <p ${P}>Período: ${escapeHtml(params.startDate)} — ${escapeHtml(params.endDate)}</p>
  ${dataTable([
    { label: "Total", value: String(params.totalReports) },
    { label: "Resueltos", value: String(params.resolvedReports) },
    { label: "Pendientes", value: String(params.pendingReports) },
  ])}`,
    ctaLabel: "Ver reportes",
    ctaUrl: `${APP_URL}/reportes`,
  });
}
