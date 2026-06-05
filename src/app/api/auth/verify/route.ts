


import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api/handler';
import { getUserFromToken, touchSession, validateToken } from '@/lib/auth';
import { isTransientDbError } from '@/lib/dbErrors';

const verifyBodySchema = z.object({
  userId: z.string().min(1),
});


export const POST = apiHandler({ bodySchema: verifyBodySchema }, async ({ req, body }) => {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
  }

  try {
    const isValid = await validateToken(body.userId, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Token expirado o invalido' }, { status: 401 });
    }
    return { valid: true };
  } catch (error) {
    if (isTransientDbError(error)) {
      return NextResponse.json(
        { error: 'No se pudo validar la sesión. Reintenta.' },
        { status: 503 }
      );
    }
    throw error;
  }
});


export const GET = apiHandler({}, async ({ req }) => {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await touchSession(token);
    return { authenticated: true, user };
  } catch (error) {
    if (isTransientDbError(error)) {
      return NextResponse.json(
        { authenticated: false, error: 'No se pudo validar la sesión. Reintenta.' },
        { status: 503 }
      );
    }
    throw error;
  }
});
