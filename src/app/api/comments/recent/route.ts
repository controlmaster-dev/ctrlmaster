import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const comments = await sql`
      SELECT c.*,
             json_build_object('name', a."name", 'image', a."image") AS "author",
             json_build_object('id', r."id", 'problemDescription', r."problemDescription") AS "report"
      FROM "Comment" c
      JOIN "User" a ON a."id" = c."authorId"
      JOIN "Report" r ON r."id" = c."reportId"
      ORDER BY c."createdAt" DESC
      LIMIT 10
    `;

    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[GET /api/comments/recent] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
