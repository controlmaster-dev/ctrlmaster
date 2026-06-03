import sql from "@/lib/db";

let ready: Promise<void> | null = null;

async function ensureMultiAssignUniqueIndex() {
  await sql`
    ALTER TABLE "OperatorDutyAssignment"
    DROP CONSTRAINT IF EXISTS "OperatorDutyAssignment_dutyId_key"
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "OperatorDutyAssignment_dutyId_userId_key"
      ON "OperatorDutyAssignment" ("dutyId", "userId")
  `;
}

async function bootstrapOperatorDutyTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS "OperatorDuty" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [assignmentTable] = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'OperatorDutyAssignment'
    ) AS exists
  `;

  if (!assignmentTable?.exists) {
    await sql`
      CREATE TABLE "OperatorDutyAssignment" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "dutyId" TEXT NOT NULL REFERENCES "OperatorDuty"("id") ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("dutyId", "userId")
      )
    `;
  } else {
    const [userIdCol] = await sql<{ data_type: string }[]>`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'OperatorDutyAssignment'
        AND column_name = 'userId'
      LIMIT 1
    `;
    if (userIdCol?.data_type !== "uuid") {
      await sql`DROP TABLE IF EXISTS "OperatorDutyAssignment"`;
      await sql`
        CREATE TABLE "OperatorDutyAssignment" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "dutyId" TEXT NOT NULL REFERENCES "OperatorDuty"("id") ON DELETE CASCADE,
          "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "assignedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE ("dutyId", "userId")
        )
      `;
    } else {
      await ensureMultiAssignUniqueIndex();
    }
  }

  await sql`
    CREATE INDEX IF NOT EXISTS "OperatorDutyAssignment_userId_idx"
      ON "OperatorDutyAssignment" ("userId")
  `;
}

export async function ensureOperatorDutyTables(): Promise<void> {
  if (!ready) {
    ready = bootstrapOperatorDutyTables().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
}
