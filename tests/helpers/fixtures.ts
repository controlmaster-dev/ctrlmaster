import { randomUUID } from 'node:crypto';
import { hashPassword } from '../../src/lib/crypto';
import { createToken } from '../../src/lib/auth';
import { connectMongo } from '../../src/lib/mongo';
import { ReportModel, UserModel } from '../../src/models';

export type TestUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
};

export async function createTestUser(
  role: string,
  overrides: Partial<Pick<TestUser, 'email' | 'name'>> = {}
): Promise<TestUser> {
  await connectMongo();

  const id = randomUUID();
  const email = overrides.email ?? `user-${id}@test.local`;
  const password = 'TestPassword123!';
  const name = overrides.name ?? `Test ${role}`;

  await UserModel.create({
    _id: id,
    name,
    email,
    username: null,
    password: await hashPassword(password),
    role,
    image: null,
  });

  return { id, email, password, name, role };
}

export async function createSessionToken(userId: string): Promise<string> {
  return createToken(userId);
}

export async function createTestReport(input: {
  operatorId: string;
  operatorName: string;
  operatorEmail?: string;
}) {
  await connectMongo();

  const id = randomUUID();
  await ReportModel.create({
    _id: id,
    operatorId: input.operatorId,
    operatorName: input.operatorName,
    operatorEmail: input.operatorEmail ?? 'operator@test.local',
    problemDescription: 'Falla de prueba en integración',
    category: 'Transmisión',
    priority: 'Enlace',
    status: 'pending',
    dateStarted: new Date(),
    dateResolved: null,
    createdAt: new Date(),
  });

  return id;
}

/** PNG mínimo válido para tests de upload (firma PNG). */
export function minimalPngBuffer(): Buffer {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([header, Buffer.alloc(32)]);
}

export function createUploadRequest(token: string, fileBuffer: Buffer) {
  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  form.append('file', blob, 'test.png');

  return new Request('http://localhost/api/upload', {
    method: 'POST',
    headers: {
      Cookie: `auth-token=${token}`,
    },
    body: form,
  });
}
