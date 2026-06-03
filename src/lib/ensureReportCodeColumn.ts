import sql from "@/lib/db";

let ready: Promise<void> | null = null;

export async function ensureReportCodeColumn(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "code" TEXT`;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS "Report_code_unique" ON "Report" ("code")
      `;
    })();
  }
  await ready;
}
