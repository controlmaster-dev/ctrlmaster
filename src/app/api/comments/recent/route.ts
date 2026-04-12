/**
 * Recent comments API route with typed error handling.
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            name: true,
            image: true,
          },
        },
        report: {
          select: {
            id: true,
            problemDescription: true,
          },
        },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[GET /api/comments/recent] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}