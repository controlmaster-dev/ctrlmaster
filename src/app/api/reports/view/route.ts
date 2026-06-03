import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import sql from "@/lib/db";

const viewBodySchema = z.object({
  reportId: z.string().min(1),
});

export const POST = apiHandler(
  { auth: true, bodySchema: viewBodySchema },
  async ({ user, body }) => {
    const userId = String(user?.id ?? "");
    await sql`
      INSERT INTO "ReportView" ("userId", "reportId")
      VALUES (${userId}, ${body.reportId})
      ON CONFLICT ("userId", "reportId")
      DO UPDATE SET "viewedAt" = NOW()
    `;
    return { success: true };
  }
);
