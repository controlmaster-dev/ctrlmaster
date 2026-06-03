/** Duración de sesión (cookie + SessionToken en BD). Por defecto 7 días. */
export const SESSION_MAX_AGE_MS = Number(
  process.env.SESSION_MAX_AGE_MS ?? String(7 * 24 * 60 * 60 * 1000)
);

export const SESSION_COOKIE_MAX_AGE_SEC = Math.floor(SESSION_MAX_AGE_MS / 1000);
