


const API_BASE = '/api';


export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE}/auth/login`,
  REGISTER: `${API_BASE}/auth/register`,
  REGISTRATION_CODES: `${API_BASE}/auth/registration-codes`,
} as const;


export const REPORTS_ENDPOINTS = {
  LIST: `${API_BASE}/reports`,
  DETAIL: (id: string) => `${API_BASE}/reports/${id}`,
  VIEW: `${API_BASE}/reports/view`,
} as const;


export const USERS_ENDPOINTS = {
  LIST: `${API_BASE}/users`,
  HEARTBEAT: `${API_BASE}/users/heartbeat`,
} as const;


export const COMMENTS_ENDPOINTS = {
  LIST: `${API_BASE}/comments`,
} as const;


export const REACTIONS_ENDPOINTS = {
  LIST: `${API_BASE}/reactions`,
} as const;


export const SCHEDULE_ENDPOINTS = {
  LIST: `${API_BASE}/schedule`,
  CONFIG: `${API_BASE}/schedule/config`,
} as const;


export const CALENDAR_ENDPOINTS = {
  USER: (userId: string) => `${API_BASE}/calendar/${userId}`,
} as const;


export const SPECIAL_EVENTS_ENDPOINTS = {
  LIST: `${API_BASE}/special-events`,
  SHIFTS: `${API_BASE}/special-events/shifts`,
} as const;


export const STREAMS_ENDPOINTS = {
  METRICS: `${API_BASE}/streams/metrics`,
  STATS: `${API_BASE}/streams/stats`,
} as const;


export const SOCIAL_ENDPOINTS = {
  STATUS: `${API_BASE}/social/status`,
  TOGGLE: `${API_BASE}/social/toggle`,
} as const;


export const UPLOAD_ENDPOINTS = {
  UPLOAD: `${API_BASE}/upload`,
} as const;


export const CREDENTIALS_ENDPOINTS = {
  LIST: `${API_BASE}/credentials`,
} as const;


export const SPELLCHECK_ENDPOINTS = {
  CHECK: `${API_BASE}/spellcheck`,
} as const;


export const CRON_ENDPOINTS = {
  SHIFT_REMINDERS: `${API_BASE}/cron/shift-reminders`,
} as const;


export const RESEND_ENDPOINTS = {
  HISTORY: `${API_BASE}/resend/history`,
} as const;


export const API_ENDPOINTS = {
  AUTH: AUTH_ENDPOINTS,
  REPORTS: REPORTS_ENDPOINTS,
  USERS: USERS_ENDPOINTS,
  COMMENTS: COMMENTS_ENDPOINTS,
  REACTIONS: REACTIONS_ENDPOINTS,
  SCHEDULE: SCHEDULE_ENDPOINTS,
  CALENDAR: CALENDAR_ENDPOINTS,
  SPECIAL_EVENTS: SPECIAL_EVENTS_ENDPOINTS,
  STREAMS: STREAMS_ENDPOINTS,
  SOCIAL: SOCIAL_ENDPOINTS,
  UPLOAD: UPLOAD_ENDPOINTS,
  CREDENTIALS: CREDENTIALS_ENDPOINTS,
  SPELLCHECK: SPELLCHECK_ENDPOINTS,
  CRON: CRON_ENDPOINTS,
  RESEND: RESEND_ENDPOINTS,
} as const;
