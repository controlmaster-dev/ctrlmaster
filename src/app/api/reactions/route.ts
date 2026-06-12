import { randomUUID } from "crypto";
import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { connectMongo } from "@/lib/mongo";
import { ReactionModel, UserModel } from "@/models";

export const dynamic = "force-dynamic";

const reactionSchema = z.object({
  reportId: z.string().min(1, "ID de reporte es requerido"),
  emoji: z.string().min(1, "Reacción requerida"),
});

export const POST = apiHandler(
  { auth: true, bodySchema: reactionSchema },
  async ({ user, body }) => {
    const authorId = String(user?.id ?? "");
    const { reportId, emoji } = body;

    await connectMongo();
    const existingReaction = await ReactionModel.findOne({
      authorId,
      reportId,
      emoji,
    }).lean();

    if (existingReaction) {
      await ReactionModel.findByIdAndDelete(existingReaction._id);
      return { action: "removed", id: String(existingReaction._id) };
    }

    const newReaction = await ReactionModel.create({
      _id: randomUUID(),
      reportId,
      authorId,
      emoji,
    });

    const author = await UserModel.findById(authorId).select("name image").lean();

    const plain = newReaction.toObject();
    return {
      action: "added",
      reaction: {
        ...plain,
        id: String(newReaction._id),
        author: author
          ? { name: author.name, image: author.image }
          : { name: "Usuario", image: null },
      },
    };
  }
);
