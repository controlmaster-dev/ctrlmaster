import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PATCH as patchUser } from '../../src/app/api/users/route';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { UserModel } from '../../src/models';
import { verifyPassword } from '../../src/lib/crypto';
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
import { createTestUser, createSessionToken } from '../helpers/fixtures';

describe('integration/users', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('PATCH con password la guarda hasheada con scrypt', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const admin = await createTestUser('BOSS');
    const operator = await createTestUser('OPERATOR');
    const newPassword = 'NuevaClave456!';

    const res = await invokeRoute(
      patchUser,
      createJsonRequest(
        '/api/users',
        { id: operator.id, password: newPassword },
        { method: 'PATCH', authToken: await createSessionToken(admin.id) }
      )
    );

    assert.equal(res.status, 200);

    const stored = await UserModel.findById(operator.id).select('password').lean();
    assert.ok(stored?.password?.startsWith('scrypt$'));

    const matches = await verifyPassword(newPassword, stored!.password);
    assert.equal(matches, true);

    const loginRes = await loginPost(
      createJsonRequest('/api/auth/login', {
        email: operator.email,
        password: newPassword,
      })
    );
    assert.equal(loginRes.status, 200);
    assert.ok(extractAuthToken(loginRes));
  });
});
