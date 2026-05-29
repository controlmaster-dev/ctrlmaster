


CREATE TABLE IF NOT EXISTS "AppSetting" (
  "key"       TEXT PRIMARY KEY,
  "value"     TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "AppSetting" ("key", "value")
VALUES ('YOUTUBE_MANUAL_LIVE', 'false'),
       ('FACEBOOK_MANUAL_LIVE', 'false')
ON CONFLICT ("key") DO NOTHING;
