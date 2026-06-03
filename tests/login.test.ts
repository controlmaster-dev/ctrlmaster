import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/auth/login/route';

describe('POST /api/auth/login', () => {
  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '', password: '' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);

    const body = (await res.json()) as { error?: string };
    assert.ok(body.error);
  });
});
