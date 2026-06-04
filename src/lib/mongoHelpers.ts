import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongo";
import {
  AttachmentModel,
  CommentModel,
  CommentReactionModel,
  ReactionModel,
  ReportModel,
  ReportViewModel,
} from "@/models";

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function caseInsensitiveRegex(value: string): RegExp {
  return new RegExp(escapeRegex(value), "i");
}

export async function withMongoTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  await connectMongo();
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

export async function cascadeDeleteReport(reportId: string): Promise<void> {
  await connectMongo();
  await Promise.all([
    CommentReactionModel.deleteMany({
      commentId: {
        $in: await CommentModel.find({ reportId }).distinct("_id"),
      },
    }),
    CommentModel.deleteMany({ reportId }),
    ReactionModel.deleteMany({ reportId }),
    ReportViewModel.deleteMany({ reportId }),
    AttachmentModel.deleteMany({ reportId }),
    ReportModel.deleteOne({ _id: reportId }),
  ]);
}

export function docToPlain<T extends { _id?: unknown }>(
  doc: T | null | undefined
): (Omit<T, "_id"> & { id: string }) | null {
  if (!doc) return null;
  const { _id, ...rest } = doc as T & { _id: string };
  return { ...rest, id: String(_id) } as Omit<T, "_id"> & { id: string };
}

export function docsToPlain<T extends { _id?: unknown }>(
  docs: T[]
): (Omit<T, "_id"> & { id: string })[] {
  return docs.map((d) => docToPlain(d)!);
}
