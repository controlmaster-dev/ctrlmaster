import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commentId, authorId, emoji } = body;

    if (!commentId || !authorId || !emoji) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await prisma.commentReaction.findUnique({
      where: {
        authorId_commentId_emoji: {
          authorId,
          commentId,
          emoji
        }
      }
    });

    if (existing) {
      await prisma.commentReaction.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ action: 'removed' });
    } else {
      await prisma.commentReaction.create({
        data: {
          commentId,
          authorId,
          emoji
        }
      });
      return NextResponse.json({ action: 'added' });
    }

  } catch (error: unknown) {
    console.error('Error in comment reaction:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}