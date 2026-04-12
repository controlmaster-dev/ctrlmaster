/**
 * Schedule API route with input validation and typed error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Return empty if no range provided (non-breaking)
    if (!start || !end) return NextResponse.json([]);

    const result = getScheduleSchema.safeParse({ start, end });
    if (!result.success) {
      throw new ValidationError('Parámetros de fecha inválidos', result.error.issues);
    }

    const overrides = await prisma.workSchedule.findMany({
      where: {
        date: {
          gte: new Date(result.data.start),
          lte: new Date(result.data.end),
        },
        isOverride: true,
      },
      include: { user: true },
    });

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
    const parsedDate = new Date(date);

    // Special "reset" sentinel — clears overrides for a given date
    if (userId === 'reset') {
      await prisma.workSchedule.deleteMany({ where: { date: parsedDate } });
      return NextResponse.json({ success: true });
    }

    const override = await prisma.workSchedule.upsert({
      where: { date: parsedDate },
      update: { userId, isOverride: true },
      create: { date: parsedDate, userId, isOverride: true },
    });

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