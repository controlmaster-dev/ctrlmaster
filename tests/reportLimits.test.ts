import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const reportListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
});

const bootstrapQuerySchema = z.object({
  reportsLimit: z.coerce.number().int().min(1).max(50).optional().default(25),
  commentsLimit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

describe('report limits', () => {
  it('usa default 25 y cap 100 en listado', () => {
    assert.equal(reportListQuerySchema.parse({}).limit, 25);
    assert.equal(reportListQuerySchema.parse({ limit: '100' }).limit, 100);
    assert.throws(() => reportListQuerySchema.parse({ limit: '101' }));
  });

  it('limita bootstrap a 50 reportes y 20 comentarios', () => {
    assert.equal(bootstrapQuerySchema.parse({}).reportsLimit, 25);
    assert.equal(bootstrapQuerySchema.parse({ reportsLimit: '50' }).reportsLimit, 50);
    assert.throws(() => bootstrapQuerySchema.parse({ reportsLimit: '51' }));
    assert.throws(() => bootstrapQuerySchema.parse({ commentsLimit: '21' }));
  });
});
