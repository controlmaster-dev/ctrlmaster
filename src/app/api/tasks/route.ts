import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiCreated, apiHandler } from '@/lib/api/handler';
import {
  createTasksForUser,
  deleteTaskById,
  getTasksForUser,
  updateTaskById,
} from '@/server/services/taskService';

const TASK_ADMIN_ROLES = ['ADMIN', 'BOSS', 'ENGINEER'];

const getTasksSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  date: z.string().optional(),
});

const createTasksSchema = z.object({
  userId: z.string().min(1, 'ID de usuario es requerido'),
  tasks: z.array(
    z.object({
      title: z.string().min(1, 'El titulo es requerido'),
      deadline: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora invalido (HH:mm)').optional().nullable(),
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

export const GET = apiHandler(
  { auth: true, querySchema: getTasksSchema },
  async ({ query }) => {
    const tasks = await getTasksForUser(query.userId, query.date);
    return NextResponse.json(tasks, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'no-store',
      },
    });
  }
);

export const POST = apiHandler(
  { auth: true, roles: TASK_ADMIN_ROLES, bodySchema: createTasksSchema },
  async ({ body }) => apiCreated(await createTasksForUser(body))
);

export const PATCH = apiHandler(
  { auth: true, bodySchema: updateTaskSchema },
  async ({ body }) => updateTaskById(body)
);

export const DELETE = apiHandler(
  { auth: true, roles: TASK_ADMIN_ROLES, querySchema: deleteTaskSchema },
  async ({ query }) => deleteTaskById(query.id)
);
