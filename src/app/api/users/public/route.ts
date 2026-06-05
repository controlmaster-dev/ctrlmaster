import { z } from 'zod';
import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api/handler';
import { CACHE_HEADERS } from '@/lib/httpCache';
import { getUsersDirectory } from '@/server/services/userService';

export const dynamic = 'force-dynamic';

const publicUsersQuerySchema = z.object({
  weekStart: z.string().optional(),
});

/** Directorio de operadores con datos mínimos (sin autenticación). */
export const GET = apiHandler(
  { querySchema: publicUsersQuerySchema },
  async ({ query }) => {
    const users = await getUsersDirectory({
      weekStart: query.weekStart,
      isAuthenticated: false,
    });

    return NextResponse.json(users, {
      headers: CACHE_HEADERS.publicShort(30),
    });
  }
);
