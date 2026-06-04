import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import { RegistrationCodeModel } from "@/models";

export type RegistrationCodeRow = {
  id: string;
  code: string;
  createdById: string;
  usedById?: string | null;
  usedAt?: string | Date | null;
  expiresAt: string | Date;
  createdAt: string | Date;
  [key: string]: unknown;
};

function toRow(doc: Record<string, unknown>): RegistrationCodeRow {
  return {
    ...doc,
    id: String(doc._id ?? doc.id),
  } as RegistrationCodeRow;
}

export async function listRegistrationCodes() {
  await connectMongo();
  const rows = await RegistrationCodeModel.find().sort({ createdAt: -1 }).lean();
  return rows.map((r) => toRow(r as Record<string, unknown>));
}

export async function findRegistrationCodeByCode(code: string) {
  await connectMongo();
  const row = await RegistrationCodeModel.findOne({ code }).lean();
  return row ? toRow(row as Record<string, unknown>) : undefined;
}

export async function registrationCodeExists(code: string) {
  await connectMongo();
  const existing = await RegistrationCodeModel.findOne({ code }).select("_id").lean();
  return !!existing;
}

export async function insertRegistrationCode(
  code: string,
  createdById: string,
  expiresAt: string
) {
  await connectMongo();
  const id = randomUUID();
  const doc = await RegistrationCodeModel.create({
    _id: id,
    code,
    createdById,
    expiresAt: new Date(expiresAt),
  });
  return toRow(doc.toObject() as Record<string, unknown>);
}

export async function deleteRegistrationCode(id: string) {
  await connectMongo();
  await RegistrationCodeModel.findByIdAndDelete(id);
}

export async function markRegistrationCodeUsed(codeId: string, userId: string) {
  await connectMongo();
  await RegistrationCodeModel.findByIdAndUpdate(codeId, {
    usedById: userId,
    usedAt: new Date(),
  });
}
