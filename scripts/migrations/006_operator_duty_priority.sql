-- Prioridad por función (catálogo global)
ALTER TABLE "OperatorDuty"
  ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'medium';

UPDATE "OperatorDuty"
SET "priority" = 'medium'
WHERE "priority" IS NULL OR "priority" NOT IN ('low', 'medium', 'high', 'urgent');
