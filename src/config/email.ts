import {
  renderDailySummaryEmail,
  renderNewReportSummaryEmail,
  renderSecurityAlertEmail,
  renderShiftReminderEmail,
  renderWeeklySummaryEmail,
} from "@/lib/emailTemplates";

export const EMAIL_TEMPLATES = {
  NEW_REPORT: (data: {
    operatorName: string;
    description: string;
    priority: string;
    category: string;
  }) => ({
    subject: `Nuevo reporte — ${data.priority} · ${data.category}`,
    html: renderNewReportSummaryEmail(data),
  }),

  SECURITY_ALERT: (data: {
    userName: string;
    userEmail?: string;
    country: string;
    ip: string;
    timestamp: Date;
  }) => ({
    subject: "Alerta de seguridad — inicio de sesión inusual",
    html: renderSecurityAlertEmail({
      userName: data.userName,
      userEmail: data.userEmail || "",
      country: data.country,
      ip: data.ip,
      timestamp: data.timestamp.toLocaleString("es-CR"),
    }),
  }),

  DAILY_SUMMARY: (data: {
    date: string;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
  }) => ({
    subject: `Resumen diario — ${data.date}`,
    html: renderDailySummaryEmail(data),
  }),

  WEEKLY_REPORT: (data: {
    startDate: string;
    endDate: string;
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
  }) => ({
    subject: `Resumen semanal — ${data.startDate} a ${data.endDate}`,
    html: renderWeeklySummaryEmail(data),
  }),

  SHIFT_REMINDER: (data: {
    userName: string;
    shiftDate: string;
    shiftStart: string;
    shiftEnd: string;
  }) => ({
    subject: `Recordatorio de turno — ${data.userName}`,
    html: renderShiftReminderEmail({
      firstName: data.userName.split(" ")[0] || data.userName,
      formattedDate: data.shiftDate,
      shiftType: `${data.shiftStart} – ${data.shiftEnd}`,
    }),
  }),
} as const;

export const EMAIL_CONFIG = {
  DEFAULT_RECIPIENTS: process.env.NEXT_PUBLIC_EMAIL_DEFAULT_RECIPIENTS
    ? process.env.NEXT_PUBLIC_EMAIL_DEFAULT_RECIPIENTS.split(",").map((e) => e.trim())
    : ["ingenieria@enlace.org", "rjimenez@enlace.org"],

  SECURITY_ALERT_RECIPIENT:
    process.env.NEXT_PUBLIC_EMAIL_SECURITY_RECIPIENT || "knunez@enlace.org",

  FROM_EMAIL: process.env.EMAIL_FROM || "noreply@enlace.org",

  FROM_NAME: process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || "Control Master",

  REPLY_TO: process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || "soporte@enlace.org",
} as const;

export function getEmailTemplate(type: keyof typeof EMAIL_TEMPLATES, data: unknown) {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    throw new Error(`Email template not found: ${type}`);
  }
  return template(data as never);
}
