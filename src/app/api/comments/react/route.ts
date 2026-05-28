import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { validateApiAuth } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { commentId, emoji } = body;
    const authorId = authResult.user.id;

    if (!commentId || !emoji) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const [existing] = await sql`
      SELECT * FROM "CommentReaction"
      WHERE "authorId" = ${authorId}
        AND "commentId" = ${commentId}
        AND "emoji" = ${emoji}
      LIMIT 1
    `;

    if (existing) {
      await sql`DELETE FROM "CommentReaction" WHERE "id" = ${existing.id}`;
      return NextResponse.json({ action: 'removed' });
    } else {
      await sql`
        INSERT INTO "CommentReaction" ("commentId", "authorId", "emoji")
        VALUES (${commentId}, ${authorId}, ${emoji})
      `;
      return NextResponse.json({ action: 'added' });
    }

  } catch (error: unknown) {
    console.error('Error in comment reaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
