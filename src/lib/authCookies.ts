import type { NextRequest } from 'next/server';

/** Edge-safe: solo comprueba presencia de cookie (sin Mongoose ni node:crypto). */
export function hasAuthCookies(request: NextRequest): boolean {
  return Boolean(request.cookies.get('auth-token')?.value);
}
