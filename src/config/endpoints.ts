/**
 * API endpoint configurations
 */

/**
 * Base API path
 */
const API_BASE = '/api';

/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE}/auth/login`,
  REGISTER: `${API_BASE}/auth/register`,
  REGISTRATION_CODES: `${API_BASE}/auth/registration-codes`,
} as const;

/**
 * Reports endpoints
 */
export const REPORTS_ENDPOINTS = {
  LIST: `${API_BASE}/reports`,
  DETAIL: (id: string) => `${API_BASE}/reports/${id}`,
  QUICK: `${API_BASE}/reports/quick`,
  VIEW: `${API_BASE}/reports/view`,
} as const;

/**
 * Users endpoints
 */
export const USERS_ENDPOINTS = {
  LIST: `${API_BASE}/users`,
  HEARTBEAT: `${API_BASE}/users/heartbeat`,
} as const;

/**
 * Comments endpoints
 */
export const COMMENTS_ENDPOINTS = {
  LIST: `${API_BASE}/comments`,
} as const;

/**
 * Reactions endpoints
 */
export const REACTIONS_ENDPOINTS = {
  LIST: `${API_BASE}/reactions`,
} as const;

/**
 * Tasks endpoints
 */
export const TASKS_ENDPOINTS = {
  LIST: `${API_BASE}/tasks`,
} as const;

/**
 * Schedule endpoints
 */
export const SCHEDULE_ENDPOINTS = {
  LIST: `${API_BASE}/schedule`,
  CONFIG: `${API_BASE}/schedule/config`,
} as const;

/**
 * Calendar endpoints
 */
export const CALENDAR_ENDPOINTS = {
  USER: (userId: string) => `${API_BASE}/calendar/${userId}`,
} as const;

/**
 * Special events endpoints
 */
export const SPECIAL_EVENTS_ENDPOINTS = {
  LIST: `${API_BASE}/special-events`,
  SHIFTS: `${API_BASE}/special-events/shifts`,
} as const;

/**
 * Streams endpoints
 */
export const STREAMS_ENDPOINTS = {
  METRICS: `${API_BASE}/streams/metrics`,
  STATS: `${API_BASE}/streams/stats`,
} as const;

/**
 * Social endpoints
 */
export const SOCIAL_ENDPOINTS = {
  STATUS: `${API_BASE}/social/status`,
  TOGGLE: `${API_BASE}/social/toggle`,
} as const;

/**
 * Upload endpoints
 */
export const UPLOAD_ENDPOINTS = {
  UPLOAD: `${API_BASE}/upload`,
} as const;

/**
 * Credentials endpoints
 */
export const CREDENTIALS_ENDPOINTS = {
  LIST: `${API_BASE}/credentials`,
} as const;

/**
 * Spellcheck endpoint
 */
export const SPELLCHECK_ENDPOINTS = {
  CHECK: `${API_BASE}/spellcheck`,
} as const;

/**
 * Debug endpoints
 */
export const DEBUG_ENDPOINTS = {
  YOUTUBE: `${API_BASE}/debug-youtube`,
  YOUTUBE_API: `${API_BASE}/debug-youtube-api`,
  TEST_DB: `${API_BASE}/test-db`,
} as const;

/**
 * Cron endpoints
 */
export const CRON_ENDPOINTS = {
  DAILY_SUMMARY: `${API_BASE}/cron/daily-summary`,
  MONITOR: `${API_BASE}/cron/monitor`,
  REMINDERS: `${API_BASE}/cron/reminders`,
  SHIFT_REMINDERS: `${API_BASE}/cron/shift-reminders`,
  WEEKLY_REPORT: `${API_BASE}/cron/weekly-report`,
} as const;

/**
 * Resend endpoints
 */
export const RESEND_ENDPOINTS = {
  HISTORY: `${API_BASE}/resend/history`,
} as const;

/**
 * Validator endpoints
 */
export const VALIDATOR_ENDPOINTS = {
  KB: `${API_BASE}/validator/kb`,
} as const;

/**
 * All endpoints grouped
 */
export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  REPORTS: REPORTS_ENDPOINTS,
  USERS: USERS_ENDPOINTS,
  COMMENTS: COMMENTS_ENDPOINTS,
  REACTIONS: REACTIONS_ENDPOINTS,
  TASKS: TASKS_ENDPOINTS,
  SCHEDULE: SCHEDULE_ENDPOINTS,
  CALENDAR: CALENDAR_ENDPOINTS,
  SPECIAL_EVENTS: SPECIAL_EVENTS_ENDPOINTS,
  STREAMS: STREAMS_ENDPOINTS,
  SOCIAL: SOCIAL_ENDPOINTS,
  UPLOAD: UPLOAD_ENDPOINTS,
  CREDENTIALS: CREDENTIALS_ENDPOINTS,
  SPELLCHECK: SPELLCHECK_ENDPOINTS,
  DEBUG: DEBUG_ENDPOINTS,
  CRON: CRON_ENDPOINTS,
  RESEND: RESEND_ENDPOINTS,
  VALIDATOR: VALIDATOR_ENDPOINTS,
} as const;
