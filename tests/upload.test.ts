import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/upload/route';

describe('POST /api/upload', () => {
  it('rejects requests without a valid session', async () => {
    const req = new NextRequest('http://localhost/api/upload', { method: 'POST' });
    const res = await POST(req);
    assert.equal(res.status, 401);
  });
});
