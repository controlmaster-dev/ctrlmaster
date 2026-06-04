-- Tareas generales: visibles y asignadas a todo el equipo del tablero
ALTER TABLE "OperatorDuty"
  ADD COLUMN IF NOT EXISTS "isGeneral" BOOLEAN NOT NULL DEFAULT false;
