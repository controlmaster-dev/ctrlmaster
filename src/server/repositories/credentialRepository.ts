import sql from "@/lib/db";

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

export async function listCredentials() {
  return sql`
    SELECT "id", "service", "category", "username", "password", "notes", "createdAt", "updatedAt"
    FROM "Credential" ORDER BY "createdAt" DESC
  `;
}

export async function insertCredential(data: {
  service: string;
  category: string;
  username: string;
  encryptedPassword: string;
  notes: string | null;
}) {
  const [row] = await sql`
    INSERT INTO "Credential" ("service", "category", "username", "password", "notes")
    VALUES (${data.service}, ${data.category}, ${data.username}, ${data.encryptedPassword}, ${data.notes})
    RETURNING *
  `;
  return row;
}

export async function deleteCredential(id: string) {
  await sql`DELETE FROM "Credential" WHERE "id" = ${id}`;
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
  const [row] = await sql`
    UPDATE "Credential"
    SET
      "service" = COALESCE(${data.service}, "service"),
      "category" = COALESCE(${data.category}, "category"),
      "username" = COALESCE(${data.username}, "username"),
      "password" = COALESCE(${data.encryptedPassword}, "password"),
      "notes" = COALESCE(${data.notes}, "notes")
    WHERE "id" = ${id}
    RETURNING *
  `;
  return row;
}
