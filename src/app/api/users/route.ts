import { z } from 'zod';
import { apiCreated, apiHandler } from '@/lib/api/handler';
import { getUserFromToken } from '@/lib/auth';
import {
  createUserAccount,
  deleteUserAccount,
  getUsersDirectory,
  updateUserAccount,
} from '@/server/services/userService';

export const dynamic = 'force-dynamic';

const shiftSchema = z.object({
  days: z.array(z.number()),
  start: z.number(),
  end: z.number(),
});

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'BOSS', 'ENGINEER', 'OPERATOR']).optional().default('OPERATOR'),
  image: z.string().url().optional(),
  birthday: z.string().optional(),
  schedule: z.array(shiftSchema).optional(),
});

const updateUserSchema = z.object({
  id: z.string().min(1, 'ID de usuario es requerido'),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres').optional(),
  role: z.enum(['ADMIN', 'BOSS', 'ENGINEER', 'OPERATOR']).optional(),
  image: z.string().optional(),
  birthday: z.string().optional(),
  schedule: z.array(shiftSchema).nullable().optional(),
  tempSchedule: z.array(shiftSchema).nullable().optional(),
  weekStart: z.string().optional(),
});

const usersQuerySchema = z.object({
  weekStart: z.string().optional(),
});

const deleteUserQuerySchema = z.object({
  id: z.string().min(1, 'ID de usuario es requerido'),
});

export const GET = apiHandler(
  { querySchema: usersQuerySchema },
  async ({ req, query }) => {
    const token = req.cookies.get('auth-token')?.value;
    const sessionUser = token ? await getUserFromToken(token) : null;
    return getUsersDirectory({
      weekStart: query.weekStart,
      isAuthenticated: !!sessionUser,
    });
  }
);

export const POST = apiHandler(
  { auth: true, roles: ['ADMIN', 'BOSS', 'ENGINEER'], bodySchema: createUserSchema },
  async ({ body }) => apiCreated(await createUserAccount(body))
);

export const PATCH = apiHandler(
  { auth: true, roles: ['ADMIN', 'BOSS', 'ENGINEER'], bodySchema: updateUserSchema },
  async ({ body }) => updateUserAccount(body)
);

export const DELETE = apiHandler(
  { auth: true, roles: ['ADMIN', 'BOSS'], querySchema: deleteUserQuerySchema },
  async ({ query }) => deleteUserAccount(query.id)
);
