import sql from "@/lib/db";

export async function listScheduleOverrides(start: string, end: string) {
  return sql`
    SELECT ws.*, json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS "user"
    FROM "WorkSchedule" ws
    JOIN "User" u ON u."id" = ws."userId"
    WHERE ws."date" >= ${start}::date
      AND ws."date" <= ${end}::date
      AND ws."isOverride" = TRUE
  `;
}

export async function resetScheduleOverride(date: string) {
  await sql`DELETE FROM "WorkSchedule" WHERE "date" = ${date}::date`;
}

export async function upsertScheduleOverride(date: string, userId: string) {
  const [override] = await sql`
    INSERT INTO "WorkSchedule" ("date", "userId", "isOverride")
    VALUES (${date}::date, ${userId}, TRUE)
    ON CONFLICT ("date")
    DO UPDATE SET "userId" = EXCLUDED."userId", "isOverride" = TRUE
    RETURNING *
  `;
  return override;
}

export async function listWeeklyScheduleConfig() {
  return sql`
    SELECT ws.*, json_build_object('id', u."id", 'name', u."name", 'image', u."image") AS "user"
    FROM "WeeklySchedule" ws
    JOIN "User" u ON u."id" = ws."userId"
  `;
}

export type WeeklyScheduleItem = {
  dayOfWeek: number;
  userId: string;
};

export async function saveWeeklyScheduleConfig(schedule: WeeklyScheduleItem[]) {
  if (schedule.length === 0) return;

  await sql.begin(async (tx) => {
    for (const item of schedule) {
      if (item.userId === "REMOVE") {
        await tx`DELETE FROM "WeeklySchedule" WHERE "dayOfWeek" = ${item.dayOfWeek}`;
      } else {
        await tx`
          INSERT INTO "WeeklySchedule" ("dayOfWeek", "userId")
          VALUES (${item.dayOfWeek}, ${item.userId})
          ON CONFLICT ("dayOfWeek")
          DO UPDATE SET "userId" = EXCLUDED."userId"
        `;
      }
    }
  });
}
