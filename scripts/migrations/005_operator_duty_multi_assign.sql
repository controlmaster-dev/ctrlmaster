-- Permitir la misma función en varios operadores (dutyId + userId únicos)

ALTER TABLE "OperatorDutyAssignment"
  DROP CONSTRAINT IF EXISTS "OperatorDutyAssignment_dutyId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "OperatorDutyAssignment_dutyId_userId_key"
  ON "OperatorDutyAssignment" ("dutyId", "userId");
