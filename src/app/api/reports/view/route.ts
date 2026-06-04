import { randomUUID } from "crypto";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { ReportViewModel } from "@/models";

const viewBodySchema = z.object({
  reportId: z.string().min(1),
});

export const POST = apiHandler(
  { auth: true, bodySchema: viewBodySchema },
  async ({ user, body }) => {
    const userId = String(user?.id ?? "");
    await connectMongo();
    await ReportViewModel.findOneAndUpdate(
      { userId, reportId: body.reportId },
      { $set: { viewedAt: new Date() }, $setOnInsert: { _id: randomUUID() } },
      { upsert: true }
    );
    return { success: true };
  }
);
