import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getProductionEnvErrors } from '../src/lib/envValidation';

const VALID_KEY = Buffer.alloc(32, 1).toString('base64');

describe('envValidation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips validation outside production', () => {
    process.env.NODE_ENV = 'development';
    assert.deepEqual(getProductionEnvErrors(), []);
  });

  it('reports missing production variables', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;
    delete process.env.MONGO_URI;
    delete process.env.CRON_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    delete process.env.FILE_ENC_KEY;

    const errors = getProductionEnvErrors();
    assert.ok(errors.some((error) => error.includes('MONGODB_URI')));
    assert.ok(errors.some((error) => error.includes('CREDENTIALS_ENC_KEY')));
    assert.ok(!errors.some((error) => error.includes('CRON_SECRET')));
  });

  it('skips validation during next production build phase', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PHASE = 'phase-production-build';
    delete process.env.MONGODB_URI;
    delete process.env.CRON_SECRET;

    assert.deepEqual(getProductionEnvErrors(), []);
  });

  it('accepts valid production configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/controlmaster';
    process.env.CRON_SECRET = 'cron-secret';
    process.env.CREDENTIALS_ENC_KEY = VALID_KEY;
    process.env.FILE_ENC_KEY = VALID_KEY;

    assert.deepEqual(getProductionEnvErrors(), []);
  });
});
