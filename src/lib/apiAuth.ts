/**
 * API Authentication middleware helper
 * Use this in API routes to validate user authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

/**
 * Validate user from request cookies
 * Returns user object if authenticated, or NextResponse if not
 *
 * Usage:
 *   const authResult = await validateApiAuth(req);
 *   if (authResult instanceof NextResponse) return authResult;
 *   const { user } = authResult;
 */
export async function validateApiAuth(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'No autorizado. Inicia sesión nuevamente.' },
      { status: 401 }
    );
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json(
      { error: 'Sesión expirada. Inicia sesión nuevamente.' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Check if user has required role
 * Returns NextResponse if unauthorized
 */
export function requireRole(user: { role?: string } | Record<string, any>, allowedRoles: string[]) {
  const role = typeof user.role === 'string' ? user.role : '';
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'No tienes permisos para realizar esta acción.' },
      { status: 403 }
    );
  }
  return { authorized: true };
}
