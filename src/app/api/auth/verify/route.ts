/**
 * Session verification endpoint.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api/handler';
import { getUserFromToken, validateToken } from '@/lib/auth';

const verifyBodySchema = z.object({
  userId: z.string().min(1),
});

/**
 * POST /api/auth/verify
 * Verify if a known user/session pair is valid.
 */
export const POST = apiHandler({ bodySchema: verifyBodySchema }, async ({ req, body }) => {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Token invalido' }, { status: 401 });
  }

  const isValid = await validateToken(body.userId, token);
  if (!isValid) {
    return NextResponse.json({ error: 'Token expirado o invalido' }, { status: 401 });
  }

  return { valid: true };
});

/**
 * GET /api/auth/verify
 * Check current session status and return the safe user payload.
 */
export const GET = apiHandler({}, async ({ req }) => {
  const token = req.cookies.get('auth-token')?.value;
  const userId = req.cookies.get('user-id')?.value;

  if (!token || !userId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const isValid = await validateToken(userId, token);
  if (!isValid) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await getUserFromToken(token);
  return { authenticated: true, user };
});
