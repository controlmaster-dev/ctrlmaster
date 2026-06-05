import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isConfigAdmin } from '../src/lib/adminAccess';

describe('adminAccess', () => {
  const original = process.env.CONFIG_ADMIN_EMAILS;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.CONFIG_ADMIN_EMAILS;
    } else {
      process.env.CONFIG_ADMIN_EMAILS = original;
    }
  });

  it('acepta emails por defecto', () => {
    delete process.env.CONFIG_ADMIN_EMAILS;
    assert.equal(isConfigAdmin({ email: 'knunez@enlace.org' }), true);
    assert.equal(isConfigAdmin({ username: 'rjimenez' }), true);
    assert.equal(isConfigAdmin({ email: 'other@test.local' }), false);
  });

  it('respeta CONFIG_ADMIN_EMAILS', () => {
    process.env.CONFIG_ADMIN_EMAILS = 'admin@example.com,ops@example.com';
    assert.equal(isConfigAdmin({ email: 'admin@example.com' }), true);
    assert.equal(isConfigAdmin({ username: 'ops' }), true);
    assert.equal(isConfigAdmin({ email: 'knunez@enlace.org' }), false);
  });
});
