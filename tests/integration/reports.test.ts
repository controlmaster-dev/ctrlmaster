import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import {
  GET as reportsGet,
  POST as reportsPost,
  DELETE as reportsDelete,
} from '../../src/app/api/reports/route';
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
import { createTestReport, createTestUser } from '../helpers/fixtures';

async function loginAs(email: string, password: string) {
  const res = await loginPost(
    createJsonRequest('/api/auth/login', { email, password })
  );
  const token = extractAuthToken(res);
  assert.ok(token);
  return token!;
}

describe('integration/reports', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('OPERATOR puede crear y listar reportes', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const operator = await createTestUser('OPERATOR');
    const token = await loginAs(operator.email, operator.password);

    const createRes = await invokeRoute(
      reportsPost,
      createJsonRequest(
        '/api/reports',
        {
          operatorId: operator.id,
          operatorName: operator.name,
          operatorEmail: operator.email,
          problemDescription: 'Incidencia de prueba',
          category: 'Transmisión',
          priority: 'Enlace',
          status: 'pending',
          dateStarted: new Date().toISOString(),
        },
        { authToken: token }
      )
    );

    assert.equal(createRes.status, 201);

    const listRes = await invokeRoute(
      reportsGet,
      createJsonRequest('/api/reports', undefined, {
        method: 'GET',
        authToken: token,
      })
    );

    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { reports: Array<{ id: string }> };
    assert.ok(listBody.reports.length >= 1);
  });

  it('OPERATOR no puede eliminar reportes', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const operator = await createTestUser('OPERATOR');
    const token = await loginAs(operator.email, operator.password);
    const reportId = await createTestReport({
      operatorId: operator.id,
      operatorName: operator.name,
      operatorEmail: operator.email,
    });

    const deleteRes = await invokeRoute(
      reportsDelete,
      createJsonRequest(`/api/reports?id=${reportId}`, undefined, {
        method: 'DELETE',
        authToken: token,
      })
    );

    assert.equal(deleteRes.status, 403);
  });

  it('ENGINEER puede eliminar reportes', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const operator = await createTestUser('OPERATOR');
    const engineer = await createTestUser('ENGINEER');
    const engineerToken = await loginAs(engineer.email, engineer.password);
    const reportId = await createTestReport({
      operatorId: operator.id,
      operatorName: operator.name,
      operatorEmail: operator.email,
    });

    const deleteRes = await invokeRoute(
      reportsDelete,
      createJsonRequest(`/api/reports?id=${reportId}`, undefined, {
        method: 'DELETE',
        authToken: engineerToken,
      })
    );

    assert.equal(deleteRes.status, 200);
  });
});
