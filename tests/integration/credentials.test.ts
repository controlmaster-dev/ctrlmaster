import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { GET as credentialsGet, POST as credentialsPost } from '../../src/app/api/credentials/route';
import {
  createJsonRequest,
  extractAuthToken,
  invokeRoute,
} from '../helpers/http';
import {
  disconnectMongo,
  isMongoAvailable,
  resetDatabase,
} from '../helpers/db';
import { createTestUser } from '../helpers/fixtures';
import { isEncrypted } from '../../src/lib/encryption';
import { CredentialModel } from '../../src/models';
import { connectMongo } from '../../src/lib/mongo';

async function loginAs(email: string, password: string) {
  const res = await loginPost(
    createJsonRequest('/api/auth/login', { email, password })
  );
  const token = extractAuthToken(res);
  assert.ok(token);
  return token!;
}

describe('integration/credentials', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('OPERATOR no puede leer credenciales', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const operator = await createTestUser('OPERATOR');
    const token = await loginAs(operator.email, operator.password);

    const res = await invokeRoute(
      credentialsGet,
      createJsonRequest('/api/credentials', undefined, {
        method: 'GET',
        authToken: token,
      })
    );

    assert.equal(res.status, 403);
  });

  it('ENGINEER puede crear y listar credenciales cifradas', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const engineer = await createTestUser('ENGINEER');
    const token = await loginAs(engineer.email, engineer.password);

    const createRes = await invokeRoute(
      credentialsPost,
      createJsonRequest(
        '/api/credentials',
        {
          service: 'Test Service',
          category: 'General',
          username: 'admin',
          password: 'SecretPass123',
          notes: 'integration test',
        },
        { authToken: token }
      )
    );

    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as {
      password: string;
      service: string;
    };
    assert.equal(created.service, 'Test Service');
    assert.equal(created.password, 'SecretPass123');

    const listRes = await invokeRoute(
      credentialsGet,
      createJsonRequest('/api/credentials', undefined, {
        method: 'GET',
        authToken: token,
      })
    );

    assert.equal(listRes.status, 200);
    const rows = (await listRes.json()) as Array<{ password: string }>;
    assert.ok(rows.length >= 1);
    assert.equal(rows[0].password, 'SecretPass123');

    await connectMongo();
    const stored = await CredentialModel.findOne({ service: 'Test Service' }).lean();
    assert.ok(stored);
    assert.equal(isEncrypted(stored!.password), true);
  });
});
