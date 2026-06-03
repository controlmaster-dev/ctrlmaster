import sql from "@/lib/db";

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

export async function listRegistrationCodes() {
  return sql`
    SELECT * FROM "RegistrationCode" ORDER BY "createdAt" DESC
  `;
}

export async function findRegistrationCodeByCode(code: string) {
  const [row] = await sql`
    SELECT * FROM "RegistrationCode"
    WHERE "code" = ${code}
    LIMIT 1
  `;
  return row as RegistrationCodeRow | undefined;
}

export async function registrationCodeExists(code: string) {
  const [existing] = await sql`
    SELECT "id" FROM "RegistrationCode" WHERE "code" = ${code} LIMIT 1
  `;
  return !!existing;
}

export async function insertRegistrationCode(code: string, createdById: string, expiresAt: string) {
  const [registrationCode] = await sql`
    INSERT INTO "RegistrationCode" ("code", "createdById", "expiresAt")
    VALUES (${code}, ${createdById}, ${expiresAt})
    RETURNING *
  `;
  return registrationCode;
}

export async function deleteRegistrationCode(id: string) {
  await sql`DELETE FROM "RegistrationCode" WHERE "id" = ${id}`;
}

export async function markRegistrationCodeUsed(codeId: string, userId: string) {
  await sql`
    UPDATE "RegistrationCode"
    SET "usedById" = ${userId}, "usedAt" = NOW()
    WHERE "id" = ${codeId}
  `;
}
