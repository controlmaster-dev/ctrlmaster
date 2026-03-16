import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { reportId, authorId, emoji } = body;

    if (!reportId || !authorId || !emoji) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }


    const existingReaction = await prisma.reaction.findUnique({
      where: {
        authorId_reportId_emoji: {
          authorId,
          reportId,
          emoji
        }
      }
    });

    if (existingReaction) {

      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      return NextResponse.json({ action: 'removed', id: existingReaction.id });
    } else {

      const newReaction = await prisma.reaction.create({
        data: {
          reportId,
          authorId,
          emoji
        },
        include: {
          author: true
        }
      });
      return NextResponse.json({ action: 'added', reaction: newReaction });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}