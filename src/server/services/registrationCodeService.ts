import {
  listRegistrationCodes,
  findRegistrationCodeByCode,
  registrationCodeExists,
  insertRegistrationCode,
  deleteRegistrationCode,
  type RegistrationCodeRow,
} from "@/server/repositories/registrationCodeRepository";

export function generateRegistrationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(bytes[i] % chars.length);
  }
  return code;
}

export function mapRegistrationCodeStatus(codes: RegistrationCodeRow[]) {
  const now = new Date();
  return codes.map((c) => {
    let status = "available";
    if (c.usedById) status = "used";
    else if (new Date(c.expiresAt) < now) status = "expired";
    return { ...c, status };
  });
}

export async function getRegistrationCodes() {
  const codes = await listRegistrationCodes();
  return mapRegistrationCodeStatus(codes as unknown as RegistrationCodeRow[]);
}

export async function createRegistrationCode(createdById: string) {
  let code = generateRegistrationCode();
  let attempts = 0;
  while (attempts < 10) {
    const exists = await registrationCodeExists(code);
    if (!exists) break;
    code = generateRegistrationCode();
    attempts++;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return insertRegistrationCode(code, createdById, expiresAt);
}

export async function removeRegistrationCode(id: string) {
  await deleteRegistrationCode(id);
  return { success: true as const };
}

export async function validateRegistrationCodeForSignup(securityCode: string) {
  const normalized = securityCode.toUpperCase().trim();
  const registrationCode = await findRegistrationCodeByCode(normalized);
  return { registrationCode, normalized };
}
