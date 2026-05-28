import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { ApiError, ValidationError } from '@/lib/errors';
import { validateApiAuth, requireRole } from '@/lib/apiAuth';
import { z } from 'zod';

const TASK_ADMIN_ROLES = ['ADMIN', 'BOSS', 'ENGINEER'];

const getTasksSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  date: z.string().optional(),
});

const createTasksSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  tasks: z.array(
    z.object({
      title: z.string().min(1, 'El título es requerido'),
      deadline: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:mm)').optional().nullable(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
    })
  ).min(1, 'Se requiere al menos una tarea'),
  dates: z.array(z.string().min(1)).min(1, 'Se requieren fechas'),
});

const updateTaskSchema = z.object({
  id: z.string().min(1, 'ID de tarea es requerido'),
  status: z.enum(['PENDING', 'COMPLETED', 'INCOMPLETE']).optional(),
  comment: z.string().optional(),
});

const deleteTaskSchema = z.object({
  id: z.string().min(1, 'ID de tarea es requerido'),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(req.url);
    const result = getTasksSchema.safeParse({
      userId: searchParams.get('userId'),
      date: searchParams.get('date') ?? undefined,
    });

    if (!result.success) {
      throw new ValidationError('Parámetros de búsqueda inválidos', result.error.issues);
    }

    const { userId, date } = result.data;

    const tasks = await sql`
      SELECT * FROM "Task"
      WHERE "userId" = ${userId}
      ${date ? sql`AND "scheduledDate" = ${date}` : sql``}
      ORDER BY "createdAt" DESC
    `;

    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[GET /api/tasks] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const roleResult = requireRole(authResult.user, TASK_ADMIN_ROLES);
    if (roleResult instanceof NextResponse) return roleResult;

    const body = await req.json();
    const result = createTasksSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { userId, tasks, dates } = result.data;

    // Create all tasks in a transaction
    const created = await sql.begin(async (tx) => {
      const results = [];
      for (const dateStr of dates) {
        for (const t of tasks) {
          const [task] = await tx`
            INSERT INTO "Task" ("title", "deadline", "priority", "userId", "scheduledDate", "status")
            VALUES (${t.title}, ${t.deadline || null}, ${t.priority}, ${userId}, ${dateStr}, 'PENDING')
            RETURNING *
          `;
          results.push(task);
        }
      }
      return results;
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[POST /api/tasks] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      throw new ValidationError('Datos de entrada inválidos', result.error.issues);
    }

    const { id, status, comment } = result.data;

    const data: Record<string, any> = {};

    if (comment !== undefined) data.comment = comment;
    if (status !== undefined) {
      data.status = status;
      if (['COMPLETED', 'INCOMPLETE'].includes(status)) {
        data.completedAt = new Date().toISOString();
      } else if (status === 'PENDING') {
        data.completedAt = null;
      }
    }

    const [updated] = await sql`
      UPDATE "Task"
      SET ${sql(data)}
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[PATCH /api/tasks] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;
    const roleResult = requireRole(authResult.user, TASK_ADMIN_ROLES);
    if (roleResult instanceof NextResponse) return roleResult;

    const { searchParams } = new URL(req.url);
    const result = deleteTaskSchema.safeParse({ id: searchParams.get('id') });

    if (!result.success) {
      throw new ValidationError('ID de tarea inválido', result.error.issues);
    }

    await sql`DELETE FROM "Task" WHERE "id" = ${result.data.id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message, details: error.details }, { status: 400 });
    }
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('[DELETE /api/tasks] Unexpected error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
