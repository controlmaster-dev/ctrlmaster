
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

  const { connectMongo } = await import("../src/lib/mongo");
  const { ReportModel } = await import("../src/models");
  const {
    formatReportCode,
    needsReportCodeMigration,
    resolveReportCodePrefix,
    seedPrefixCountersFromCodes,
  } = await import("../src/lib/reportCode");

  await connectMongo();

  const docs = await ReportModel.find()
    .select("code category priority createdAt")
    .sort({ createdAt: 1 })
    .lean();

  const rows: ReportRow[] = docs.map((d) => ({
    id: String(d._id),
    code: d.code ?? null,
    category: d.category,
    priority: d.priority,
    createdAt: d.createdAt,
  }));

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
    process.exit(0);
  }

  console.log("\nVista previa (primeros 15):");
  for (const item of plan.slice(0, 15)) {
    console.log(`  ${item.from ?? "(vacío)"} → ${item.to}`);
  }
  if (plan.length > 15) console.log(`  … y ${plan.length - 15} más`);

  if (dryRun) {
    console.log("\n[dry-run] No se escribió nada en la base de datos.");
    process.exit(0);
  }

  for (const item of plan) {
    await ReportModel.findByIdAndUpdate(item.id, { code: item.to });
  }

  console.log(`\nMigración completada: ${plan.length} códigos actualizados.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
