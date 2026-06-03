import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NextResponse } from 'next/server';
import { requireRole } from '../src/lib/roles';

describe('requireRole', () => {
  it('allows matching roles', () => {
    const result = requireRole({ role: 'ADMIN' }, ['ADMIN', 'BOSS']);
    assert.equal('authorized' in result, true);
  });

  it('denies insufficient role', () => {
    const result = requireRole({ role: 'OPERATOR' }, ['ADMIN', 'BOSS']);
    assert.ok(result instanceof NextResponse);
    assert.equal(result.status, 403);
  });
});
