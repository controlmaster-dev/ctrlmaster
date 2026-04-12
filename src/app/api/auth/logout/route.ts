/**
 * Logout API route
 * Revokes session token and clears cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeToken } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Revoke session and clear cookies
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    // Revoke token if it exists
    if (token) {
      await revokeToken(token);
    }

    // Create response
    const response = NextResponse.json({ success: true });

    // Clear cookies
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set('user-id', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
