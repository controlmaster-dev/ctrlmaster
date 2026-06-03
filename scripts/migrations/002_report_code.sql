-- Código legible del reporte (ENL4829K17); el id sigue siendo UUID.
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Report_code_unique" ON "Report" ("code");
