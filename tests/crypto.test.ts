import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { hashPassword, verifyPassword } from '../src/lib/crypto';

describe('crypto', () => {
  it('verifica contraseñas scrypt', async () => {
    const hash = await hashPassword('secret-pass');
    assert.equal(await verifyPassword('secret-pass', hash), true);
    assert.equal(await verifyPassword('wrong-pass', hash), false);
  });

  it('verifica hashes legacy sha256', async () => {
    const legacy = createHash('sha256').update('legacy-pass').digest('hex');
    assert.equal(await verifyPassword('legacy-pass', legacy), true);
    assert.equal(await verifyPassword('legacy-pass', 'legacy-pass'), false);
  });
});
