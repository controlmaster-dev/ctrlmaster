import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCommentSchema, createReactionSchema } from '../src/lib/validation';

describe('comment validation schemas', () => {
  it('createCommentSchema does not accept spoofed author fields', () => {
    const result = createCommentSchema.safeParse({
      reportId: 'report-1',
      content: 'Hola',
      userId: 'other-user',
      userName: 'Otro Usuario',
    });

    assert.equal(result.success, true);
    if (result.success) {
      assert.equal('userId' in result.data, false);
      assert.equal('userName' in result.data, false);
    }
  });

  it('createReactionSchema only requires report and emoji', () => {
    const result = createReactionSchema.safeParse({
      reportId: 'report-1',
      emoji: '👍',
    });

    assert.equal(result.success, true);
  });
});
