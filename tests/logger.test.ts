import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serializeError } from '../src/lib/logger';

describe('logger', () => {
  it('serializa errores estándar', () => {
    const meta = serializeError(new Error('fallo de prueba'));
    assert.equal(meta.errorName, 'Error');
    assert.equal(meta.errorMessage, 'fallo de prueba');
  });
});
