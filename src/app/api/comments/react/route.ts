import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import sql from "@/lib/db";

const reactSchema = z.object({
  commentId: z.string().min(1),
  emoji: z.string().min(1),
});

export const POST = apiHandler(
  { auth: true, bodySchema: reactSchema },
  async ({ user, body }) => {
    const authorId = String(user?.id ?? "");
    const { commentId, emoji } = body;

    const [existing] = await sql`
      SELECT * FROM "CommentReaction"
      WHERE "authorId" = ${authorId}
        AND "commentId" = ${commentId}
        AND "emoji" = ${emoji}
      LIMIT 1
    `;

    if (existing) {
      await sql`DELETE FROM "CommentReaction" WHERE "id" = ${existing.id}`;
      return { action: "removed" };
    }

    await sql`
      INSERT INTO "CommentReaction" ("commentId", "authorId", "emoji")
      VALUES (${commentId}, ${authorId}, ${emoji})
    `;
    return { action: "added" };
  }
);
