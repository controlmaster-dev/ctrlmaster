import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export const dynamic = 'force-dynamic';

/**
 * Lightweight list of users for @mention autocomplete.
 * Returns only id/name/image and is cached briefly to avoid re-querying the
 * whole User table on every report detail open.
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const users = await sql`
      SELECT "id", "name", "image" FROM "User" ORDER BY "name" ASC
    `;

    return NextResponse.json(users, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error) {
    console.error('[GET /api/users/mentions] error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
