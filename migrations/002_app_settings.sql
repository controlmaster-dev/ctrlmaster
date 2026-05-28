-- ============================================================
-- App settings: simple key/value store for runtime toggles
-- (replaces writing to the .env file, which is read-only on Vercel)
-- ============================================================

CREATE TABLE IF NOT EXISTS "AppSetting" (
  "key"       TEXT PRIMARY KEY,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the social live-toggle flags from their previous env defaults.
INSERT INTO "AppSetting" ("key", "value")
VALUES ('YOUTUBE_MANUAL_LIVE', 'false'),
       ('FACEBOOK_MANUAL_LIVE', 'false')
ON CONFLICT ("key") DO NOTHING;
