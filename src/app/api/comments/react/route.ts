import { randomUUID } from "crypto";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { CommentReactionModel } from "@/models";

const reactSchema = z.object({
  commentId: z.string().min(1),
  emoji: z.string().min(1),
});

export const POST = apiHandler(
  { auth: true, bodySchema: reactSchema },
  async ({ user, body }) => {
    const authorId = String(user?.id ?? "");
    const { commentId, emoji } = body;

    await connectMongo();
    const existing = await CommentReactionModel.findOne({
      authorId,
      commentId,
      emoji,
    }).lean();

    if (existing) {
      await CommentReactionModel.findByIdAndDelete(existing._id);
      return { action: "removed" };
    }

    await CommentReactionModel.create({
      _id: randomUUID(),
      commentId,
      authorId,
      emoji,
    });
    return { action: "added" };
  }
);
