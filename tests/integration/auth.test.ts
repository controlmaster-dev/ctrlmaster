import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { GET as verifyGet } from '../../src/app/api/auth/verify/route';
import { POST as logoutPost } from '../../src/app/api/auth/logout/route';
import { validateSessionToken } from '../../src/lib/auth';
import { SessionTokenModel } from '../../src/models';
import { connectMongo } from '../../src/lib/mongo';
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

describe('integration/auth', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('login válido crea sesión y cookie auth-token', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const user = await createTestUser('OPERATOR');
    const res = await loginPost(
      createJsonRequest('/api/auth/login', {
        email: user.email,
        password: user.password,
      })
    );

    assert.equal(res.status, 200);
    const token = extractAuthToken(res);
    assert.ok(token);

    const valid = await validateSessionToken(token!);
    assert.equal(valid, true);
  });

  it('login inválido devuelve 401', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    await createTestUser('OPERATOR', { email: 'known@test.local' });
    const res = await loginPost(
      createJsonRequest('/api/auth/login', {
        email: 'known@test.local',
        password: 'wrong-password',
      })
    );

    assert.equal(res.status, 401);
  });

  it('verify devuelve usuario autenticado con token válido', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const user = await createTestUser('ENGINEER');
    const loginRes = await loginPost(
      createJsonRequest('/api/auth/login', {
        email: user.email,
        password: user.password,
      })
    );
    const token = extractAuthToken(loginRes);
    assert.ok(token);

    const verifyRes = await invokeRoute(
      verifyGet,
      createJsonRequest('/api/auth/verify', undefined, {
        method: 'GET',
        authToken: token!,
      })
    );

    assert.equal(verifyRes.status, 200);
    const body = (await verifyRes.json()) as {
      authenticated: boolean;
      user?: { id: string; email: string };
    };
    assert.equal(body.authenticated, true);
    assert.equal(body.user?.id, user.id);
    assert.equal(body.user?.email, user.email);
  });

  it('logout revoca el token de sesión', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const user = await createTestUser('OPERATOR');
    const loginRes = await loginPost(
      createJsonRequest('/api/auth/login', {
        email: user.email,
        password: user.password,
      })
    );
    const token = extractAuthToken(loginRes);
    assert.ok(token);

    const logoutRes = await invokeRoute(
      logoutPost,
      createJsonRequest('/api/auth/logout', undefined, {
        method: 'POST',
        authToken: token!,
      })
    );
    assert.equal(logoutRes.status, 200);

    const stillValid = await validateSessionToken(token!);
    assert.equal(stillValid, false);
  });

  it('token expirado no es válido', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const user = await createTestUser('OPERATOR');
    const expiredToken = 'expired-test-token';

    await connectMongo();
    await SessionTokenModel.create({
      _id: expiredToken,
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000),
      userAgent: '',
      ipAddress: '',
    });

    const valid = await validateSessionToken(expiredToken);
    assert.equal(valid, false);
  });
});
