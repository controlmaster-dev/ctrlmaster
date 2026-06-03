/**
 * Migra códigos de reporte al formato canal + correlativo (ENL-0001, TX-0042, …).
 *
 * Uso:
 *   npx tsx scripts/migrate-report-codes.ts --dry-run
 *   npx tsx scripts/migrate-report-codes.ts
 *
 * Requiere DATABASE_URL en .env (raíz del proyecto).
 */

import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });

type ReportRow = {
  id: string;
  code: string | null;
  category: string;
  priority: string;
  createdAt: Date;
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const { default: sql } = await import("../src/lib/db");
  const { ensureReportCodeColumn } = await import("../src/lib/ensureReportCodeColumn");
  const {
    formatReportCode,
    needsReportCodeMigration,
    resolveReportCodePrefix,
    seedPrefixCountersFromCodes,
  } = await import("../src/lib/reportCode");

  await ensureReportCodeColumn();

  const rows = await sql<ReportRow[]>`
    SELECT "id", "code", "category", "priority", "createdAt"
    FROM "Report"
    ORDER BY "createdAt" ASC
  `;

  const counters = seedPrefixCountersFromCodes(rows.map((r) => r.code));
  const plan: Array<{ id: string; from: string | null; to: string }> = [];

  for (const row of rows) {
    if (!needsReportCodeMigration(row.code)) continue;

    const prefix = resolveReportCodePrefix(row.category, row.priority);
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    const newCode = formatReportCode(prefix, counters[prefix]);

    plan.push({
      id: row.id,
      from: row.code,
      to: newCode,
    });
  }

  console.log(`Reportes en BD: ${rows.length}`);
  console.log(`A migrar: ${plan.length}`);
  if (plan.length === 0) {
    console.log("Nada que actualizar.");
    await sql.end({ timeout: 5 });
    return;
  }

  console.log("\nVista previa (primeros 15):");
  for (const item of plan.slice(0, 15)) {
    console.log(`  ${item.from ?? "(vacío)"} → ${item.to}`);
  }
  if (plan.length > 15) console.log(`  … y ${plan.length - 15} más`);

  if (dryRun) {
    console.log("\n[dry-run] No se escribió nada en la base de datos.");
    await sql.end({ timeout: 5 });
    return;
  }

  await sql.begin(async (tx) => {
    for (const item of plan) {
      await tx`UPDATE "Report" SET "code" = ${item.to} WHERE "id" = ${item.id}`;
    }
  });

  console.log(`\nMigración completada: ${plan.length} códigos actualizados.`);
  await sql.end({ timeout: 5 });
}

main().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
