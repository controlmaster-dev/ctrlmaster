import { encryptSecret, decryptSecret } from "@/lib/encryption";
import { ValidationError } from "@/lib/errors";
import {
  listCredentials,
  insertCredential,
  deleteCredential,
  updateCredential,
} from "@/server/repositories/credentialRepository";

function decryptRow<T extends { password: string }>(row: T) {
  return { ...row, password: decryptSecret(row.password) };
}

export async function getCredentials() {
  const rows = await listCredentials();
  return rows.map((r) => decryptRow(r as { password: string }));
}

export async function createCredential(input: {
  service: string;
  category?: string;
  username: string;
  password: string;
  notes?: string | null;
}) {
  const row = await insertCredential({
    service: input.service,
    category: input.category || "General",
    username: input.username,
    encryptedPassword: encryptSecret(input.password),
    notes: input.notes ?? null,
  });
  return decryptRow(row as { password: string });
}

export async function removeCredential(id: string) {
  await deleteCredential(id);
  return { success: true as const };
}

export async function patchCredential(
  id: string,
  input: {
    service?: string;
    category?: string;
    username?: string;
    password?: string;
    notes?: string | null;
  }
) {
  const encryptedPassword = input.password ? encryptSecret(input.password) : null;

  const updated = await updateCredential(id, {
    service: input.service ?? null,
    category: input.category ?? "General",
    username: input.username ?? null,
    encryptedPassword,
    notes: input.notes ?? null,
  });

  if (!updated) throw new ValidationError("Credential not found");

  return decryptRow(updated as { password: string });
}
