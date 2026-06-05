import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { POST as loginPost } from '../../src/app/api/auth/login/route';
import { POST as commentsPost } from '../../src/app/api/comments/route';
import { CommentModel } from '../../src/models';
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
import { createTestReport, createTestUser } from '../helpers/fixtures';

async function loginAs(email: string, password: string) {
  const res = await loginPost(
    createJsonRequest('/api/auth/login', { email, password })
  );
  const token = extractAuthToken(res);
  assert.ok(token);
  return token!;
}

describe('integration/comments', () => {
  let mongoReady = false;

  before(async () => {
    mongoReady = await isMongoAvailable();
    if (mongoReady) await resetDatabase();
  });

  after(async () => {
    if (mongoReady) await disconnectMongo();
  });

  it('asigna el autor desde la sesión aunque el cliente envíe userId falso', async (t) => {
    if (!mongoReady) return t.skip('MongoDB no disponible');

    const author = await createTestUser('OPERATOR');
    const other = await createTestUser('ENGINEER');
    const token = await loginAs(author.email, author.password);
    const reportId = await createTestReport({
      operatorId: author.id,
      operatorName: author.name,
      operatorEmail: author.email,
    });

    const res = await invokeRoute(
      commentsPost,
      createJsonRequest(
        '/api/comments',
        {
          reportId,
          content: 'Comentario de integración',
          userId: other.id,
          userName: 'Usuario Falso',
        },
        { authToken: token }
      )
    );

    assert.equal(res.status, 201);

    await connectMongo();
    const comments = await CommentModel.find({ reportId }).lean();
    assert.equal(comments.length, 1);
    assert.equal(String(comments[0].authorId), author.id);
  });
});
