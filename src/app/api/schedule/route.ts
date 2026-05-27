import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ApiError, ValidationError } from '@/lib/errors';
import { z } from 'zod';

const getScheduleSchema = z.object({
  start: z.string().min(1, 'Fecha de inicio es requerida'),
  end: z.string().min(1, 'Fecha de fin es requerida'),
});

const upsertScheduleSchema = z.object({
  date: z.string().min(1, 'Fecha es requerida'),
  userId: z.string().min(1, 'ID de usuario es requerido'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) return NextResponse.json([]);

    const result = getScheduleSchema.safeParse({ start, end });
    if (!result.success) {
      throw new ValidationError('Parámetros de fecha inválidos', result.error.issues);
    }

    const overrides = await sql`
      SELECT ws.*, row_to_json(u.*) AS "user"
      FROM "WorkSchedule" ws
      JOIN "User" u ON u."id" = ws."userId"
      WHERE ws."date" >= ${result.data.start}::date
        AND ws."date" <= ${result.data.end}::date
        AND ws."isOverride" = TRUE
    `;

    return NextResponse.json(overrides);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[GET /api/schedule] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = upsertScheduleSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { date, userId } = result.data;

    if (userId === 'reset') {
      await sql`DELETE FROM "WorkSchedule" WHERE "date" = ${date}::date`;
      return NextResponse.json({ success: true });
    }

    const [override] = await sql`
      INSERT INTO "WorkSchedule" ("date", "userId", "isOverride")
      VALUES (${date}::date, ${userId}, TRUE)
      ON CONFLICT ("date")
      DO UPDATE SET "userId" = EXCLUDED."userId", "isOverride" = TRUE
      RETURNING *
    `;

    return NextResponse.json(override);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/schedule] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
