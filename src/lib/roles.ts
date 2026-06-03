import { NextResponse } from 'next/server';

export function requireRole(
  user: { role?: string } | Record<string, unknown>,
  allowedRoles: string[]
) {
  const role = typeof user.role === 'string' ? user.role : '';
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: 'No tienes permisos para realizar esta acción.' },
      { status: 403 }
    );
  }
  return { authorized: true as const };
}
