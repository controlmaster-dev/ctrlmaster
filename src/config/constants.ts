/**
 * Application constants and configuration
 */

/**
 * Application metadata
 */
export const APP_CONFIG = {
  NAME: 'Control Master',
  VERSION: '0.1.0',
  TIMEZONE: 'America/Costa_Rica',
  LOCALE: 'es-CR',
} as const;

/**
 * UI configuration values
 */
export const UI_CONFIG = {
  TOAST_DURATION: 10000,
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 300,
  PAGE_LOAD_DELAY: 500,
  MAX_FILE_SIZE: 4 * 1024 * 1024, // 4MB
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  CHART_DAYS: 7,
  RECENT_REPORTS_LIMIT: 5,
  REPORTS_PER_PAGE: 20,
  USERS_PER_PAGE: 50,
} as const;

/**
 * Storage keys for localStorage and sessionStorage
 */
export const STORAGE_KEYS = {
  USER: 'enlace-user',
  PVW_INDEX: 'enlace_pvw_index',
  PRG_INDEX: 'enlace_prg_index',
  BIRTHDAY_TOAST_DATE: 'birthday-toast-shown-date',
  THEME: 'enlace-theme',
} as const;

/**
 * Status labels mapping
 */
export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  'in-progress': 'En Progreso',
  resolved: 'Resuelto',
} as const;

/**
 * Status color classes
 */
export const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
  'in-progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
} as const;

/**
 * Priority labels mapping
 */
export const PRIORITY_LABELS: Record<string, string> = {
  Enlace: 'Enlace',
  EJTV: 'EJTV',
  'Enlace USA': 'Enlace USA',
  Todos: 'Todos',
} as const;

/**
 * Role labels mapping
 */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  ENGINEER: 'Ingeniero',
  OPERATOR: 'Operador',
} as const;

/**
 * Email configuration
 */
export const EMAIL_CONFIG = {
  DEFAULT_RECIPIENTS: 'ingenieria@enlace.org, rjimenez@enlace.org',
  SECURITY_ALERT_RECIPIENT: 'knunez@enlace.org',
  FROM_EMAIL: 'noreply@enlace.org',
  FROM_NAME: 'Control Master',
} as const;

/**
 * Security configuration
 */
export const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_MIN_LENGTH: 8,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: {
    AUTH: 5,
    REPORTS: 20,
    UPLOAD: 10,
    GENERAL: 100,
  },
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Date format configurations
 */
export const DATE_FORMATS = {
  DATE_ONLY: 'PPP',
  TIME_ONLY: 'p',
  DATE_TIME: 'PPP p',
  DATE_TIME_SHORT: 'dd/MM/yyyy HH:mm',
  TIME_SHORT: 'HH:mm:ss',
  WEEKDAY_SHORT: 'EEEEEE',
} as const;

/**
 * Stream configuration
 */
export const STREAM_CONFIG = {
  MAX_STREAMS: 8,
  RECONNECT_INTERVAL: 5000,
  BUFFER_LENGTH: 30,
} as const;

/**
 * Monitoring configuration
 */
export const MONITORING_CONFIG = {
  HEARTBEAT_INTERVAL: 60 * 1000, // 1 minute
  INACTIVE_THRESHOLD: 5 * 60 * 1000, // 5 minutes
} as const;
