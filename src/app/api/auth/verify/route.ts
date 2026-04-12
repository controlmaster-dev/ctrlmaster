/**
 * Session verification endpoint
 * Used by middleware to validate auth tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';

/**
 * POST /api/auth/verify
 * Verify if the session token is valid
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    const body = await req.json();
    const { userId } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const isValid = await validateToken(userId, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Token expirado o inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json(
      { error: 'Error de verificación' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/verify
 * Check current session status
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    const userId = req.cookies.get('user-id')?.value;

    if (!token || !userId) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    const isValid = await validateToken(userId, token);

    return NextResponse.json({ authenticated: isValid });
  } catch {
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
