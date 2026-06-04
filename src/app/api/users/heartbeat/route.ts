import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { UserModel } from "@/models";

const heartbeatBodySchema = z.object({
  path: z.string().nullable().optional(),
});

export const POST = apiHandler(
  { auth: true, bodySchema: heartbeatBodySchema },
  async ({ user, body }) => {
    const userId = String(user?.id ?? "");
    await connectMongo();
    await UserModel.findByIdAndUpdate(userId, {
      currentPath: body.path ?? null,
      lastActive: new Date(),
    });
    return { success: true };
  }
);
