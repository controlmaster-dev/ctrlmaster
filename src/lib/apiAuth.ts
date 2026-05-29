


import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';


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


export function requireCronAuth(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'Cron no está configurado en el servidor.' },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  return null;
}
