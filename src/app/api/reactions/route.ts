import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

const reactionSchema = z.object({
  reportId: z.string().min(1, "ID de reporte es requerido"),
  emoji: z.string().min(1, "Emoji es requerido"),
});

export const POST = apiHandler(
  { auth: true, bodySchema: reactionSchema },
  async ({ user, body }) => {
    const authorId = String(user?.id ?? "");
    const { reportId, emoji } = body;

    const [existingReaction] = await sql`
      SELECT * FROM "Reaction"
      WHERE "authorId" = ${authorId}
        AND "reportId" = ${reportId}
        AND "emoji" = ${emoji}
      LIMIT 1
    `;

    if (existingReaction) {
      await sql`DELETE FROM "Reaction" WHERE "id" = ${existingReaction.id}`;
      return { action: "removed", id: existingReaction.id };
    }

    const [newReaction] = await sql`
      INSERT INTO "Reaction" ("reportId", "authorId", "emoji")
      VALUES (${reportId}, ${authorId}, ${emoji})
      RETURNING *
    `;

    const [author] = await sql`
      SELECT "name", "image" FROM "User" WHERE "id" = ${authorId} LIMIT 1
    `;

    return {
      action: "added",
      reaction: { ...newReaction, author },
    };
  }
);
