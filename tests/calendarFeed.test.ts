import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyCalendarFeedToken } from '../src/lib/calendarFeedToken';

describe('verifyCalendarFeedToken', () => {
  it('accepts matching tokens', () => {
    const token = 'a'.repeat(64);
    assert.equal(verifyCalendarFeedToken(token, token), true);
  });

  it('rejects missing or mismatched tokens', () => {
    assert.equal(verifyCalendarFeedToken(null, 'abc'), false);
    assert.equal(verifyCalendarFeedToken('abc', null), false);
    assert.equal(verifyCalendarFeedToken('short', 'longer-token-value'), false);
    assert.equal(verifyCalendarFeedToken('token-a', 'token-b'), false);
  });
});
