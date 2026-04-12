/**
 * Reactions API route with input validation and typed error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Use unique constraint to find if reaction already exists (toggle behavior)
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        authorId_reportId_emoji: {
          authorId,
          reportId,
          emoji,
        },
      },
    });

    if (existingReaction) {
      // Toggle off: remove reaction
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
      return NextResponse.json({ action: 'removed', id: existingReaction.id });
    } else {
      // Toggle on: create reaction
      const newReaction = await prisma.reaction.create({
        data: {
          reportId,
          authorId,
          emoji,
        },
        include: {
          author: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });
      return NextResponse.json({ action: 'added', reaction: newReaction });
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