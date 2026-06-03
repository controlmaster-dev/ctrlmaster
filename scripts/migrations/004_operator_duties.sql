-- Funciones obligatorias por operador (diarios / perfil operativo)
-- User.id es UUID; dutyId referencia OperatorDuty.id (TEXT).

CREATE TABLE IF NOT EXISTS "OperatorDuty" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OperatorDutyAssignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "dutyId" TEXT NOT NULL REFERENCES "OperatorDuty"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("dutyId", "userId")
);

CREATE INDEX IF NOT EXISTS "OperatorDutyAssignment_userId_idx"
  ON "OperatorDutyAssignment" ("userId");
