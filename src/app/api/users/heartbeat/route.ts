import { z } from "zod";
import sql from "@/lib/db";
import { apiHandler } from "@/lib/api/handler";

const heartbeatBodySchema = z.object({
  path: z.string().nullable().optional(),
});

export const POST = apiHandler(
  { auth: true, bodySchema: heartbeatBodySchema },
  async ({ user, body }) => {
    const userId = String(user?.id ?? "");
    await sql`
      UPDATE "User"
      SET "currentPath" = ${body.path ?? null}, "lastActive" = NOW()
      WHERE "id" = ${userId}
    `;
    return { success: true };
  }
);
