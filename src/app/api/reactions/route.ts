import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const reactionSchema = z.object({
  reportId: z.string().min(1, 'ID de reporte es requerido'),
  authorId: z.string().min(1, 'ID de autor es requerido'),
  emoji: z.string().min(1, 'Emoji es requerido'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = reactionSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de reacción inválidos', result.error.issues);
    }

    const { reportId, authorId, emoji } = result.data;

    const [existingReaction] = await sql`
      SELECT * FROM "Reaction"
      WHERE "authorId" = ${authorId}
        AND "reportId" = ${reportId}
        AND "emoji" = ${emoji}
      LIMIT 1
    `;

    if (existingReaction) {
      await sql`DELETE FROM "Reaction" WHERE "id" = ${existingReaction.id}`;
      return NextResponse.json({ action: 'removed', id: existingReaction.id });
    } else {
      const [newReaction] = await sql`
        INSERT INTO "Reaction" ("reportId", "authorId", "emoji")
        VALUES (${reportId}, ${authorId}, ${emoji})
        RETURNING *
      `;

      const [author] = await sql`
        SELECT "name", "image" FROM "User" WHERE "id" = ${authorId} LIMIT 1
      `;

      return NextResponse.json({
        action: 'added',
        reaction: { ...newReaction, author },
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/reactions] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
