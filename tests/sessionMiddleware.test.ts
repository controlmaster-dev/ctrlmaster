import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { NextRequest } from 'next/server';
import {
  clearSessionCache,
  hasAuthCookies,
} from '../src/lib/sessionMiddleware';

function mockRequest(cookies: Record<string, string>): NextRequest {
  return {
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { name, value } : undefined;
      },
    },
  } as NextRequest;
}

describe('sessionMiddleware', () => {
  beforeEach(() => {
    clearSessionCache();
  });

  describe('hasAuthCookies', () => {
    it('returns false when auth-token is missing', () => {
      assert.equal(hasAuthCookies(mockRequest({})), false);
      assert.equal(
        hasAuthCookies(mockRequest({ 'user-id': 'user-1' })),
        false
      );
    });

    it('returns true when auth-token is present', () => {
      assert.equal(
        hasAuthCookies(
          mockRequest({
            'auth-token': 'token-1',
          })
        ),
        true
      );
    });
  });
});
