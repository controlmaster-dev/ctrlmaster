import sql from "@/lib/db";

export type SpecialEventRow = {
  shiftCount: number;
  [key: string]: unknown;
};

export async function listSpecialEvents() {
  return sql`
    SELECT se."id", se."name", se."startDate", se."endDate", se."isActive", se."createdAt",
           COALESCE(ses."shiftCount", 0)::int AS "shiftCount"
    FROM "SpecialEvent" se
    LEFT JOIN (
      SELECT "eventId", COUNT(*) AS "shiftCount" FROM "SpecialEventShift" GROUP BY "eventId"
    ) ses ON ses."eventId" = se."id"
    ORDER BY se."startDate" DESC
  `;
}

export function mapSpecialEvents(events: SpecialEventRow[]) {
  return events.map((e) => ({
    ...e,
    _count: { shifts: e.shiftCount },
  }));
}

export async function createSpecialEvent(name: string, startDate: string, endDate: string) {
  const [event] = await sql`
    INSERT INTO "SpecialEvent" ("name", "startDate", "endDate", "isActive")
    VALUES (${name}, ${startDate}, ${endDate}, TRUE)
    RETURNING *
  `;
  return event;
}

export async function deleteSpecialEvent(id: string) {
  await sql`DELETE FROM "SpecialEvent" WHERE "id" = ${id}`;
}

export async function updateSpecialEvent(data: {
  id: string;
  isActive?: boolean;
  name?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { id, isActive, name, startDate, endDate } = data;
  const [event] = await sql`
    UPDATE "SpecialEvent"
    SET
      "isActive" = COALESCE(${isActive ?? null}, "isActive"),
      "name" = COALESCE(${name ?? null}, "name"),
      "startDate" = COALESCE(${startDate ?? null}, "startDate"),
      "endDate" = COALESCE(${endDate ?? null}, "endDate")
    WHERE "id" = ${id}
    RETURNING *
  `;
  return event;
}

export async function listSpecialEventShifts(eventId: string) {
  return sql`
    SELECT ses.*,
           json_build_object('name', u."name", 'image', u."image") AS "user"
    FROM "SpecialEventShift" ses
    JOIN "User" u ON u."id" = ses."userId"
    WHERE ses."eventId" = ${eventId}
  `;
}

export type SpecialEventShiftInput = {
  date: string;
  start: string | number;
  end: string | number;
};

export async function replaceSpecialEventShifts(
  eventId: string,
  userId: string,
  shifts: SpecialEventShiftInput[]
) {
  await sql.begin(async (tx) => {
    await tx`
      DELETE FROM "SpecialEventShift"
      WHERE "eventId" = ${eventId} AND "userId" = ${userId}
    `;

    if (shifts.length > 0) {
      for (const s of shifts) {
        await tx`
          INSERT INTO "SpecialEventShift" ("eventId", "userId", "date", "start", "end")
          VALUES (${eventId}, ${userId}, ${s.date}, ${s.start}, ${s.end})
        `;
      }
    }
  });
}
