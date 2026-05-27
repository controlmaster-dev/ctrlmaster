import { NextResponse } from 'next/server';
import { checkMultiviewStatus } from '@/lib/monitor';
import sql from '@/lib/db';

export async function GET() {
  try {
    console.log("[Cron] Starting Multiview Monitor...");
    const result = await checkMultiviewStatus();

    if (result.status === 'ERROR' || result.status === 'WARNING') {
      const [admin] = await sql`
        SELECT * FROM "User"
        WHERE "role" IN ('BOSS', 'ADMIN')
        LIMIT 1
      `;

      if (admin) {
        const [recentReport] = await sql`
          SELECT "id" FROM "Report"
          WHERE "dateStarted" > ${new Date(Date.now() - 60 * 60 * 1000).toISOString()}
            AND "operatorName" = 'Monitoreo Automático'
          LIMIT 1
        `;

        if (!recentReport) {
          await sql`
            INSERT INTO "Report" (
              "operatorId", "operatorName", "operatorEmail",
              "problemDescription", "category", "priority",
              "status", "dateStarted"
            )
            VALUES (
              ${admin.id}, 'Monitoreo Automático', 'bot@enlace.org',
              ${`[ALERTA MULTIVIEW] ${result.details}`},
              'SISTEMA', 'ALTA', 'pending',
              ${new Date().toISOString()}
            )
          `;
          console.log("[Cron] Report created.");
        } else {
          console.log("[Cron] Skipping report creation (active report exists).");
        }
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error("[Cron] Monitor failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
