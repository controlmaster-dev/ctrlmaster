


CREATE TABLE IF NOT EXISTS "RateLimit" (
  "key"       TEXT PRIMARY KEY,
  "count"     INTEGER NOT NULL DEFAULT 0,
  "resetAt"   TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "RateLimit_resetAt_idx" ON "RateLimit" ("resetAt");
