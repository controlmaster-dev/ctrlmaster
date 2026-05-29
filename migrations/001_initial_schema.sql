


CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TABLE "User" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "email"           TEXT NOT NULL UNIQUE,
  "username"        TEXT UNIQUE,
  "password"        TEXT NOT NULL,
  "phone"           TEXT,
  "role"            TEXT NOT NULL DEFAULT 'OPERATOR',
  "lastLogin"       TIMESTAMPTZ,
  "lastLoginIP"     TEXT,
  "lastLoginCountry" TEXT,
  "currentPath"     TEXT,
  "lastActive"      TIMESTAMPTZ,
  "image"           TEXT,
  "birthday"        TEXT,
  "schedule"        TEXT,
  "tempSchedule"    TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "User_email_idx" ON "User" ("email");
CREATE INDEX "User_role_idx" ON "User" ("role");

CREATE TABLE "Report" (
  "id"                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "operatorId"         UUID NOT NULL REFERENCES "User" ("id"),
  "operatorName"       TEXT NOT NULL,
  "operatorEmail"      TEXT NOT NULL,
  "problemDescription" TEXT NOT NULL,
  "category"           TEXT NOT NULL,
  "priority"           TEXT NOT NULL,
  "status"             TEXT NOT NULL,
  "dateStarted"        TIMESTAMPTZ NOT NULL,
  "dateResolved"       TIMESTAMPTZ,
  "emailStatus"        TEXT NOT NULL DEFAULT 'none',
  "emailRecipients"    TEXT,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Report_operatorId_idx" ON "Report" ("operatorId");
CREATE INDEX "Report_status_idx" ON "Report" ("status");
CREATE INDEX "Report_priority_idx" ON "Report" ("priority");
CREATE INDEX "Report_createdAt_idx" ON "Report" ("createdAt");

CREATE TRIGGER "Report_updatedAt"
  BEFORE UPDATE ON "Report"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE "ReportView" (
  "id"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"   UUID NOT NULL REFERENCES "User" ("id"),
  "reportId" UUID NOT NULL REFERENCES "Report" ("id") ON DELETE CASCADE,
  "viewedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE ("userId", "reportId")
);

CREATE INDEX "ReportView_reportId_idx" ON "ReportView" ("reportId");
CREATE INDEX "ReportView_userId_idx" ON "ReportView" ("userId");

CREATE TABLE "Comment" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content"   TEXT NOT NULL,
  "authorId"  UUID NOT NULL REFERENCES "User" ("id"),
  "reportId"  UUID NOT NULL REFERENCES "Report" ("id") ON DELETE CASCADE,
  "parentId"  UUID REFERENCES "Comment" ("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Comment_reportId_idx" ON "Comment" ("reportId");
CREATE INDEX "Comment_authorId_idx" ON "Comment" ("authorId");
CREATE INDEX "Comment_parentId_idx" ON "Comment" ("parentId");

CREATE TABLE "CommentReaction" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "emoji"     TEXT NOT NULL,
  "authorId"  UUID NOT NULL REFERENCES "User" ("id"),
  "commentId" UUID NOT NULL REFERENCES "Comment" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE ("authorId", "commentId", "emoji")
);

CREATE INDEX "CommentReaction_commentId_idx" ON "CommentReaction" ("commentId");
CREATE INDEX "CommentReaction_authorId_idx" ON "CommentReaction" ("authorId");

CREATE TABLE "Reaction" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "emoji"     TEXT NOT NULL,
  "authorId"  UUID NOT NULL REFERENCES "User" ("id"),
  "reportId"  UUID NOT NULL REFERENCES "Report" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE ("authorId", "reportId", "emoji")
);

CREATE INDEX "Reaction_reportId_idx" ON "Reaction" ("reportId");
CREATE INDEX "Reaction_authorId_idx" ON "Reaction" ("authorId");

CREATE TABLE "Attachment" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "url"       TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "data"      TEXT,
  "reportId"  UUID NOT NULL REFERENCES "Report" ("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Attachment_reportId_idx" ON "Attachment" ("reportId");

CREATE TABLE "Task" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title"         TEXT NOT NULL,
  "description"   TEXT,
  "userId"        UUID NOT NULL REFERENCES "User" ("id"),
  "priority"      TEXT NOT NULL DEFAULT 'MEDIUM',
  "deadline"      TEXT,
  "scheduledDate" TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'PENDING',
  "reminderSent"  BOOLEAN NOT NULL DEFAULT FALSE,
  "comment"       TEXT,
  "completedAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "Task_userId_idx" ON "Task" ("userId");
CREATE INDEX "Task_status_idx" ON "Task" ("status");
CREATE INDEX "Task_scheduledDate_idx" ON "Task" ("scheduledDate");

CREATE TABLE "WorkSchedule" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "date"       DATE NOT NULL UNIQUE,
  "userId"     UUID NOT NULL REFERENCES "User" ("id"),
  "isOverride" BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX "WorkSchedule_userId_idx" ON "WorkSchedule" ("userId");
CREATE INDEX "WorkSchedule_date_idx" ON "WorkSchedule" ("date");

CREATE TABLE "StreamMetric" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel"   TEXT NOT NULL,
  "type"      TEXT NOT NULL,
  "value"     DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "StreamMetric_createdAt_idx" ON "StreamMetric" ("createdAt");
CREATE INDEX "StreamMetric_channel_idx" ON "StreamMetric" ("channel");
CREATE INDEX "StreamMetric_type_idx" ON "StreamMetric" ("type");

CREATE TABLE "ValidProgram" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"      TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "SpecialEvent" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "startDate" TEXT NOT NULL,
  "endDate"   TEXT NOT NULL,
  "isActive"  BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "SpecialEventShift" (
  "id"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES "SpecialEvent" ("id") ON DELETE CASCADE,
  "userId"  UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "date"    TEXT NOT NULL,
  "start"   INTEGER NOT NULL,
  "end"     INTEGER NOT NULL
);

CREATE INDEX "SpecialEventShift_userId_idx" ON "SpecialEventShift" ("userId");
CREATE INDEX "SpecialEventShift_date_idx" ON "SpecialEventShift" ("date");

CREATE TABLE "WeeklySchedule" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dayOfWeek" INTEGER NOT NULL UNIQUE,
  "userId"    UUID NOT NULL REFERENCES "User" ("id")
);

CREATE INDEX "WeeklySchedule_dayOfWeek_idx" ON "WeeklySchedule" ("dayOfWeek");

CREATE TABLE "Credential" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "service"   TEXT NOT NULL,
  "category"  TEXT NOT NULL,
  "username"  TEXT NOT NULL,
  "password"  TEXT NOT NULL,
  "notes"     TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER "Credential_updatedAt"
  BEFORE UPDATE ON "Credential"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE "RegistrationCode" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"        TEXT NOT NULL UNIQUE,
  "createdById" UUID NOT NULL,
  "usedById"    UUID,
  "usedAt"      TIMESTAMPTZ,
  "expiresAt"   TIMESTAMPTZ NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "RegistrationCode_code_idx" ON "RegistrationCode" ("code");
CREATE INDEX "RegistrationCode_createdById_idx" ON "RegistrationCode" ("createdById");

CREATE TABLE "SessionToken" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "token"     TEXT NOT NULL UNIQUE,
  "userId"    UUID NOT NULL REFERENCES "User" ("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "userAgent" TEXT,
  "ipAddress" TEXT
);

CREATE INDEX "SessionToken_token_idx" ON "SessionToken" ("token");
CREATE INDEX "SessionToken_userId_idx" ON "SessionToken" ("userId");
CREATE INDEX "SessionToken_expiresAt_idx" ON "SessionToken" ("expiresAt");
