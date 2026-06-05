import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { middleware } from '../../src/middleware';
import { clearSessionCache } from '../../src/lib/sessionMiddleware';
import {
  disconnectMongo,
  isMongoAvailable,
  resetDatabase,
} from '../helpers/db';
import { createSessionToken, createTestUser } from '../helpers/fixtures';

describe('integration/middleware', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) {
      await resetDatabase();
      clearSessionCache();
    }
  });

  after(async () => {
    clearSessionCache();
    if (mongoReady) await disconnectMongo();
  });

  it('permite /api/health sin autenticación', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const res = await middleware(new NextRequest('http://localhost/api/health'));
    assert.notEqual(res.status, 401);
  });

  it('permite /api/users/public sin autenticación', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const res = await middleware(
      new NextRequest('http://localhost/api/users/public')
    );
    assert.notEqual(res.status, 401);
  });

  it('bloquea /api/users sin autenticación', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const res = await middleware(new NextRequest('http://localhost/api/users'));
    assert.equal(res.status, 401);
  });

  it('bloquea APIs protegidas sin cookie', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const res = await middleware(
      new NextRequest('http://localhost/api/reports')
    );
    assert.equal(res.status, 401);
  });

  it('permite APIs protegidas con cookie presente (validación en la ruta API)', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    clearSessionCache();
    const res = await middleware(
      new NextRequest('http://localhost/api/reports', {
        headers: { Cookie: 'auth-token=invalid-token-value' },
      })
    );
    assert.notEqual(res.status, 401);
  });

  it('permite APIs protegidas con token válido en BD', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const user = await createTestUser('OPERATOR');
    const token = await createSessionToken(user.id);
    clearSessionCache();

    const res = await middleware(
      new NextRequest('http://localhost/api/reports', {
        headers: { Cookie: `auth-token=${token}` },
      })
    );

    assert.notEqual(res.status, 401);
  });

  it('permite /api/cron con CRON_SECRET válido', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const res = await middleware(
      new NextRequest('http://localhost/api/cron/cleanup-tokens', {
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      })
    );

    assert.notEqual(res.status, 401);
  });
});
