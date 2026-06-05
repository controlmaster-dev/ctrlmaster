import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { POST as uploadRoute } from '../../src/app/api/upload/route';
import { createJsonRequest, extractAuthToken } from '../helpers/http';
import {
  createTestUser,
  createUploadRequest,
  minimalPngBuffer,
} from '../helpers/fixtures';
import {
  disconnectMongo,
  isMongoAvailable,
  resetDatabase,
} from '../helpers/db';

describe('integration/upload', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('rechaza upload sin sesión', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const req = new NextRequest('http://localhost/api/upload', { method: 'POST' });
    const res = await uploadRoute(req);
    assert.equal(res.status, 401);
  });

  it('acepta PNG válido con sesión y claves de cifrado', async (t) => {
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

    const uploadReq = createUploadRequest(token!, minimalPngBuffer());
    const res = await uploadRoute(new NextRequest(uploadReq));

    assert.equal(res.status, 200);
    const body = (await res.json()) as { success: boolean; url: string };
    assert.equal(body.success, true);
    assert.match(body.url, /^\/api\/uploads\//);
  });
});
