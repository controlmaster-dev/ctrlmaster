import { randomUUID } from "crypto";
import { connectMongo } from "@/lib/mongo";
import { CredentialModel } from "@/models";

export type CredentialRow = {
  id: string;
  service: string;
  category: string;
  username: string;
  password: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toRow(doc: Record<string, unknown>): CredentialRow {
  return {
    id: String(doc._id),
    service: String(doc.service),
    category: String(doc.category),
    username: String(doc.username),
    password: String(doc.password),
    notes: (doc.notes as string) ?? null,
    createdAt: doc.createdAt as Date,
    updatedAt: doc.updatedAt as Date,
  };
}

export async function listCredentials() {
  await connectMongo();
  const rows = await CredentialModel.find()
    .select("service category username password notes createdAt updatedAt")
    .sort({ createdAt: -1 })
    .lean();
  return rows.map((r) => toRow(r as Record<string, unknown>));
}

export async function insertCredential(data: {
  service: string;
  category: string;
  username: string;
  encryptedPassword: string;
  notes: string | null;
}) {
  await connectMongo();
  const doc = await CredentialModel.create({
    _id: randomUUID(),
    service: data.service,
    category: data.category,
    username: data.username,
    password: data.encryptedPassword,
    notes: data.notes,
  });
  return toRow(doc.toObject() as Record<string, unknown>);
}

export async function deleteCredential(id: string) {
  await connectMongo();
  await CredentialModel.findByIdAndDelete(id);
}

export async function updateCredential(
  id: string,
  data: {
    service: string | null;
    category: string;
    username: string | null;
    encryptedPassword: string | null;
    notes: string | null;
  }
) {
  await connectMongo();
  const existing = await CredentialModel.findById(id).lean();
  if (!existing) return null;

  const doc = await CredentialModel.findByIdAndUpdate(
    id,
    {
      service: data.service ?? existing.service,
      category: data.category ?? existing.category,
      username: data.username ?? existing.username,
      password: data.encryptedPassword ?? existing.password,
      notes: data.notes ?? existing.notes,
      updatedAt: new Date(),
    },
    { new: true }
  ).lean();
  return doc ? toRow(doc as Record<string, unknown>) : null;
}
