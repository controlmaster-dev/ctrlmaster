/**
 * Email configuration and templates
 */

/**
 * Email templates
 */
export const EMAIL_TEMPLATES = {
  /**
   * New report notification email
   */
  NEW_REPORT: (data: { operatorName: string; description: string; priority: string; category: string }) => ({
    subject: `📋 Nuevo Reporte: ${data.priority} - ${data.category}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0C60;">Nuevo Reporte Registrado</h2>
        <p><strong>Operador:</strong> ${data.operatorName}</p>
        <p><strong>Prioridad:</strong> ${data.priority}</p>
        <p><strong>Categoría:</strong> ${data.category}</p>
        <p><strong>Descripción:</strong></p>
        <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${data.description}</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este es un mensaje automático de Control Master. Por favor no responda a este correo.
        </p>
      </div>
    `,
  }),

  /**
   * Security alert email for unusual login
   */
  SECURITY_ALERT: (data: { userName: string; country: string; ip: string; timestamp: Date }) => ({
    subject: '🔒 Seguridad: Inicio de Sesión Inusual Detectado',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0C60;">⚠️ Alerta de Seguridad</h2>
        <p>Se ha detectado un inicio de sesión inusual en la cuenta de <strong>${data.userName}</strong>.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>País:</strong> ${data.country}</p>
          <p><strong>IP:</strong> ${data.ip}</p>
          <p><strong>Fecha:</strong> ${data.timestamp.toLocaleString('es-CR')}</p>
        </div>
        <p>Si no reconoces esta actividad, por favor cambia tu contraseña inmediatamente.</p>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este es un mensaje automático de Control Master.
        </p>
      </div>
    `,
  }),

  /**
   * Daily summary email
   */
  DAILY_SUMMARY: (data: { date: string; totalReports: number; resolvedReports: number; pendingReports: number }) => ({
    subject: `📊 Resumen Diario - ${data.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0C60;">Resumen Diario de Reportes</h2>
        <p><strong>Fecha:</strong> ${data.date}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Total de Reportes:</strong> ${data.totalReports}</p>
          <p><strong>Resueltos:</strong> ${data.resolvedReports}</p>
          <p><strong>Pendientes:</strong> ${data.pendingReports}</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este es un mensaje automático de Control Master.
        </p>
      </div>
    `,
  }),

  /**
   * Weekly report email
   */
  WEEKLY_REPORT: (data: { startDate: string; endDate: string; totalReports: number; resolvedReports: number; pendingReports: number }) => ({
    subject: `📈 Reporte Semanal - ${data.startDate} a ${data.endDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0C60;">Reporte Semanal</h2>
        <p><strong>Periodo:</strong> ${data.startDate} a ${data.endDate}</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Total de Reportes:</strong> ${data.totalReports}</p>
          <p><strong>Resueltos:</strong> ${data.resolvedReports}</p>
          <p><strong>Pendientes:</strong> ${data.pendingReports}</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este es un mensaje automático de Control Master.
        </p>
      </div>
    `,
  }),

  /**
   * Shift reminder email
   */
  SHIFT_REMINDER: (data: { userName: string; shiftDate: string; shiftStart: string; shiftEnd: string }) => ({
    subject: `⏰ Recordatorio de Turno - ${data.userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF0C60;">Recordatorio de Turno</h2>
        <p>Hola <strong>${data.userName}</strong>,</p>
        <p>Tienes un turno programado para:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Fecha:</strong> ${data.shiftDate}</p>
          <p><strong>Horario:</strong> ${data.shiftStart} - ${data.shiftEnd}</p>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Este es un mensaje automático de Control Master.
        </p>
      </div>
    `,
  }),
} as const;

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  /**
   * Default email recipients
   */
  DEFAULT_RECIPIENTS: process.env.NEXT_PUBLIC_EMAIL_DEFAULT_RECIPIENTS
    ? process.env.NEXT_PUBLIC_EMAIL_DEFAULT_RECIPIENTS.split(',').map(e => e.trim())
    : ['ingenieria@enlace.org', 'rjimenez@enlace.org'],

  /**
   * Security alert recipient
   */
  SECURITY_ALERT_RECIPIENT: process.env.NEXT_PUBLIC_EMAIL_SECURITY_RECIPIENT || 'knunez@enlace.org',

  /**
   * From email address
   */
  FROM_EMAIL: process.env.EMAIL_FROM || 'noreply@enlace.org',

  /**
   * From name
   */
  FROM_NAME: process.env.NEXT_PUBLIC_EMAIL_FROM_NAME || 'Control Master',

  /**
   * Reply-to email
   */
  REPLY_TO: process.env.NEXT_PUBLIC_EMAIL_REPLY_TO || 'soporte@enlace.org',
} as const;

/**
 * Get email template by type
 */
export function getEmailTemplate(type: keyof typeof EMAIL_TEMPLATES, data: unknown) {
  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    throw new Error(`Email template not found: ${type}`);
  }
  return template(data as never);
}
